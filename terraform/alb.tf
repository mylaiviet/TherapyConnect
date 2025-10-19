# Application Load Balancer for KareMatch Backend
# - HTTPS termination (SSL/TLS)
# - Health checks to ECS tasks
# - Access logs for audit trail (HIPAA)

# ============================================
# Application Load Balancer
# ============================================

resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  # Enable access logs for audit trail (HIPAA requirement)
  # access_logs {
  #   bucket  = aws_s3_bucket.alb_logs.id
  #   prefix  = "alb"
  #   enabled = true
  # }

  # Enable deletion protection in production
  enable_deletion_protection = var.environment == "production" ? true : false

  # Enable HTTP/2
  enable_http2 = true

  # Enable cross-zone load balancing
  enable_cross_zone_load_balancing = true

  tags = {
    Name        = "${var.project_name}-alb"
    Environment = var.environment
  }
}

# ============================================
# Target Group for ECS Tasks
# ============================================

resource "aws_lb_target_group" "app" {
  name        = "${var.project_name}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  # Health check configuration
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = var.health_check_path
    protocol            = "HTTP"
    matcher             = "200"
  }

  # Deregistration delay (time to drain connections)
  deregistration_delay = 30

  # Stickiness (session affinity)
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400 # 24 hours
    enabled         = true
  }

  tags = {
    Name        = "${var.project_name}-target-group"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================
# HTTPS Listener (production)
# ============================================

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01" # HIPAA-compliant TLS 1.2+
  certificate_arn   = var.acm_certificate_arn != "" ? var.acm_certificate_arn : null

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  # Only create HTTPS listener if certificate is provided
  count = var.acm_certificate_arn != "" ? 1 : 0

  tags = {
    Name = "${var.project_name}-https-listener"
  }
}

# ============================================
# HTTP Listener (redirect to HTTPS or development)
# ============================================

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    # If SSL certificate exists, redirect HTTP to HTTPS
    # Otherwise, forward to target group (development mode)
    type = var.acm_certificate_arn != "" ? "redirect" : "forward"

    dynamic "redirect" {
      for_each = var.acm_certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    target_group_arn = var.acm_certificate_arn == "" ? aws_lb_target_group.app.arn : null
  }

  tags = {
    Name = "${var.project_name}-http-listener"
  }
}

# ============================================
# CloudWatch Alarms for ALB Monitoring
# ============================================

resource "aws_cloudwatch_metric_alarm" "alb_target_response_time" {
  alarm_name          = "${var.project_name}-alb-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 1.0 # 1 second
  alarm_description   = "ALB target response time is too high"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "${var.project_name}-alb-response-time-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_healthy_hosts" {
  alarm_name          = "${var.project_name}-alb-low-healthy-hosts"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "Less than 1 healthy target in ALB target group"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    TargetGroup  = aws_lb_target_group.app.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "${var.project_name}-alb-healthy-hosts-alarm"
  }
}
