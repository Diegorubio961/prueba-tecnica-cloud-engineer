resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  tags       = { Name = "${var.project_name}-db-subnet-group" }
}

resource "aws_db_instance" "postgres" {
  identifier        = "${var.project_name}-postgres"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = var.db_instance_class    # Free Tier: db.t3.micro
  allocated_storage = var.db_allocated_storage # Free Tier: 20 GB
  storage_type      = var.db_storage_type      # Free Tier: gp2

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  storage_encrypted         = true # Encryption at rest (no extra cost)
  publicly_accessible       = false
  deletion_protection       = var.enable_deletion_protection
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.project_name}-postgres-final"
  backup_retention_period   = 7 # Automated backups within Free Tier (<= 100% of storage)
  backup_window             = "03:00-04:00"
  maintenance_window        = "Mon:04:00-Mon:05:00"

  performance_insights_enabled          = var.enable_db_performance_insights
  performance_insights_retention_period = var.enable_db_performance_insights ? 7 : null

  tags = {
    Name               = "${var.project_name}-postgres"
    ProjectName        = "GlobalCustomerApp"
    DataClassification = "PII"
    Owner              = "DigitalBU"
    Environment        = "Production"
    ManagedBy          = "terraform"
  }
}
