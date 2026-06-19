variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "key_name" {
  description = "EC2 Key Pair name (must exist in AWS). Used to SSH into the ECS container instance."
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into the instance (e.g. your public IP: X.X.X.X/32)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "instance_type" {
  description = "EC2 instance type for the ECS host. t2.micro is Free Tier eligible (750 h/month for 12 months) and suffices for the frontend + backend containers in a demo."
  type        = string
  default     = "t2.micro"
}

variable "project_name" {
  description = "Prefix for resource names and tags"
  type        = string
  default     = "helloworld"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "hwuser"
}

variable "db_password" {
  description = "PostgreSQL master password (min 8 chars)"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "helloworld"
}

variable "jwt_secret" {
  description = "Secret key for signing local JWTs (min 32 chars)"
  type        = string
  sensitive   = true
}

variable "okta_issuer" {
  description = "Okta issuer URL (e.g. https://dev-XXXXXXXX.okta.com/oauth2/default)"
  type        = string
  default     = ""
}

variable "okta_client_id" {
  description = "Okta application client ID"
  type        = string
  default     = ""
}

variable "frontend_url" {
  description = "Public URL of the frontend (used for CORS). Updated after deploy with EC2 public IP."
  type        = string
  default     = "http://localhost"
}

# ─── Sizing / cost knobs ────────────────────────────────────────────────
# Defaults are Free-Tier-eligible (~$0) by design: this project is optimized
# for the lowest possible cost. If you ever need a production-grade size,
# override these in terraform.tfvars (e.g. db.t3.small, gp3, insights on).

variable "db_instance_class" {
  description = "RDS instance class. db.t3.micro is Free Tier eligible (750 h/month for 12 months)."
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS storage in GB. Free Tier covers up to 20 GB."
  type        = number
  default     = 20
}

variable "db_storage_type" {
  description = "RDS storage type. gp2 is Free Tier eligible."
  type        = string
  default     = "gp2"
}

variable "enable_db_performance_insights" {
  description = "Enable RDS Performance Insights. Off by default to keep cost at $0."
  type        = bool
  default     = false
}

variable "enable_deletion_protection" {
  description = "Protect the RDS instance from deletion. Off by default so 'terraform destroy' works cleanly when you finish learning."
  type        = bool
  default     = false
}

variable "skip_final_snapshot" {
  description = "Skip the final RDS snapshot on destroy. True by default for fast/cheap teardown."
  type        = bool
  default     = true
}

variable "enable_container_insights" {
  description = "Enable ECS Container Insights (CloudWatch custom metrics, has a cost). Off by default for Free Tier."
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days (kept low to stay within the Free Tier ingest allowance)."
  type        = number
  default     = 7
}

variable "ec2_volume_size" {
  description = "Root EBS volume size in GB for the ECS host. Free Tier covers up to 30 GB."
  type        = number
  default     = 30
}
