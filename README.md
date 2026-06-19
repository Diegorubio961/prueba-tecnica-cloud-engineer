# Prueba Técnica — Cloud Engineer

Entregables de la prueba técnica de Cloud Engineer (Gobierno de Nube), enfocada en entornos cloud seguros, conformes y eficientes en un contexto multi-nube (AWS / GCP / OCI).

## Estructura

| Carpeta | Contenido |
|---|---|
| [`tarea1-gobernanza/`](tarea1-gobernanza/) | Estrategia de gobernanza y diseño (respuesta escrita): seguridad, cumplimiento, IAM de mínimo privilegio, FinOps, gobernanza del modelo de IA y DevSecOps. Incluye equivalencias AWS / GCP / OCI. |
| [`tarea2-iac/`](tarea2-iac/) | Infraestructura como código (Terraform) — bucket S3 seguro para PII: encriptación en reposo, versionamiento, acceso privado, tagging de gobernanza y política de acceso por red (bonus). Validado con `terraform validate`. |
| [`tarea3-auditoria/`](tarea3-auditoria/) | Script de auditoría en Python (Boto3) que verifica versionamiento y encriptación por defecto en los buckets S3 de una región. |
| [`helloWorld/`](helloWorld/) | Aplicación web full-stack (Angular + Node.js) con **base de datos PostgreSQL en contenedor independiente** y autenticación con **Okta (OIDC/PKCE)** además de login local. Orquestada con `docker-compose`. |

## Plataforma elegida para las tareas prácticas

**AWS** para las Tareas 2 y 3, con consideraciones conceptuales multi-nube (GCP y OCI) en la Tarea 1.

## Cómo ejecutar cada entrega

Cada carpeta incluye su propio `README.md` con instrucciones detalladas:
- **Tarea 2**: `cd tarea2-iac && terraform init && terraform validate`
- **Tarea 3**: `cd tarea3-auditoria && pip install boto3 && python audit_buckets.py`
- **HelloWorld**: `cd helloWorld && cp .env.example .env` (ajustar valores) `&& docker compose up -d --build`
