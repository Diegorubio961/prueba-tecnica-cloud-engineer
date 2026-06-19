output "bucket_name" {
  description = "Name of the created S3 bucket"
  value       = aws_s3_bucket.pii_bucket.id
}

output "bucket_arn" {
  description = "ARN of the created S3 bucket"
  value       = aws_s3_bucket.pii_bucket.arn
}

output "bucket_region" {
  description = "AWS region where the bucket was created"
  value       = aws_s3_bucket.pii_bucket.region
}

output "encryption_mode" {
  description = "Server-side encryption mode applied to the bucket"
  value       = var.use_customer_managed_key ? "SSE-KMS (customer-managed CMK, annual rotation)" : "SSE-S3 (AES-256, provider-managed)"
}

output "kms_key_arn" {
  description = "ARN of the KMS CMK (only when use_customer_managed_key = true)"
  value       = length(aws_kms_key.s3_pii) > 0 ? aws_kms_key.s3_pii[0].arn : "N/A — provider-managed SSE-S3"
}

output "versioning_status" {
  description = "Versioning status of the bucket"
  value       = aws_s3_bucket_versioning.pii_bucket_versioning.versioning_configuration[0].status
}
