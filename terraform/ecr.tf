# Elastic Container Registry (ECR) for KareMatch
# Stores Docker images for backend application
# - Image scanning enabled (HIPAA security requirement)
# - Encryption at rest
# - Lifecycle policy to manage image retention

# ============================================
# ECR Repository
# ============================================

resource "aws_ecr_repository" "app" {
  name                 = "${var.project_name}-backend"
  image_tag_mutability = "MUTABLE"

  # Encryption at rest (HIPAA requirement)
  encryption_configuration {
    encryption_type = "AES256"
  }

  # Image scanning for vulnerabilities (HIPAA best practice)
  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.project_name}-backend-ecr"
    Environment = var.environment
    HIPAA       = "true"
  }
}

# ============================================
# Lifecycle Policy (cleanup old images)
# ============================================

resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# ============================================
# ECR Repository Policy (allow ECS to pull images)
# ============================================

resource "aws_ecr_repository_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowECSTaskPull"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
      }
    ]
  })
}
