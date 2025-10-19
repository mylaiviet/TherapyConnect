# Variables for KareMatch AWS Infrastructure

# ============================================
# General Configuration
# ============================================

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "karematch"
}

# ============================================
# VPC Configuration
# ============================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (ALB)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (ECS, RDS)"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets (RDS)"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]
}

variable "availability_zones" {
  description = "Availability zones to use (if empty, uses first 2 available)"
  type        = list(string)
  default     = []
}

# ============================================
# RDS Configuration
# ============================================

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro" # Free tier eligible, upgrade to db.t4g.small for production
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum storage for RDS autoscaling in GB"
  type        = number
  default     = 100
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "karematch"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "karematch_admin"
}

variable "db_backup_retention_days" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 7
}

variable "db_backup_window" {
  description = "Preferred backup window (UTC)"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Preferred maintenance window (UTC)"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

# ============================================
# ECS Configuration
# ============================================

variable "ecs_task_cpu" {
  description = "CPU units for ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 512 # 0.5 vCPU
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = number
  default     = 1024 # 1 GB
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2 # High availability
}

variable "ecs_min_capacity" {
  description = "Minimum number of ECS tasks (autoscaling)"
  type        = number
  default     = 1
}

variable "ecs_max_capacity" {
  description = "Maximum number of ECS tasks (autoscaling)"
  type        = number
  default     = 4
}

variable "ecs_cpu_target" {
  description = "Target CPU utilization for autoscaling (%)"
  type        = number
  default     = 70
}

variable "ecs_memory_target" {
  description = "Target memory utilization for autoscaling (%)"
  type        = number
  default     = 80
}

variable "container_port" {
  description = "Port the application container listens on"
  type        = number
  default     = 5000
}

variable "health_check_path" {
  description = "Health check endpoint path"
  type        = string
  default     = "/health"
}

# ============================================
# Domain & SSL Configuration
# ============================================

variable "domain_name" {
  description = "Domain name for the application (e.g., karematch.com)"
  type        = string
  default     = "" # Set this when you have a domain
}

variable "create_route53_zone" {
  description = "Whether to create a Route53 hosted zone"
  type        = bool
  default     = false
}

variable "acm_certificate_arn" {
  description = "ARN of existing ACM certificate (if empty, will create new one)"
  type        = string
  default     = ""
}

# ============================================
# CloudFront Configuration
# ============================================

variable "cloudfront_price_class" {
  description = "CloudFront price class (PriceClass_All, PriceClass_100, PriceClass_200)"
  type        = string
  default     = "PriceClass_100" # US, Canada, Europe
}

variable "cloudfront_min_ttl" {
  description = "Minimum TTL for CloudFront cache (seconds)"
  type        = number
  default     = 0
}

variable "cloudfront_default_ttl" {
  description = "Default TTL for CloudFront cache (seconds)"
  type        = number
  default     = 86400 # 1 day
}

variable "cloudfront_max_ttl" {
  description = "Maximum TTL for CloudFront cache (seconds)"
  type        = number
  default     = 31536000 # 1 year
}

# ============================================
# Secrets Configuration
# ============================================

variable "encryption_key" {
  description = "Encryption key for application (32+ characters for AES-256)"
  type        = string
  sensitive   = true
  default     = "" # Set via environment variable or tfvars
}

variable "session_secret" {
  description = "Session secret for Express sessions"
  type        = string
  sensitive   = true
  default     = "" # Set via environment variable or tfvars
}

# ============================================
# Monitoring & Logging
# ============================================

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "enable_container_insights" {
  description = "Enable ECS Container Insights (additional cost)"
  type        = bool
  default     = true
}

# ============================================
# Tags
# ============================================

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}
