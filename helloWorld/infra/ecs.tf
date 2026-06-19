# ── ECS Cluster ───────────────────────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled" # Off by default (Free Tier)
  }

  tags = {
    Name        = "${var.project_name}-cluster"
    Environment = "Production"
    ManagedBy   = "terraform"
  }
}

# ── EC2 Container Instance (ECS host) ────────────────────────────────────────
# Uses the ECS-optimized AMI which ships with the ECS agent and Docker pre-installed.
# t2.micro (Free Tier) hosts the frontend and backend containers for this demo;
# the database runs separately in RDS, so the host only carries the app containers.

resource "aws_instance" "ecs_host" {
  ami                    = data.aws_ssm_parameter.ecs_ami.value
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ecs_instance.id]
  key_name               = var.key_name
  iam_instance_profile   = aws_iam_instance_profile.ecs_instance_profile.name

  user_data = base64encode(<<-EOF
    #!/bin/bash
    echo ECS_CLUSTER=${aws_ecs_cluster.main.name} >> /etc/ecs/ecs.config
    echo ECS_ENABLE_TASK_IAM_ROLE=true >> /etc/ecs/ecs.config
    echo ECS_ENABLE_TASK_IAM_ROLE_NETWORK_HOST=true >> /etc/ecs/ecs.config
  EOF
  )

  root_block_device {
    volume_size = var.ec2_volume_size # Free Tier: up to 30 GB
    volume_type = "gp2"               # gp2 is Free Tier eligible
    encrypted   = true
  }

  tags = {
    Name               = "${var.project_name}-ecs-host"
    Environment        = "Production"
    ProjectName        = "GlobalCustomerApp"
    DataClassification = "PII"
    Owner              = "DigitalBU"
    ManagedBy          = "terraform"
  }
}

# ── CloudWatch Log Group ──────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = var.log_retention_days # 7 days by default (Free Tier ingest allowance)
  tags              = { ManagedBy = "terraform" }
}

# ── ECS Task Definition ───────────────────────────────────────────────────────
# network_mode = "host": both containers share the EC2's network namespace,
# allowing the nginx frontend to proxy to the backend at localhost:3000.
# This removes the need for an Application Load Balancer in this topology,
# which simplifies the deployment for a single-instance workload.

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-app"
  network_mode             = "host"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend.repository_url}:latest"
      essential = true
      portMappings = [
        { containerPort = 3000, hostPort = 3000, protocol = "tcp" }
      ]
      environment = [
        { name = "PORT", value = "3000" },
        { name = "NODE_ENV", value = "production" },
        { name = "POSTGRES_HOST", value = aws_db_instance.postgres.address },
        { name = "POSTGRES_PORT", value = "5432" },
        { name = "POSTGRES_DB", value = var.db_name },
        { name = "POSTGRES_USER", value = var.db_username },
        { name = "POSTGRES_PASSWORD", value = var.db_password },
        { name = "JWT_SECRET", value = var.jwt_secret },
        { name = "JWT_EXPIRES_IN", value = "1h" },
        { name = "OKTA_ISSUER", value = var.okta_issuer },
        { name = "OKTA_CLIENT_ID", value = var.okta_client_id },
        { name = "FRONTEND_URL", value = "http://${aws_eip.ecs.public_ip}" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
      healthCheck = {
        command     = ["CMD-SHELL", "wget -qO- http://localhost:3000/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 30
      }
    },
    {
      name      = "frontend"
      image     = "${aws_ecr_repository.frontend.repository_url}:latest"
      essential = true
      portMappings = [
        { containerPort = 80, hostPort = 80, protocol = "tcp" }
      ]
      dependsOn = [
        { containerName = "backend", condition = "HEALTHY" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "frontend"
        }
      }
    }
  ])

  tags = { ManagedBy = "terraform" }
}

# ── ECS Service ───────────────────────────────────────────────────────────────
resource "aws_ecs_service" "app" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "EC2"

  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100

  tags = {
    Name        = "${var.project_name}-service"
    Environment = "Production"
    ManagedBy   = "terraform"
  }

  depends_on = [
    aws_iam_role_policy_attachment.ecs_task_execution_policy,
    aws_db_instance.postgres,
  ]
}
