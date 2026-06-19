# Infraestructura ECS — HelloWorld App

## Arquitectura

```
Internet
    │ :80
    ▼
┌──────────────────────────────────────────────┐
│  EC2 t2.micro  —  ECS Container Instance      │
│  ┌──────────────────────────────────────┐    │
│  │         ECS Task  (host network)     │    │
│  │  ┌───────────┐     ┌─────────────┐  │    │
│  │  │ Frontend  │────▶│   Backend   │  │    │
│  │  │  Nginx    │     │  Node.js    │  │    │
│  │  │  :80      │     │  :3000      │  │    │
│  │  └───────────┘     └──────┬──────┘  │    │
│  └─────────────────────────── │ ────────┘    │
└────────────────────────────── │ ─────────────┘
                                │ :5432 (VPC privado)
                                ▼
                    ┌────────────────────┐
                    │  RDS PostgreSQL 16 │
                    │  db.t3.micro       │
                    │  (subnet privada)  │
                    └────────────────────┘

ECR ──────── repositorios de imágenes Docker
CloudWatch ─ logs de contenedores (7 días)
```

**Decisión de diseño — `host` network mode:**
En ECS on EC2 con modo `host`, todos los contenedores del task comparten el namespace de red del EC2. Esto permite que el nginx del frontend haga proxy directo a `http://localhost:3000` (backend) sin necesidad de un mecanismo adicional de service discovery. Para un workload de instancia única como este, este modelo simplifica la topología de red y evita una capa de infraestructura que añade complejidad operativa sin aportar redundancia real hasta que se escale horizontalmente.

## Costo estimado (us-east-1) — optimizado a Free Tier (~$0)

Esta infraestructura está dimensionada **por defecto** para la capa gratuita de AWS. En una cuenta nueva (< 12 meses) el costo objetivo es **~$0**.

| Recurso | Especificación | Free Tier (cuenta < 12 meses) | Fuera de Free Tier |
|---|---|---|---|
| EC2 t2.micro | 1 vCPU · 1 GB RAM | ✅ 750 h/mes | ~$8.50 / mes |
| EBS gp2 30 GB (encriptado) | Disco del host ECS | ✅ 30 GB incluidos | ~$3 / mes |
| RDS PostgreSQL db.t3.micro | 20 GB gp2 | ✅ 750 h/mes + 20 GB | ~$15 / mes |
| ECR 2 repos | ~200 MB por imagen | ✅ 500 MB incluidos | ~$0.50 / mes |
| CloudWatch Logs (7 días) | ~ <1 GB / mes | ✅ 5 GB ingest incluidos | ~$0.50 / mes |
| Elastic IP | Asociado a instancia activa | ✅ gratis si la instancia corre | — |
| **Total** | | **~$0** | **~$28 / mes** |

> **Importante**: el Free Tier de EC2/RDS dura 12 meses desde la creación de la cuenta. Cuando termines de probar, ejecuta `terraform destroy` para no acumular cargos. Performance Insights y Container Insights están **desactivados por defecto** justamente para mantener el costo en $0.
>
> Si en el futuro quisieras un dimensionamiento productivo (mayor disponibilidad), basta con sobreescribir variables en `terraform.tfvars` (`instance_type`, `db_instance_class`, etc.) y añadir un Auto Scaling Group + ALB.

## Pre-requisitos

- AWS CLI configurado (`aws configure`)
- Terraform >= 1.3.0
- Docker Desktop instalado
- Key Pair creado en AWS (EC2 → Key Pairs → Create)

## Despliegue paso a paso

### 1 — Crear `infra/terraform.tfvars`
Copia `terraform.tfvars.example` a `terraform.tfvars` y rellena los secretos. **No necesitas tocar tamaños** — los defaults ya son Free Tier.
```hcl
key_name       = "helloworld-key"
db_password    = "MiClaveSegura123!"
jwt_secret     = "una_clave_aleatoria_de_al_menos_32_caracteres"
okta_issuer    = "https://dev-XXXXXXXX.okta.com/oauth2/default"  # vacío si solo usarás login local
okta_client_id = "tu_client_id_de_okta"                          # vacío si solo usarás login local
```

### 2 — Actualizar environment de producción del frontend
Editar `frontend/src/environments/environment.prod.ts` con la IP que entregará Terraform:
```typescript
okta: {
  issuer:      'https://dev-XXXXXXXX.okta.com/oauth2/default',
  clientId:    'tu_client_id',
  redirectUri: 'http://<PUBLIC_IP>/login/callback',
}
```

### 3 — Provisionar infraestructura
```bash
cd helloWorld/infra
terraform init
terraform plan
terraform apply    # Tarda ~8-10 minutos (RDS tarda más)
```

Anotar outputs:
```
public_ip        = "X.X.X.X"
app_url          = "http://X.X.X.X"
ecr_backend_url  = "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/helloworld-backend"
ecr_frontend_url = "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/helloworld-frontend"
```

### 4 — Build y push de imágenes a ECR
```powershell
# Desde infra/
.\push-images.ps1
```

### 5 — Forzar deployment ECS
```bash
aws ecs update-service \
  --cluster helloworld-cluster \
  --service helloworld-service \
  --force-new-deployment \
  --region us-east-1
```

### 6 — Verificar
```bash
aws ecs describe-services \
  --cluster helloworld-cluster \
  --services helloworld-service \
  --region us-east-1

aws logs tail /ecs/helloworld --follow --region us-east-1
```

### 7 — Actualizar Okta
En Okta Console → Applications → HelloWorld:
- Sign-in redirect URI: `http://<public_ip>/login/callback`
- Sign-out redirect URI: `http://<public_ip>`

## Actualizar la aplicación

```powershell
.\push-images.ps1
aws ecs update-service --cluster helloworld-cluster --service helloworld-service --force-new-deployment --region us-east-1
```

## Destruir infraestructura (IMPORTANTE para no acumular cargos)

```bash
terraform destroy
# Confirmar con: yes
```

> Con los defaults Free Tier, `deletion_protection = false` y `skip_final_snapshot = true`, por lo que el `destroy` funciona limpio sin pasos extra. Hazlo siempre que termines de probar.
