# RDS PostgreSQL Database for KareMatch
# HIPAA-compliant configuration:
# - Encryption at rest (required)
# - Automated backups (required)
# - Multi-AZ for production (recommended)
# - SSL/TLS connections enforced
# - Private subnet only

# ============================================
# Random Password for Database
# ============================================

resource "random_password" "db_password" {
  length  = 32
  special = true
  # Exclude characters that might cause issues in connection strings
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# ============================================
# RDS Parameter Group (enforce SSL)
# ============================================

resource "aws_db_parameter_group" "main" {
  name_prefix = "${var.project_name}-pg-"
  family      = "postgres15"
  description = "Custom parameter group for ${var.project_name} PostgreSQL"

  # Enforce SSL connections (HIPAA requirement)
  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  # Log connections for audit trail
  parameter {
    name  = "log_connections"
    value = "1"
  }

  # Log disconnections for audit trail
  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  # Log duration of slow queries (10 seconds)
  parameter {
    name  = "log_min_duration_statement"
    value = "10000"
  }

  tags = {
    Name = "${var.project_name}-parameter-group"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================
# RDS Option Group
# ============================================

resource "aws_db_option_group" "main" {
  name_prefix              = "${var.project_name}-og-"
  option_group_description = "Option group for ${var.project_name} PostgreSQL"
  engine_name              = "postgres"
  major_engine_version     = "15"

  tags = {
    Name = "${var.project_name}-option-group"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================
# RDS Instance
# ============================================

resource "aws_db_instance" "main" {
  # Instance configuration
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  # Storage configuration
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true # HIPAA requirement

  # Database configuration
  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result
  port     = 5432

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false # Must be false for HIPAA

  # High availability (recommended for production)
  multi_az = var.environment == "production" ? true : false

  # Backup configuration (HIPAA requirement)
  backup_retention_period = var.db_backup_retention_days
  backup_window           = var.db_backup_window
  copy_tags_to_snapshot   = true
  skip_final_snapshot     = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.project_name}-final-snapshot-${random_id.suffix.hex}" : null

  # Maintenance configuration
  maintenance_window              = var.db_maintenance_window
  auto_minor_version_upgrade      = true
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  # Parameter and option groups
  parameter_group_name = aws_db_parameter_group.main.name
  option_group_name    = aws_db_option_group.main.name

  # Performance Insights (recommended for production)
  performance_insights_enabled    = var.environment == "production" ? true : false
  performance_insights_retention_period = var.environment == "production" ? 7 : null

  # Deletion protection (HIPAA best practice)
  deletion_protection = var.environment == "production" ? true : false

  tags = {
    Name        = "${var.project_name}-database"
    Environment = var.environment
    HIPAA       = "true"
    Backup      = "required"
  }

  # Prevent accidental replacement
  lifecycle {
    prevent_destroy = false # Set to true in production after initial setup
    ignore_changes  = [password] # Password is managed via Secrets Manager rotation
  }
}

# ============================================
# CloudWatch Alarms for RDS Monitoring
# ============================================

resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.project_name}-database-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Database CPU utilization is too high"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${var.project_name}-db-cpu-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "database_memory" {
  alarm_name          = "${var.project_name}-database-free-memory"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 256000000 # 256 MB
  alarm_description   = "Database free memory is too low"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${var.project_name}-db-memory-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "database_storage" {
  alarm_name          = "${var.project_name}-database-free-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 2000000000 # 2 GB
  alarm_description   = "Database free storage is too low"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${var.project_name}-db-storage-alarm"
  }
}
