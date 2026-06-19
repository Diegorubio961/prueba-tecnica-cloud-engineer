output "public_ip" {
  description = "Public IP of the ECS container instance"
  value       = aws_eip.ecs.public_ip
}

output "app_url" {
  description = "URL to access the application"
  value       = "http://${aws_eip.ecs.public_ip}"
}

output "ssh_command" {
  description = "SSH command to connect to the ECS container instance"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ec2-user@${aws_eip.ecs.public_ip}"
}

output "ecr_backend_url" {
  description = "ECR repository URL for backend image"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  description = "ECR repository URL for frontend image"
  value       = aws_ecr_repository.frontend.repository_url
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint (private, accessible only from within VPC)"
  value       = aws_db_instance.postgres.address
}

output "ecs_cluster_name" {
  description = "ECS Cluster name"
  value       = aws_ecs_cluster.main.name
}

output "push_backend_cmd" {
  description = "Command to build and push the backend image to ECR"
  value       = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com && docker build -t ${aws_ecr_repository.backend.repository_url}:latest ../backend && docker push ${aws_ecr_repository.backend.repository_url}:latest"
}

output "push_frontend_cmd" {
  description = "Command to build and push the frontend image to ECR (uses ECS nginx config)"
  value       = "docker build -f ../frontend/Dockerfile.ecs -t ${aws_ecr_repository.frontend.repository_url}:latest ../frontend && docker push ${aws_ecr_repository.frontend.repository_url}:latest"
}
