# Terraform configuration for KareMatch AWS Infrastructure
# HIPAA-compliant mental health therapist matching platform
#
# Infrastructure Stack:
# - VPC with public/private subnets across 2 AZs
# - RDS PostgreSQL (encrypted, automated backups)
# - ECS Fargate (containerized backend)
# - Application Load Balancer
# - S3 + CloudFront (frontend hosting)
# - AWS Secrets Manager (sensitive configuration)
# - CloudWatch (logging and monitoring)

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Backend configuration for state management
  # Uncomment after creating S3 bucket for state
  # backend "s3" {
  #   bucket         = "karematch-terraform-state"
  #   key            = "production/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "karematch-terraform-locks"
  # }
}

# AWS Provider Configuration
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "KareMatch"
      Environment = var.environment
      ManagedBy   = "Terraform"
      HIPAA       = "true"
    }
  }
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Random suffix for unique resource names
resource "random_id" "suffix" {
  byte_length = 4
}
