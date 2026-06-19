# ── ECR repositories for container images ────────────────────────────────────
# Free tier: 500 MB of storage per month

resource "aws_ecr_repository" "backend" {
  name                 = "${var.project_name}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true # Free vulnerability scanning on every push
  }

  tags = {
    Name               = "${var.project_name}-backend"
    ProjectName        = "GlobalCustomerApp"
    DataClassification = "PII"
    Owner              = "DigitalBU"
    Environment        = "Production"
    ManagedBy          = "terraform"
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "${var.project_name}-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name               = "${var.project_name}-frontend"
    ProjectName        = "GlobalCustomerApp"
    DataClassification = "PII"
    Owner              = "DigitalBU"
    Environment        = "Production"
    ManagedBy          = "terraform"
  }
}

# Lifecycle policy: keep only last 5 images to minimize storage cost
resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "frontend" {
  repository = aws_ecr_repository.frontend.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = { type = "expire" }
    }]
  })
}
