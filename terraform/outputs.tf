# Terraform Outputs for KareMatch
# These values will be displayed after terraform apply

# ============================================
# VPC Outputs
# ============================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = aws_subnet.database[*].id
}

# ============================================
# RDS Outputs
# ============================================

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "rds_username" {
  description = "RDS master username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

# ============================================
# Secrets Manager Outputs
# ============================================

output "app_secrets_arn" {
  description = "ARN of application secrets in Secrets Manager"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "app_secrets_name" {
  description = "Name of application secrets in Secrets Manager"
  value       = aws_secretsmanager_secret.app_secrets.name
}

output "db_password_secret_arn" {
  description = "ARN of database password secret"
  value       = aws_secretsmanager_secret.db_password.arn
}

# ============================================
# ECR Outputs
# ============================================

output "ecr_repository_url" {
  description = "URL of ECR repository for Docker images"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_repository_name" {
  description = "Name of ECR repository"
  value       = aws_ecr_repository.app.name
}

# ============================================
# ECS Outputs
# ============================================

output "ecs_cluster_name" {
  description = "Name of ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of ECS service"
  value       = aws_ecs_service.app.name
}

output "ecs_task_definition_arn" {
  description = "ARN of ECS task definition"
  value       = aws_ecs_task_definition.app.arn
}

# ============================================
# ALB Outputs
# ============================================

output "alb_dns_name" {
  description = "DNS name of Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of Application Load Balancer (for Route53)"
  value       = aws_lb.main.zone_id
}

output "alb_url" {
  description = "URL of Application Load Balancer"
  value       = var.acm_certificate_arn != "" ? "https://${aws_lb.main.dns_name}" : "http://${aws_lb.main.dns_name}"
}

# ============================================
# S3 and CloudFront Outputs
# ============================================

output "s3_bucket_name" {
  description = "Name of S3 bucket for frontend"
  value       = aws_s3_bucket.frontend.id
}

output "s3_bucket_arn" {
  description = "ARN of S3 bucket for frontend"
  value       = aws_s3_bucket.frontend.arn
}

output "cloudfront_distribution_id" {
  description = "ID of CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "Domain name of CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_url" {
  description = "URL of CloudFront distribution"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

# ============================================
# IAM Outputs
# ============================================

output "ecs_task_execution_role_arn" {
  description = "ARN of ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

# ============================================
# CloudWatch Outputs
# ============================================

output "ecs_log_group_name" {
  description = "Name of CloudWatch log group for ECS"
  value       = aws_cloudwatch_log_group.ecs.name
}

output "cloudwatch_dashboard_url" {
  description = "URL to CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

# ============================================
# Deployment Information
# ============================================

output "deployment_instructions" {
  description = "Instructions for deploying the application"
  value = <<-EOT

    =================================================================
    KareMatch AWS Infrastructure Created Successfully!
    =================================================================

    Next Steps:

    1. BUILD AND PUSH DOCKER IMAGE:
       cd ${path.root}/..
       aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.app.repository_url}
       docker build -t ${var.project_name}-backend .
       docker tag ${var.project_name}-backend:latest ${aws_ecr_repository.app.repository_url}:latest
       docker push ${aws_ecr_repository.app.repository_url}:latest

    2. UPDATE ECS SERVICE (trigger deployment):
       aws ecs update-service --cluster ${aws_ecs_cluster.main.name} --service ${aws_ecs_service.app.name} --force-new-deployment --region ${var.aws_region}

    3. DEPLOY FRONTEND TO S3:
       npm run build
       aws s3 sync dist/public/ s3://${aws_s3_bucket.frontend.id}/ --delete
       aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.main.id} --paths "/*"

    4. ACCESS YOUR APPLICATION:
       Backend API: ${var.acm_certificate_arn != "" ? "https://${aws_lb.main.dns_name}" : "http://${aws_lb.main.dns_name}"}
       Frontend: https://${aws_cloudfront_distribution.main.domain_name}

    5. VIEW LOGS:
       aws logs tail ${aws_cloudwatch_log_group.ecs.name} --follow

    6. MONITOR DASHBOARD:
       ${format("https://console.aws.amazon.com/cloudwatch/home?region=%s#dashboards:name=%s", var.aws_region, aws_cloudwatch_dashboard.main.dashboard_name)}

    =================================================================

    Database Connection:
    - Endpoint: ${aws_db_instance.main.endpoint}
    - Database: ${aws_db_instance.main.db_name}
    - Username: ${aws_db_instance.main.username}
    - Password: Stored in AWS Secrets Manager (${aws_secretsmanager_secret.db_password.name})

    =================================================================
  EOT
}
