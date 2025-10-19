#!/bin/bash
# Deploy Frontend to S3 and CloudFront
# Builds frontend, uploads to S3, and invalidates CloudFront cache

set -e  # Exit on error

echo "========================================="
echo "KareMatch Frontend Deployment"
echo "========================================="

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# Get S3 bucket and CloudFront distribution from Terraform output
cd terraform
S3_BUCKET=$(terraform output -raw s3_bucket_name 2>/dev/null)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null)
AWS_REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")

if [ -z "$S3_BUCKET" ] || [ -z "$CLOUDFRONT_ID" ]; then
    echo "ERROR: Could not get S3 bucket/CloudFront ID from Terraform"
    echo "Make sure you've run ./scripts/setup-infrastructure.sh first"
    exit 1
fi

cd "$PROJECT_ROOT"

echo "S3 Bucket: $S3_BUCKET"
echo "CloudFront Distribution: $CLOUDFRONT_ID"
echo "AWS Region: $AWS_REGION"

# Build frontend
echo ""
echo "Building frontend..."
npm run build

# Verify build output exists
if [ ! -d "dist/public" ]; then
    echo "ERROR: Build output not found at dist/public"
    echo "Make sure the build completed successfully"
    exit 1
fi

# Upload to S3
echo ""
echo "Uploading to S3..."
aws s3 sync dist/public/ "s3://$S3_BUCKET/" \
    --delete \
    --region "$AWS_REGION" \
    --cache-control "public,max-age=31536000,immutable" \
    --exclude "*.html" \
    --exclude "*.json"

# Upload HTML and JSON files without caching
aws s3 sync dist/public/ "s3://$S3_BUCKET/" \
    --region "$AWS_REGION" \
    --cache-control "public,max-age=0,must-revalidate" \
    --exclude "*" \
    --include "*.html" \
    --include "*.json"

# Invalidate CloudFront cache
echo ""
echo "Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo "Invalidation ID: $INVALIDATION_ID"

echo ""
echo "Waiting for invalidation to complete..."
aws cloudfront wait invalidation-completed \
    --distribution-id "$CLOUDFRONT_ID" \
    --id "$INVALIDATION_ID"

echo ""
echo "✓ Frontend deployed successfully!"
echo ""
echo "CloudFront URL: https://$(cd "$PROJECT_ROOT/terraform" && terraform output -raw cloudfront_domain_name)"
