# Tarea 3 — Script de Auditoría S3 (Python + Boto3)

## Qué hace el script

Conecta a AWS y audita todos los S3 buckets en la región `us-east-1`, verificando:
- **Versionamiento**: `get_bucket_versioning` → status debe ser `Enabled`
- **Encriptación por defecto**: `get_bucket_encryption` → debe existir al menos una regla SSE

Genera el reporte exacto que pide la prueba:
- ✅ Buckets que cumplen **ambos** requisitos
- ⚠️ Buckets que **NO** tienen versionamiento habilitado
- ⚠️ Buckets que **NO** tienen encriptación por defecto habilitada

> Nota: un bucket que falle ambos controles aparece en las dos listas de incumplimiento (versionamiento y encriptación), tal como exige el enunciado del PDF.

## Pre-requisitos

- Python 3.9+
- AWS CLI instalado y configurado (o variables de entorno)
- Usuario IAM con permisos mínimos:
  - `s3:ListAllMyBuckets`
  - `s3:GetBucketLocation`
  - `s3:GetBucketVersioning`
  - `s3:GetEncryptionConfiguration`

## Instalación

```bash
pip install boto3
```

## Configuración de credenciales

### Opción A — AWS CLI (recomendado)
```bash
aws configure
# Access Key ID:     <tu-access-key>
# Secret Access Key: <tu-secret-key>
# Default region:    us-east-1
# Output format:     json
```

### Opción B — Variables de entorno
```bash
# Windows PowerShell
$env:AWS_ACCESS_KEY_ID     = "AKIA..."
$env:AWS_SECRET_ACCESS_KEY = "..."
$env:AWS_DEFAULT_REGION    = "us-east-1"

# Linux / macOS
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_DEFAULT_REGION="us-east-1"
```

## Ejecución

```bash
cd tarea3-auditoria
python audit_buckets.py
```

## Ejemplo de output

```
============================================================
  AWS S3 Governance Audit — Region: us-east-1
============================================================

Discovering buckets in region 'us-east-1'...

Found 3 bucket(s) in us-east-1.

============================================================
  GOVERNANCE COMPLIANCE REPORT — S3 / us-east-1
============================================================

  Total buckets audited : 3
  Fully compliant       : 1
  Non-compliant         : 2

────────────────────────────────────────────────────────────
  ✅ COMPLIANT (versioning + encryption enabled): 1
────────────────────────────────────────────────────────────
    • globalcustomerapp-pii-a1b2c3d4

────────────────────────────────────────────────────────────
  ⚠️  NO VERSIONING ENABLED: 2
────────────────────────────────────────────────────────────
    • old-logs-bucket
    • legacy-test-bucket

────────────────────────────────────────────────────────────
  ⚠️  NO DEFAULT ENCRYPTION ENABLED: 1
────────────────────────────────────────────────────────────
    • legacy-test-bucket

============================================================

  Action required: remediate flagged buckets to meet governance standards.
```

> En el ejemplo, `legacy-test-bucket` falla ambos controles, por lo que aparece tanto en "NO VERSIONING" como en "NO DEFAULT ENCRYPTION".

## Cambiar la región auditada

Editar la constante al inicio de `audit_buckets.py`:
```python
REGION = "us-east-1"  # cambiar por ej. "us-west-2"
```
