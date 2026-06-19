# Infraestructura ECS — HelloWorld App

## Arquitectura

```
Internet
    │ :80
    ▼
┌──────────────────────────────────────────────┐
│  EC2 t3.medium  —  ECS Container Instance    │
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
                    │  db.t3.small       │
                    │  (subnet privada)  │
                    └────────────────────┘

ECR ──────── repositorios de imágenes Docker
CloudWatch ─ logs de contenedores (30 días)
```

**Decisión de diseño — `host` network mode:**
En ECS on EC2 con modo `host`, todos los contenedores del task comparten el namespace de red del EC2. Esto permite que el nginx del frontend haga proxy directo a `http://localhost:3000` (backend) sin necesidad de un mecanismo adicional de service discovery. Para un workload de instancia única como este, este modelo simplifica la topología de red y evita una capa de infraestructura que añade complejidad operativa sin aportar redundancia real hasta que se escale horizontalmente.

## Costo estimado (us-east-1, ambiente productivo)

| Recurso | Especificación | Precio referencial |
|---|---|---|
| EC2 t3.medium | 2 vCPU · 4 GB RAM | ~$30 / mes |
| EBS gp3 30 GB (encriptado) | Disco del host ECS | ~$2.40 / mes |
| RDS PostgreSQL db.t3.small | 2 vCPU · 2 GB RAM · 50 GB gp3 | ~$30 / mes |
| RDS Performance Insights (7 días) | Incluido | $0 |
| ECR 2 repos | ~200 MB por imagen | ~$0.50 / mes |
| CloudWatch Logs (30 días) | Estimado ~2 GB / mes | ~$1.00 / mes |
| Elastic IP | Asociado a instancia activa | $0 |
| Data transfer (estimado) | ~10 GB salida / mes | ~$0.90 / mes |
| **Total estimado** | | **~$65 / mes** |

> Para mayor disponibilidad en producción se recomienda evolucionar hacia: Auto Scaling Group (mínimo 2 instancias en AZs distintas) + Application Load Balancer (~$16/mes adicionales), lo que también habilita rolling deployments sin downtime.

## Pre-requisitos

- AWS CLI configurado (`aws configure`)
- Terraform >= 1.3.0
- Docker Desktop instalado
- Key Pair creado en AWS (EC2 → Key Pairs → Create)

## Despliegue paso a paso

### 1 — Crear `infra/terraform.tfvars`
```hcl
key_name       = "helloworld-key"
db_password    = "MiClaveSegura123!"
jwt_secret     = "una_clave_aleatoria_de_al_menos_32_caracteres"
okta_issuer    = "https://dev-XXXXXXXX.okta.com/oauth2/default"
okta_client_id = "tu_client_id_de_okta"
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

## Destruir infraestructura

```bash
terraform destroy
# ⚠️  RDS tiene deletion_protection = true — desactivar primero:
# terraform apply -var='...' # actualizar deletion_protection a false
# terraform destroy
```
