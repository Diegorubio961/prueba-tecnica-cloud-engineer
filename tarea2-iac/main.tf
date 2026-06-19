terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

# Random suffix to ensure globally unique bucket name
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

locals {
  bucket_name = "${var.bucket_name_prefix}-${random_id.bucket_suffix.hex}"
  use_cmk     = var.use_customer_managed_key

  common_tags = {
    Environment        = var.environment
    ProjectName        = var.project_name
    DataClassification = var.data_classification
    Owner              = var.owner
    ManagedBy          = "terraform"
  }
}

# --- (Optional) Customer-managed KMS key ---
# The technical-test requirement asks for "provider-managed keys", which SSE-S3
# satisfies by default (use_customer_managed_key = false). For PII in a real
# production environment, a CMK adds per-key audit trail, granular access control,
# revocation, and annual rotation. Set use_customer_managed_key = true to enable it.
resource "aws_kms_key" "s3_pii" {
  count = local.use_cmk ? 1 : 0

  description             = "CMK for PII S3 bucket — ${var.project_name}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "RootAdminAccess"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "AllowS3ServiceUse"
        Effect    = "Allow"
        Principal = { Service = "s3.amazonaws.com" }
        Action    = ["kms:GenerateDataKey", "kms:Decrypt"]
        Resource  = "*"
      }
    ]
  })

  tags = merge(local.common_tags, { Name = "${var.project_name}-pii-cmk" })
}

resource "aws_kms_alias" "s3_pii" {
  count = local.use_cmk ? 1 : 0

  name          = "alias/${var.project_name}-s3-pii"
  target_key_id = aws_kms_key.s3_pii[0].key_id
}

# --- S3 Bucket ---
resource "aws_s3_bucket" "pii_bucket" {
  bucket = local.bucket_name
  tags   = local.common_tags
}

# --- Encryption at rest ---
# Default: SSE-S3 (AES-256), provider-managed — satisfies the requirement literally.
# Optional: SSE-KMS with the CMK above when use_customer_managed_key = true.
resource "aws_s3_bucket_server_side_encryption_configuration" "pii_bucket_encryption" {
  bucket = aws_s3_bucket.pii_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = local.use_cmk ? "aws:kms" : "AES256"
      kms_master_key_id = local.use_cmk ? aws_kms_key.s3_pii[0].arn : null
    }
    # Bucket key reduces KMS API call volume; only relevant for SSE-KMS.
    bucket_key_enabled = local.use_cmk
  }
}

# --- Versioning ---
resource "aws_s3_bucket_versioning" "pii_bucket_versioning" {
  bucket = aws_s3_bucket.pii_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# --- Block all public access (4 controls) ---
resource "aws_s3_bucket_public_access_block" "pii_bucket_public_access" {
  bucket = aws_s3_bucket.pii_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- Bucket Policy ---
resource "aws_s3_bucket_policy" "pii_bucket_policy" {
  bucket = aws_s3_bucket.pii_bucket.id

  depends_on = [aws_s3_bucket_public_access_block.pii_bucket_public_access]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      # Deny any request not using TLS — applies always
      [
        {
          Sid       = "DenyNonTLS"
          Effect    = "Deny"
          Principal = "*"
          Action    = "s3:*"
          Resource  = ["${aws_s3_bucket.pii_bucket.arn}", "${aws_s3_bucket.pii_bucket.arn}/*"]
          Condition = { Bool = { "aws:SecureTransport" = "false" } }
        }
      ],

      # When a CMK is used, reject uploads that do not specify it — prevents
      # objects being written with the wrong key or with SSE-S3.
      local.use_cmk ? [
        {
          Sid       = "DenyNonCMKUploads"
          Effect    = "Deny"
          Principal = "*"
          Action    = "s3:PutObject"
          Resource  = "${aws_s3_bucket.pii_bucket.arn}/*"
          Condition = {
            StringNotEqualsIfExists = {
              "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.s3_pii[0].arn
            }
          }
        }
      ] : [],

      # (Bonus) Restrict access to corporate network CIDR
      var.allowed_cidr != "" ? [
        {
          Sid       = "DenyOutsideCIDR"
          Effect    = "Deny"
          Principal = "*"
          Action    = "s3:*"
          Resource  = ["${aws_s3_bucket.pii_bucket.arn}", "${aws_s3_bucket.pii_bucket.arn}/*"]
          Condition = {
            NotIpAddress = { "aws:SourceIp" = [var.allowed_cidr] }
            StringNotEquals = {
              "aws:PrincipalServiceName" = ["cloudtrail.amazonaws.com", "config.amazonaws.com"]
            }
          }
        }
      ] : [],

      # (Bonus) Allow access from designated VPC endpoint
      var.vpc_endpoint_id != "" ? [
        {
          Sid       = "AllowVPCEndpoint"
          Effect    = "Allow"
          Principal = "*"
          Action    = "s3:*"
          Resource  = ["${aws_s3_bucket.pii_bucket.arn}", "${aws_s3_bucket.pii_bucket.arn}/*"]
          Condition = { StringEquals = { "aws:SourceVpce" = var.vpc_endpoint_id } }
        }
      ] : []
    )
  })
}

# --- Lifecycle policy: tiered retention for versioned PII objects ---
resource "aws_s3_bucket_lifecycle_configuration" "pii_bucket_lifecycle" {
  bucket = aws_s3_bucket.pii_bucket.id

  rule {
    id     = "pii-version-tiering"
    status = "Enabled"

    # Empty filter = rule applies to all objects in the bucket
    filter {}

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}
