variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "bucket_name_prefix" {
  description = "Prefix for the S3 bucket name (must be globally unique; a random suffix is appended)"
  type        = string
  default     = "globalcustomerapp-pii"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "Production"
}

variable "project_name" {
  description = "Project name tag"
  type        = string
  default     = "GlobalCustomerApp"
}

variable "data_classification" {
  description = "Data classification level"
  type        = string
  default     = "PII"
}

variable "owner" {
  description = "Business unit that owns the resource"
  type        = string
  default     = "DigitalBU"
}

# Encryption mode. Default (false) = SSE-S3 (AES-256), provider-managed,
# which satisfies the requirement "claves gestionadas por el proveedor".
# Set true to use a customer-managed KMS key (CMK) for PII hardening.
variable "use_customer_managed_key" {
  description = "false = SSE-S3 provider-managed (default, meets requirement). true = customer-managed KMS CMK (PII hardening)."
  type        = bool
  default     = false
}

# Bonus: restrict bucket access to this CIDR range (corporate network)
variable "allowed_cidr" {
  description = "CIDR block allowed to access the bucket via bucket policy (bonus restriction)"
  type        = string
  default     = "10.0.0.0/8"
}

# Bonus: VPC endpoint ID — if provided, bucket policy will also allow access from this VPC endpoint
variable "vpc_endpoint_id" {
  description = "VPC Endpoint ID for S3 (optional). If set, bucket policy restricts access to this endpoint."
  type        = string
  default     = ""
}
