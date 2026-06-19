# Tarea 2 — IaC: S3 Bucket PII Seguro (AWS + Terraform)

## Requisitos cumplidos

| Requisito | Implementación | Estado |
|---|---|---|
| Encriptación en reposo (claves del proveedor) | SSE-S3 (AES-256) por defecto — gestionada por AWS | ✅ |
| Versionamiento | `versioning_configuration.status = Enabled` | ✅ |
| Acceso privado | `aws_s3_bucket_public_access_block` — los 4 controles en `true` | ✅ |
| Tag: Environment | `Production` | ✅ |
| Tag: ProjectName | `GlobalCustomerApp` | ✅ |
| Tag: DataClassification | `PII` | ✅ |
| Tag: Owner | `DigitalBU` | ✅ |
| **Bonus**: Bucket policy por CIDR/VPC | `DenyOutsideCIDR` + `AllowVPCEndpoint` | ✅ |

## Decisiones de diseño

- **Encriptación — provider-managed por defecto, CMK opcional**: El requisito pide explícitamente *"claves gestionadas por el proveedor"*. Por defecto el bucket usa **SSE-S3 (AES-256)**, que cumple el requisito al pie de la letra (la clave la gestiona AWS). Para un entorno productivo real con PII, la práctica recomendada es endurecer con una **clave gestionada por el cliente (CMK)** —que aporta trail de auditoría por clave, control de acceso granular, rotación anual y revocabilidad, alineado con GDPR/SOC 2/ISO 27001—. Esto se activa con `use_customer_managed_key = true` sin tocar el resto del código. Se documenta el camino de endurecimiento sin desviar del requisito literal.

- **DenyNonCMKUploads** (solo con CMK activo): Cuando se usa CMK, el bucket policy rechaza cualquier `PutObject` que no especifique el ARN de la clave, previniendo objetos cifrados con una clave incorrecta.

- **TLS enforcement**: `DenyNonTLS` bloquea cualquier request sin HTTPS. Con PII, la transmisión en texto claro no es negociable.

- **Lifecycle tiering**: Las versiones no-actuales se archivan a Glacier a los 90 días y expiran a los 365 — equilibra retención regulatoria con gestión de almacenamiento a largo plazo.

- **Nombre único**: `random_id` garantiza unicidad global del bucket name.

## Pre-requisitos

1. **Cuenta AWS** con usuario IAM con:
   - `AmazonS3FullAccess` (suficiente para la configuración por defecto SSE-S3)
   - `AWSKeyManagementServicePowerUser` (solo si se activa `use_customer_managed_key = true`)
2. **Terraform >= 1.3.0** instalado
3. **AWS CLI** configurado con credenciales (`aws configure`)

## Instalación y ejecución

```bash
# 1. Ir al directorio
cd tarea2-iac

# 2. Inicializar Terraform (descarga providers)
terraform init

# 3. Ver el plan de recursos a crear
terraform plan

# 4. Aplicar
terraform apply
# Confirmar con: yes

# 5. Ver los outputs (incluye ARN de KMS key y bucket)
terraform output
```

## Destruir recursos

```bash
terraform destroy
# Confirmar con: yes
# Nota: la KMS key tiene un período de eliminación de 30 días por seguridad
```

## Variables personalizables

```hcl
# terraform.tfvars
aws_region               = "us-east-1"
use_customer_managed_key = true            # Endurecimiento PII con CMK (opcional)
allowed_cidr             = "203.0.113.0/24" # Rango IP corporativo
vpc_endpoint_id          = "vpce-xxxxxxxxx" # VPC endpoint S3 de la red corporativa
```

## Costo estimado (entorno productivo, us-east-1)

| Componente | Precio referencial |
|---|---|
| S3 Standard storage | $0.023 / GB / mes |
| S3 requests | $0.005 / 1k PUTs · $0.0004 / 1k GETs |
| Encriptación SSE-S3 (por defecto) | Incluida en S3, sin cargo separado |
| KMS CMK (solo si se activa) | $1.00 / clave / mes + ~$0.03 / 100k calls |
| S3 Glacier (versiones archivadas) | $0.004 / GB / mes |
| Datos transferidos (salida) | $0.09 / GB |

> La configuración por defecto (SSE-S3) no añade costo de cifrado. Si se activa el CMK para endurecer la protección de PII, el costo incremental dominante es ~$1/mes por clave — un costo trivial frente al valor de control de acceso, auditoría y cumplimiento que aporta en un contexto corporativo.
