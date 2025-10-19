# AWS Secrets Manager for KareMatch
# Stores sensitive configuration (DATABASE_URL, ENCRYPTION_KEY, SESSION_SECRET)
# HIPAA-compliant: Encrypted at rest, automatic rotation supported

# ============================================
# Generate Encryption Key
# ============================================

resource "random_password" "encryption_key" {
  length  = 32
  special = false # Base64 compatible
}

resource "random_password" "session_secret" {
  length  = 64
  special = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# ============================================
# Application Secrets
# ============================================

resource "aws_secretsmanager_secret" "app_secrets" {
  name_prefix             = "${var.project_name}-app-secrets-"
  description             = "Application secrets for KareMatch (DATABASE_URL, ENCRYPTION_KEY, SESSION_SECRET)"
  recovery_window_in_days = 7 # Allow recovery for 7 days before permanent deletion

  tags = {
    Name        = "${var.project_name}-app-secrets"
    Environment = var.environment
    HIPAA       = "true"
  }
}

# ============================================
# Secret Values
# ============================================

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id

  secret_string = jsonencode({
    DATABASE_URL = "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.main.endpoint}/${var.db_name}?sslmode=require"
    ENCRYPTION_KEY = var.encryption_key != "" ? var.encryption_key : random_password.encryption_key.result
    SESSION_SECRET = var.session_secret != "" ? var.session_secret : random_password.session_secret.result
    AWS_REGION     = var.aws_region
  })

  lifecycle {
    ignore_changes = [secret_string] # Prevent Terraform from resetting rotated secrets
  }
}

# ============================================
# Database Password Secret (separate for rotation)
# ============================================

resource "aws_secretsmanager_secret" "db_password" {
  name_prefix             = "${var.project_name}-db-password-"
  description             = "RDS database password for ${var.project_name}"
  recovery_window_in_days = 7

  tags = {
    Name        = "${var.project_name}-db-password"
    Environment = var.environment
    HIPAA       = "true"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id

  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = 5432
    dbname   = var.db_name
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# ============================================
# Secret Rotation Configuration (Optional)
# ============================================

# Uncomment to enable automatic password rotation
# Requires Lambda function for rotation

# resource "aws_secretsmanager_secret_rotation" "db_password" {
#   secret_id           = aws_secretsmanager_secret.db_password.id
#   rotation_lambda_arn = aws_lambda_function.rotate_secret.arn
#
#   rotation_rules {
#     automatically_after_days = 30
#   }
#
#   depends_on = [aws_lambda_permission.allow_secretsmanager]
# }

# ============================================
# CloudWatch Alarms for Secret Access
# ============================================

# Monitor secret access for security audit
resource "aws_cloudwatch_log_metric_filter" "secret_access" {
  name           = "${var.project_name}-secret-access"
  log_group_name = "/aws/secretsmanager/${var.project_name}"
  pattern        = "[...] GetSecretValue"

  metric_transformation {
    name      = "SecretAccessCount"
    namespace = "KareMatch/Security"
    value     = "1"
  }
}
