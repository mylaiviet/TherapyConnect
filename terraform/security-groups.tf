# Security Groups for KareMatch
# Implements least privilege access (HIPAA requirement)
# - ALB: Public internet access
# - ECS: Access only from ALB
# - RDS: Access only from ECS

# ============================================
# Application Load Balancer Security Group
# ============================================

resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-sg-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  # HTTP from anywhere (redirects to HTTPS)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from anywhere"
  }

  # HTTPS from anywhere
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from anywhere"
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "${var.project_name}-alb-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================
# ECS Tasks Security Group
# ============================================

resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${var.project_name}-ecs-tasks-sg-"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  # Allow traffic from ALB only
  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow traffic from ALB"
  }

  # Allow all outbound traffic (for database, Secrets Manager, ECR, etc.)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "${var.project_name}-ecs-tasks-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================
# RDS Security Group
# ============================================

resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-sg-"
  description = "Security group for RDS PostgreSQL database"
  vpc_id      = aws_vpc.main.id

  # PostgreSQL from ECS tasks only
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    description     = "PostgreSQL from ECS tasks"
  }

  # No outbound rules needed (database doesn't initiate connections)
  # But Terraform requires egress rules, so allow all
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================
# VPC Endpoints Security Group (optional, for cost optimization)
# ============================================

resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${var.project_name}-vpc-endpoints-sg-"
  description = "Security group for VPC endpoints (Secrets Manager, ECR)"
  vpc_id      = aws_vpc.main.id

  # HTTPS from ECS tasks
  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    description     = "HTTPS from ECS tasks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "${var.project_name}-vpc-endpoints-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}
