# HelloWorld — Descripción del Despliegue en AWS

> **Estado**: Este documento describe **cómo se desplegaría** la aplicación HelloWorld en AWS siguiendo las recomendaciones acordadas (base de datos en servicio separado + autenticación con Okta + orquestación en ECS). **No se ha ejecutado ningún despliegue real.** El código de infraestructura como referencia ya está escrito en la carpeta [`infra/`](infra/).

---

## 1. Recomendaciones aplicadas

La aplicación original era un monolito de contenedores con Angular + Node.js + **SQLite** y autenticación **JWT local**. Sobre esa base se aplicaron tres recomendaciones:

| # | Recomendación | Cómo se materializa |
|---|---|---|
| 1 | **Base de datos en servicio separado** | SQLite → **PostgreSQL** como servicio independiente (RDS en AWS, contenedor `postgres` en local). Separa el estado del cómputo, habilita backups gestionados y escalabilidad. |
| 2 | **Autenticación con Okta** | Se añadió **Okta OIDC (flujo PKCE)** en el frontend Angular y verificación de tokens Okta en el backend, conviviendo con el login local existente. |
| 3 | **Orquestación en ECS** | El `docker-compose` local se traduce a una **ECS Task Definition** sobre un cluster ECS on EC2. |

---

## 2. Arquitectura objetivo en AWS

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
                    │  (subnet privada)  │
                    └────────────────────┘

Okta (IdP externo) ── OIDC / PKCE con el frontend
ECR ──────────────── imágenes Docker (backend, frontend)
CloudWatch ───────── logs de los contenedores
```

**Componentes:**
- **VPC** con subnet pública (host ECS) y dos subnets privadas (RDS, requiere 2 AZs).
- **ECS on EC2** en modo de red `host`: el nginx del frontend hace proxy a `localhost:3000`, evitando una capa de balanceo para una topología de instancia única.
- **RDS PostgreSQL** en subnets privadas, accesible solo desde el Security Group del host ECS.
- **ECR** para alojar las imágenes con escaneo de vulnerabilidades en cada push.
- **CloudWatch Logs** para la observabilidad de ambos contenedores.
- **Okta** como proveedor de identidad externo (SaaS).

---

## 3. Secuencia de despliegue (descriptiva)

1. **Prerrequisitos**: cuenta AWS, AWS CLI configurado, Terraform, Docker, y un Key Pair EC2.
2. **Cuenta Okta**: crear una app OIDC tipo SPA en Okta y obtener `Issuer` + `Client ID`. Registrar las redirect URIs.
3. **Variables**: rellenar `infra/terraform.tfvars` (password de RDS, JWT secret, datos de Okta) y `frontend/src/environments/environment.prod.ts` (datos de Okta + IP pública).
4. **Provisionar** con `terraform apply` desde `infra/` — crea VPC, RDS, ECS, ECR, IAM y la EIP. RDS es el recurso que más tarda (~8-10 min).
5. **Construir y publicar imágenes** a ECR (`infra/push-images.ps1` construye backend y frontend, hace login a ECR y push).
6. **Desplegar la task** forzando un nuevo deployment del ECS Service; ECS arranca el backend (espera healthcheck) y luego el frontend.
7. **Cerrar el círculo en Okta**: actualizar las redirect URIs con la IP pública real.
8. **Verificar**: revisar el estado del ECS Service y los logs en CloudWatch; abrir `http://<IP>`.

El detalle ejecutable (comandos exactos, variables y troubleshooting) está en [`infra/README.md`](infra/README.md).

---

## 4. Costo estimado (us-east-1) — optimizado a Free Tier (~$0)

Este proyecto está dimensionado **por defecto** para la capa gratuita de AWS. En una cuenta nueva (< 12 meses), el costo objetivo es **~$0**.

| Recurso | Especificación | Free Tier | Fuera de Free Tier |
|---|---|---|---|
| EC2 t2.micro | 1 vCPU · 1 GB RAM | ✅ 750 h/mes | ~$8.50 / mes |
| EBS gp2 30 GB (encriptado) | Disco del host ECS | ✅ 30 GB incluidos | ~$3 / mes |
| RDS PostgreSQL db.t3.micro | 20 GB gp2 | ✅ 750 h/mes + 20 GB | ~$15 / mes |
| ECR (2 repos) | ~200 MB por imagen | ✅ 500 MB incluidos | ~$0.50 / mes |
| CloudWatch Logs (7 días) | < 1 GB / mes | ✅ 5 GB ingest | ~$0.50 / mes |
| Okta | Plan developer | ✅ sin costo (developer) | Según contrato |
| **Total** | | **~$0** | **~$28 / mes** |

> Performance Insights y Container Insights están desactivados por defecto para mantener el costo en $0. Cuando termines de probar, ejecuta `terraform destroy`. Para un entorno productivo con alta disponibilidad, se sobreescriben las variables de tamaño y se añade Auto Scaling Group + ALB.

---

## 5. Estado del código

- ✅ **Modificaciones de aplicación** (PostgreSQL + Okta) — ya aplicadas en `backend/` y `frontend/`.
- ✅ **Infraestructura como código** (ECS + RDS + ECR + IAM) — escrita en `infra/`, lista para `terraform apply`.
- ⏸️ **Despliegue real en AWS** — **pendiente / no ejecutado** por decisión actual.
