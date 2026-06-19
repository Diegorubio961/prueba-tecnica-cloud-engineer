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
  description = "EC2 instance type for ECS. t3.medium provides 2 vCPU and 4 GB RAM, adequate for running frontend + backend containers with headroom for traffic spikes."
  type        = string
  default     = "t3.medium"
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
