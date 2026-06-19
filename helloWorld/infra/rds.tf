resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  tags       = { Name = "${var.project_name}-db-subnet-group" }
}

resource "aws_db_instance" "postgres" {
  identifier        = "${var.project_name}-postgres"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t3.small"  # 2 vCPU, 2 GB RAM — adequate for a production workload
  allocated_storage = 50
  storage_type      = "gp3"          # gp3 delivers predictable IOPS independently of storage size

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  storage_encrypted       = true
  publicly_accessible     = false
  deletion_protection     = true
  skip_final_snapshot     = false
  final_snapshot_identifier = "${var.project_name}-postgres-final"
  backup_retention_period = 14      # 14-day automated backups for point-in-time recovery
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Enable Performance Insights for query-level observability
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  tags = {
    Name               = "${var.project_name}-postgres"
    ProjectName        = "GlobalCustomerApp"
    DataClassification = "PII"
    Owner              = "DigitalBU"
    Environment        = "Production"
    ManagedBy          = "terraform"
  }
}
