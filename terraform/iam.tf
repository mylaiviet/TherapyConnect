# IAM Roles and Policies for KareMatch
# Implements least privilege access (HIPAA requirement)
# - ECS Task Execution Role: Pull images, read secrets, write logs
# - ECS Task Role: Application permissions (RDS, Secrets Manager)

# ============================================
# ECS Task Execution Role
# ============================================

resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-ecs-task-execution-role"
    Environment = var.environment
  }
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Custom policy for Secrets Manager access
resource "aws_iam_role_policy" "ecs_secrets_access" {
  name = "${var.project_name}-ecs-secrets-access"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.app_secrets.arn,
          aws_secretsmanager_secret.db_password.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" : "secretsmanager.${var.aws_region}.amazonaws.com"
          }
        }
      }
    ]
  })
}

# ============================================
# ECS Task Role (application permissions)
# ============================================

resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-ecs-task-role"
    Environment = var.environment
  }
}

# Application-level Secrets Manager access
resource "aws_iam_role_policy" "ecs_task_secrets" {
  name = "${var.project_name}-ecs-task-secrets-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.app_secrets.arn,
          aws_secretsmanager_secret.db_password.arn
        ]
      }
    ]
  })
}

# CloudWatch Logs access for application
resource "aws_iam_role_policy" "ecs_task_logs" {
  name = "${var.project_name}-ecs-task-logs-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "${aws_cloudwatch_log_group.ecs.arn}:*"
      }
    ]
  })
}

# RDS access (if needed for IAM authentication - optional)
# resource "aws_iam_role_policy" "ecs_task_rds" {
#   name = "${var.project_name}-ecs-task-rds-policy"
#   role = aws_iam_role.ecs_task.id
#
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Action = [
#           "rds-db:connect"
#         ]
#         Resource = aws_db_instance.main.arn
#       }
#     ]
#   })
# }

# ============================================
# GitHub Actions Deployment Role (optional)
# ============================================

# Uncomment to create IAM role for GitHub Actions CI/CD
# resource "aws_iam_role" "github_actions" {
#   name = "${var.project_name}-github-actions-role"
#
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Principal = {
#           Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
#         }
#         Action = "sts:AssumeRoleWithWebIdentity"
#         Condition = {
#           StringEquals = {
#             "token.actions.githubusercontent.com:aud" : "sts.amazonaws.com"
#           }
#           StringLike = {
#             "token.actions.githubusercontent.com:sub" : "repo:your-org/karematch:*"
#           }
#         }
#       }
#     ]
#   })
#
#   tags = {
#     Name = "${var.project_name}-github-actions-role"
#   }
# }

# GitHub Actions policy for ECR, ECS, S3
# resource "aws_iam_role_policy" "github_actions" {
#   name = "${var.project_name}-github-actions-policy"
#   role = aws_iam_role.github_actions.id
#
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Action = [
#           "ecr:GetAuthorizationToken",
#           "ecr:BatchCheckLayerAvailability",
#           "ecr:GetDownloadUrlForLayer",
#           "ecr:BatchGetImage",
#           "ecr:PutImage",
#           "ecr:InitiateLayerUpload",
#           "ecr:UploadLayerPart",
#           "ecr:CompleteLayerUpload"
#         ]
#         Resource = aws_ecr_repository.app.arn
#       },
#       {
#         Effect = "Allow"
#         Action = [
#           "ecs:UpdateService",
#           "ecs:DescribeServices"
#         ]
#         Resource = aws_ecs_service.app.id
#       },
#       {
#         Effect = "Allow"
#         Action = [
#           "s3:PutObject",
#           "s3:PutObjectAcl",
#           "s3:DeleteObject",
#           "s3:ListBucket"
#         ]
#         Resource = [
#           aws_s3_bucket.frontend.arn,
#           "${aws_s3_bucket.frontend.arn}/*"
#         ]
#       },
#       {
#         Effect = "Allow"
#         Action = [
#           "cloudfront:CreateInvalidation"
#         ]
#         Resource = aws_cloudfront_distribution.main.arn
#       }
#     ]
#   })
# }

# ============================================
# Data Source for Current AWS Account
# ============================================

data "aws_caller_identity" "current" {}
