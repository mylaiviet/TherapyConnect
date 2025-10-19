# CloudWatch Logging and Monitoring for KareMatch
# HIPAA Requirement: Comprehensive audit logging
# - ECS container logs
# - Application logs
# - VPC flow logs (in vpc.tf)
# - RDS logs
# - ALB logs

# ============================================
# CloudWatch Log Group for ECS
# ============================================

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/aws/ecs/${var.project_name}"
  retention_in_days = var.log_retention_days

  # Encryption at rest (HIPAA requirement)
  kms_key_id = null # Use default AWS managed key, or create custom KMS key

  tags = {
    Name        = "${var.project_name}-ecs-logs"
    Environment = var.environment
    HIPAA       = "true"
  }
}

# ============================================
# CloudWatch Dashboard
# ============================================

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average", label = "ECS CPU" }],
            ["AWS/ECS", "MemoryUtilization", { stat = "Average", label = "ECS Memory" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS Resource Utilization"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", label = "RDS CPU" }],
            ["AWS/RDS", "FreeableMemory", { stat = "Average", label = "RDS Free Memory" }],
            ["AWS/RDS", "FreeStorageSpace", { stat = "Average", label = "RDS Free Storage" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS Resource Utilization"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average", label = "Response Time" }],
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum", label = "Requests" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", { stat = "Sum", label = "4XX Errors" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", { stat = "Sum", label = "5XX Errors" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ALB Performance"
        }
      },
      {
        type = "log"
        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.ecs.name}' | fields @timestamp, @message | sort @timestamp desc | limit 20"
          region  = var.aws_region
          title   = "Recent ECS Logs"
        }
      }
    ]
  })
}

# ============================================
# CloudWatch Alarms for Critical Events
# ============================================

# ECS Service Task Count Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_running_tasks" {
  alarm_name          = "${var.project_name}-ecs-no-running-tasks"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = 60
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "No ECS tasks are running"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    ServiceName = aws_ecs_service.app.name
    ClusterName = aws_ecs_cluster.main.name
  }

  tags = {
    Name = "${var.project_name}-ecs-tasks-alarm"
  }
}

# Application Error Rate Alarm (5XX errors)
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${var.project_name}-alb-high-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "High number of 5XX errors from ALB targets"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "${var.project_name}-alb-5xx-alarm"
  }
}

# ============================================
# CloudWatch Log Metric Filters
# ============================================

# Monitor application errors
resource "aws_cloudwatch_log_metric_filter" "application_errors" {
  name           = "${var.project_name}-application-errors"
  log_group_name = aws_cloudwatch_log_group.ecs.name
  pattern        = "[...] ERROR"

  metric_transformation {
    name      = "ApplicationErrors"
    namespace = "KareMatch/Application"
    value     = "1"
  }
}

# Monitor database connection errors
resource "aws_cloudwatch_log_metric_filter" "database_errors" {
  name           = "${var.project_name}-database-errors"
  log_group_name = aws_cloudwatch_log_group.ecs.name
  pattern        = "[...] database connection"

  metric_transformation {
    name      = "DatabaseConnectionErrors"
    namespace = "KareMatch/Application"
    value     = "1"
  }
}

# Monitor failed login attempts (security)
resource "aws_cloudwatch_log_metric_filter" "failed_logins" {
  name           = "${var.project_name}-failed-logins"
  log_group_name = aws_cloudwatch_log_group.ecs.name
  pattern        = "[...] authentication failed"

  metric_transformation {
    name      = "FailedLoginAttempts"
    namespace = "KareMatch/Security"
    value     = "1"
  }
}

# ============================================
# SNS Topic for Alerts (Optional)
# ============================================

# Uncomment to create SNS topic for alarm notifications
# resource "aws_sns_topic" "alerts" {
#   name = "${var.project_name}-alerts"
#
#   tags = {
#     Name = "${var.project_name}-alerts"
#   }
# }

# resource "aws_sns_topic_subscription" "email" {
#   topic_arn = aws_sns_topic.alerts.arn
#   protocol  = "email"
#   endpoint  = "alerts@karematch.com" # Change to your email
# }
