# S3 and CloudFront for KareMatch Frontend
# - S3 bucket for static frontend files
# - CloudFront CDN for global distribution
# - HTTPS enforcement

# ============================================
# S3 Bucket for Frontend
# ============================================

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend-${random_id.suffix.hex}"

  tags = {
    Name        = "${var.project_name}-frontend"
    Environment = var.environment
  }
}

# Block all public access (CloudFront will access via OAI)
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Versioning for backup and recovery
resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption (HIPAA requirement)
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle policy to clean up old versions
resource "aws_s3_bucket_lifecycle_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# ============================================
# CloudFront Origin Access Identity
# ============================================

resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "OAI for ${var.project_name} frontend"
}

# ============================================
# S3 Bucket Policy (allow CloudFront access)
# ============================================

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.main.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

# ============================================
# CloudFront Distribution
# ============================================

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} frontend distribution"
  default_root_object = "index.html"
  price_class         = var.cloudfront_price_class

  # Custom domain (if provided)
  aliases = var.domain_name != "" ? [var.domain_name] : []

  # S3 origin
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.frontend.id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    min_ttl     = var.cloudfront_min_ttl
    default_ttl = var.cloudfront_default_ttl
    max_ttl     = var.cloudfront_max_ttl

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  # SPA routing: redirect 404/403 to index.html
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  # SSL/TLS certificate
  viewer_certificate {
    # Use ACM certificate if domain is provided
    acm_certificate_arn      = var.acm_certificate_arn != "" ? var.acm_certificate_arn : null
    ssl_support_method       = var.acm_certificate_arn != "" ? "sni-only" : null
    minimum_protocol_version = var.acm_certificate_arn != "" ? "TLSv1.2_2021" : null

    # Use CloudFront default certificate if no domain
    cloudfront_default_certificate = var.acm_certificate_arn == "" ? true : false
  }

  # Geographic restrictions (optional)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name        = "${var.project_name}-cloudfront"
    Environment = var.environment
  }

  # Don't recreate the distribution if certificate changes
  lifecycle {
    ignore_changes = [viewer_certificate]
  }
}

# ============================================
# Route53 DNS Record (if domain provided)
# ============================================

# Uncomment if you want Terraform to manage Route53 records
# resource "aws_route53_record" "frontend" {
#   count = var.domain_name != "" ? 1 : 0
#
#   zone_id = var.route53_zone_id
#   name    = var.domain_name
#   type    = "A"
#
#   alias {
#     name                   = aws_cloudfront_distribution.main.domain_name
#     zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
#     evaluate_target_health = false
#   }
# }
