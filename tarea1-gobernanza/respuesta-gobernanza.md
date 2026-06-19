# Tarea 1: Estrategia de Gobernanza y Diseño

**Aplicación**: GlobalCustomerApp — Aplicación web global con PII + análisis de sentimiento IA  
**BU**: DigitalBU  
**Plataformas**: AWS (primaria), con consideraciones multi-nube (GCP, OCI)

---

## 1. Consideraciones de Gobernanza Clave

### 1.1 Seguridad

**Antes de iniciar el desarrollo**, se implementarían los siguientes controles:

**Clasificación y protección de datos PII:**
- Definir un **Data Classification Policy** formal: PII → Confidencial / Restricted.
- Habilitar **AWS Macie** (GCP Cloud DLP / OCI Data Safe) para descubrimiento y clasificación automática de PII en el object storage.
- Encriptación en tránsito obligatoria: TLS 1.2+ en todos los endpoints. Enforced mediante políticas de bucket (`aws:SecureTransport: true`) y ALB listeners HTTPS-only.
- Encriptación en reposo: SSE-KMS para producción (audit trail por AWS CloudTrail + KMS key policies), SSE-S3 como mínimo aceptable en entornos inferiores.

**Protección de red:**
- Arquitectura en VPC con subnets privadas para la capa de datos. Sin exposición directa a internet de bases de datos o storage.
- Security Groups restrictivos (least privilege en red): solo los puertos necesarios (443, no 80).
- WAF (AWS WAF o Cloud Armor en GCP) delante del API Gateway/Load Balancer para proteger contra OWASP Top 10.
- VPC endpoints para S3/DynamoDB: el tráfico no sale a internet público.

**Gestión de secretos:**
- Prohibir credenciales hardcodeadas en código. Usar **AWS Secrets Manager** (GCP Secret Manager / OCI Vault — Secrets).
- Rotación automática de secretos habilitada (cada 30-90 días).
- Integración con pipeline CI/CD para inyección segura en tiempo de ejecución.

### 1.2 Cumplimiento Normativo

**Frameworks aplicables** (dado que maneja PII de clientes globales):
- **GDPR** (clientes europeos): Right to erasure, data residency, data processing agreements.
- **SOC 2 Type II**: Controles de disponibilidad, confidencialidad, integridad.
- **PCI DSS** (si se maneja información de pago): segmentación de red, acceso restringido.
- **ISO 27001**: Marco de gestión de seguridad de la información.

**Controles concretos:**
- **AWS Config / GCP Config Connector**: Rules para detectar desviaciones (bucket público → alerta automática, MFA no habilitado → alerta).
- **AWS Organizations + Service Control Policies (SCPs)**: Prevenir creación de recursos fuera de regiones aprobadas. Ejemplo: `Deny` a `ec2:RunInstances` en regiones no aprobadas, permitiendo únicamente las regiones definidas según la residencia de datos de los usuarios (p. ej. `us-east-1`, `eu-west-1` y `sa-east-1`). Esto habilita la disponibilidad global de la app dentro de un conjunto controlado de regiones, en lugar de restringir a una sola geografía.
- **GCP Organization Policies**: Equivalente — `constraints/compute.restrictCloudRunRegion`.
- Data residency: Restringir creación de buckets/bases de datos a regiones aprobadas para PII (ej. `us-east-1`, `southamerica-east1`).
- **Audit logging obligatorio**: AWS CloudTrail (all regions, S3 access logs + management events), GCP Audit Logs → exportar a SIEM centralizado.

### 1.3 Costos (FinOps)

Ver sección 3 — FinOps más abajo.

### 1.4 Operaciones

**Controles operativos antes del lanzamiento:**

1. **Tagging Strategy obligatoria**: Ningún recurso sin los tags requeridos. Las cuatro llaves base son exactamente las que se aplican en el código de Terraform de la Tarea 2 — `Environment` (ej. `Production`), `ProjectName` (ej. `GlobalCustomerApp`), `DataClassification` (ej. `PII`) y `Owner` (ej. `DigitalBU`) — más `CostCenter` para habilitar el showback/chargeback de FinOps. Enforced via SCP/Org Policy que deniega la creación de recursos sin estas llaves. Esto mantiene la parte teórica y la implementación de IaC perfectamente sincronizadas.
2. **IaC-only policy**: Prohibir cambios manuales en producción. Todo recurso debe venir de Terraform/CDK/Deployment Manager. Detectar drift con `terraform plan` en CI/CD.
3. **Runbooks y playbooks**: Documentar procedimientos de incident response para: data breach, bucket público accidental, credenciales comprometidas.
4. **Backup y retención**: S3 Versioning + Lifecycle policies. RTO/RPO definidos antes del go-live.
5. **Monitoreo y alertas**: AWS CloudWatch Alarms + SNS para: errores 5xx > umbral, latencia > SLA, costos > budget threshold.
6. **Change Management**: Proceso de aprobación (CAB o PR review obligatorio) para cambios en producción.

---

## 2. Estrategia IAM — Principio de Mínimo Privilegio

### 2.1 Estructura de Roles (AWS IAM + Organizations)

#### Roles para el equipo humano (via AWS IAM Identity Center / SSO)

| Rol | Permisos | Acceso a |
|---|---|---|
| `Developer-ReadOnly` | `ReadOnlyAccess` + `S3:GetObject` en buckets de dev | Ambientes dev/staging |
| `Developer-Deploy` | `s3:PutObject`, `lambda:UpdateFunctionCode`, `ecs:UpdateService` (solo recursos con tag `Environment=dev`) | Dev únicamente |
| `Operator-Limited` | `CloudWatch:*`, `EC2:DescribeInstances`, `SSM:StartSession` | Prod (solo lectura + SSM) |
| `SecurityAuditor` | `SecurityAudit` managed policy, `AWS Config:*`, `CloudTrail:LookupEvents` | Todas las cuentas (read-only) |
| `CloudGovernance-Admin` | `AdministratorAccess` en cuenta de Management, acceso restringido en BU accounts | Management account |

**Política de acceso:**
- MFA obligatorio para todos los roles humanos (enforced via SCP: `Deny` si `aws:MultiFactorAuthPresent != true` en acciones sensibles).
- Sesiones con tiempo máximo de 4 horas (ninguna sesión permanente).
- No usar root account para operaciones — root account solo para billing y recuperación.

#### Roles para servicios/aplicaciones (IAM Roles — no users)

| Servicio | Rol IAM | Permisos mínimos |
|---|---|---|
| Aplicación web (ECS/EKS) | `app-globalcustomer-role` | `s3:GetObject`, `s3:PutObject` en bucket PII específico. `secretsmanager:GetSecretValue` para DB creds. Deny implícito en todo lo demás. |
| Lambda (procesamiento IA) | `lambda-sentiment-role` | `s3:GetObject` (solo prefijo `/comments/`), invoke API endpoint IA, `logs:CreateLogGroup` |
| CI/CD pipeline (CodePipeline/GitHub Actions) | `cicd-deploy-role` | `sts:AssumeRole` → `deploy-role` por ambiente. Sin acceso a producción sin aprobación manual. |
| Terraform (IaC) | `terraform-provisioning-role` | Permisos específicos por recurso (no `AdministratorAccess`). Scoped a resources con tag `ManagedBy=terraform`. |

### 2.2 Implementación práctica

```
# Estructura de cuentas AWS Organizations
Management Account (billing, SCPs, audit)
├── Security OU
│   └── Security Account (GuardDuty master, Macie, Security Hub)
├── Production OU
│   └── GlobalCustomerApp-Prod Account
├── Non-Production OU
│   ├── GlobalCustomerApp-Dev Account
│   └── GlobalCustomerApp-Staging Account
└── Shared Services OU
    └── Shared-Services Account (shared VPC, artifact registry, SSO)
```

**SCPs clave:**
- Deny acciones fuera de regiones aprobadas.
- Deny deshabilitación de CloudTrail.
- Deny creación de Access Keys para root.
- Require MFA para operaciones destructivas (delete*, terminate*).

### 2.3 Equivalencias IAM multi-nube (AWS / GCP / OCI)

| Concepto | AWS | GCP | OCI (Oracle Cloud) |
|---|---|---|---|
| Identidad federada / SSO | IAM Identity Center | Cloud Identity + Workforce Identity Federation | IAM con Identity Domains (IDCS) |
| Jerarquía y guardrails | Organizations + SCPs | Organization + Organization Policies | Tenancy + Compartments + Security Zones |
| Roles / permisos | IAM Roles & Policies | IAM Roles (Predefined + Custom) | IAM Policies + Groups |
| Identidad de servicio (sin claves) | IAM Roles (instance/Lambda) | Service Accounts | Instance Principals + Dynamic Groups |
| Detección de desviaciones | AWS Config | Policy Controller / Asset Inventory | Cloud Guard (detector recipes) |

### 2.4 Equivalencias de servicios de gobernanza (AWS / GCP / OCI)

| Capacidad | AWS | GCP | OCI |
|---|---|---|---|
| Object storage | S3 | Cloud Storage (GCS) | Object Storage |
| Cifrado gestionado / KMS | KMS | Cloud KMS | Vault (KMS) |
| Gestión de secretos | Secrets Manager | Secret Manager | Vault (Secrets) |
| Descubrimiento de PII | Macie | Cloud DLP | Data Safe |
| Audit logging | CloudTrail | Cloud Audit Logs | Audit service |
| Detección de amenazas / postura | GuardDuty + Security Hub | Security Command Center | Cloud Guard + Security Zones |
| WAF / protección perimetral | AWS WAF | Cloud Armor | OCI WAF |
| Gestión de costos (FinOps) | Cost Explorer + Budgets | Billing Reports + Budgets | Cost Analysis + Budgets |
| IaC nativo | CloudFormation | Deployment Manager | Resource Manager (Terraform gestionado) |

---

## 3. Optimización de Costos (FinOps)

### 3.1 Prácticas desde el día 0

**Visibilidad:**
- **Tagging obligatorio desde el inicio**: Sin tag `CostCenter`, el recurso queda en cuarentena. Esto es el único control que habilita el resto de FinOps.
- Activar **AWS Cost Explorer** + **AWS Budgets**: Alertas al 80% y 100% del presupuesto mensual por servicio y por tag.
- Dashboard en **AWS Cost and Usage Report (CUR)** exportado a S3 + Athena o QuickSight para visualización por equipo/proyecto.
- En GCP: **GCP Billing Reports** + **Budget Alerts** + **Cloud Monitoring**.

**Diseño cost-efficient:**
- **Right-sizing desde el inicio**: No sobredimensionar instancias. Comenzar con instancias pequeñas (t3.medium) y escalar basado en métricas reales.
- **Auto Scaling**: ECS/EKS con HPA (Horizontal Pod Autoscaler) para pagar solo por lo que se usa en producción.
- **Compute Savings Plans o Reserved Instances**: Una vez confirmado el uso baseline (después de 1-2 meses), comprar RI 1-año para ~40% descuento.
- **S3 Lifecycle policies**: Mover objetos PII a S3 Intelligent-Tiering o S3 Glacier después de 90 días (reducción de costo ~60%).
- **Data transfer optimization**: Usar VPC endpoints para evitar costos de NAT Gateway en accesos a S3.

**Prevención de sorpresas:**
- **Anomaly Detection (AWS Cost Anomaly Detection)**: Alerta si el gasto diario supera el umbral estadístico.
- Políticas de apagado automático en entornos no-prod: EC2 Scheduler para apagar dev/staging fuera de horario laboral (ahorro ~65%).
- Revisar **Trusted Advisor** semanalmente para recomendaciones de rightsizing.

**Proceso FinOps:**
- Reunión quincenal de revisión de costos entre Cloud Governance y DigitalBU.
- Reporte mensual de Unit Economics: costo por request, costo por usuario activo.
- Showback/chargeback por CostCenter tag desde el inicio del proyecto.

---

## 4. Gobernanza del Modelo de IA

### 4.1 Dos preocupaciones principales de gobernanza

#### Preocupación 1: Transmisión de datos PII al endpoint de IA
**Riesgo**: Los comentarios de usuarios contienen potencialmente PII (nombres, emails, información sensible). Si los comentarios se envían al API endpoint de IA externo sin sanitización, se viola GDPR y las políticas internas de PII.

**Medidas de mitigación:**
- Implementar una capa de **PII Scrubbing** antes de enviar datos al modelo: usar AWS Comprehend PII Detection o regex para anonimizar datos sensibles (names → `[NAME]`, emails → `[EMAIL]`).
- Revisar el **Data Processing Agreement (DPA)** del proveedor del modelo: ¿qué hace el proveedor con los datos? ¿Los usa para reentrenamiento?
- Logging de lo que se envía al modelo (sin PII) para audit trail.
- Si el modelo es externo (SaaS), evaluar si cumple SOC2 / ISO 27001.

#### Preocupación 2: Dependencia de terceros y cambio de modelo
**Riesgo**: Si el proveedor del modelo cambia su API, depreca el endpoint, o el modelo es reemplazado, los resultados de sentimiento pueden cambiar silenciosamente, afectando decisiones de negocio. Además, el acceso al endpoint puede ser un vector de ataque si las API keys no se gestionan correctamente.

**Medidas de mitigación:**
- **Gestión de API keys**: Nunca hardcodear. Rotación automática en AWS Secrets Manager. IAM policy para que solo el rol de la Lambda tenga acceso al secret.
- **Circuit breaker pattern**: Si el endpoint de IA falla, la aplicación degrada gracefully (no bloquear el flujo del usuario).
- **Model versioning**: Fijar la versión del modelo en la llamada API (ej. `model=v2.1`). Cualquier cambio de versión debe pasar por un proceso de validación con dataset de referencia.
- **Logging de inputs/outputs del modelo** (sin PII): Para detectar drift de calidad y auditar resultados.
- **Evaluación de sesgo (bias)**: Periódicamente testear el modelo con datasets representativos de la población latinoamericana para detectar sesgos de idioma/cultura.

---

## 5. Integración DevSecOps en CI/CD

### 5.1 Pipeline seguro — 3 puntos clave

**Punto 1: Static Analysis Security Testing (SAST) + Secrets Detection**
- **Herramientas**: `Checkov` o `tfsec` para análisis de Terraform IaC. `Bandit` para Python. `SonarQube` o `Semgrep` para código de aplicación.
- **Secrets Detection**: `git-secrets` o `truffleHog` en pre-commit hooks y en el pipeline para prevenir que API keys / credenciales lleguen al repositorio.
- **Cuándo**: En cada Pull Request, como gate obligatorio. El merge se bloquea si hay findings de severidad HIGH o CRITICAL.

**Punto 2: Vulnerability Scanning de Contenedores e Imágenes**
- **Herramientas**: `Amazon ECR image scanning` (integrado en ECR) o `Trivy` para escaneo de vulnerabilidades en imágenes Docker.
- `OWASP Dependency-Check` o `Snyk` para análisis de dependencias de terceros (npm, pip, maven).
- **Política**: No deployar imágenes con vulnerabilidades CRITICAL sin aprobación explícita del equipo de seguridad.
- **Cuándo**: En el step de build, antes de push a registry. También escaneo periódico de imágenes en reposo (scheduled scan).

**Punto 3: Infrastructure as Code (IaC) Policy Enforcement + Least Privilege en el Pipeline**
- **Herramientas**: `Open Policy Agent (OPA)` con `Conftest` para validar que el Terraform cumpla las políticas de gobernanza (tags obligatorios, no recursos públicos, regiones permitidas) antes del `terraform apply`.
- `HashiCorp Sentinel` si se usa Terraform Cloud/Enterprise.
- El pipeline de CI/CD usa roles IAM con permisos mínimos: el rol de deploy de dev NO puede tocar producción. El deploy a prod requiere aprobación manual adicional (manual gate en AWS CodePipeline o GitHub Environments).
- **Cuándo**: En la etapa de `plan`/`validate` del pipeline, como gate antes de apply.

**Flujo completo del pipeline:**
```
Code Push → PR
  ↓
[Pre-merge Gates]
  ├── SAST (Semgrep/Bandit)
  ├── Secrets detection (truffleHog)
  ├── Dependency scan (Snyk)
  └── IaC scan (Checkov/tfsec + OPA)
  ↓
PR Approved + Merge
  ↓
[Build Stage]
  ├── Build Docker image
  └── Container scan (Trivy/ECR scan)
  ↓
[Deploy to Dev/Staging]
  ├── Terraform plan (with OPA validation)
  ├── Terraform apply (dev role)
  └── Integration tests
  ↓
[Manual Approval Gate] ← Cloud Governance review
  ↓
[Deploy to Production]
  ├── Terraform apply (prod role, separate account)
  ├── Post-deploy smoke tests
  └── CloudTrail + CloudWatch monitoring
```

**Herramientas adicionales recomendadas:**
- **AWS Security Hub**: Centraliza findings de GuardDuty, Macie, Inspector, Config.
- **AWS GuardDuty**: Detección de amenazas en tiempo real (brute force, crypto mining, data exfil).
- **DAST (Dynamic Analysis)**: OWASP ZAP en el ambiente de staging antes de promover a producción.
