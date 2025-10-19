#!/bin/bash
# Complete Deployment Pipeline for KareMatch
# Runs all deployment scripts in sequence

set -e  # Exit on error

echo "========================================="
echo "KareMatch Complete Deployment"
echo "========================================="

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Build and push Docker image
echo ""
echo "Step 1/2: Building and pushing backend Docker image..."
echo "========================================="
bash "$SCRIPT_DIR/build-and-push.sh"

# Deploy backend to ECS
echo ""
echo "Step 2/3: Deploying backend to ECS..."
echo "========================================="
bash "$SCRIPT_DIR/deploy-backend.sh"

# Deploy frontend to S3/CloudFront
echo ""
echo "Step 3/3: Deploying frontend to S3/CloudFront..."
echo "========================================="
bash "$SCRIPT_DIR/deploy-frontend.sh"

# Display summary
echo ""
echo "========================================="
echo "✓ Complete Deployment Successful!"
echo "========================================="

# Get URLs from Terraform
cd "$SCRIPT_DIR/../terraform"
ALB_URL=$(terraform output -raw alb_url 2>/dev/null || echo "N/A")
CLOUDFRONT_URL=$(terraform output -raw cloudfront_url 2>/dev/null || echo "N/A")

echo ""
echo "Application URLs:"
echo "  Backend API: $ALB_URL"
echo "  Frontend:    $CLOUDFRONT_URL"
echo ""
echo "To view logs:"
echo "  aws logs tail /aws/ecs/karematch --follow"
echo ""
echo "To view monitoring dashboard:"
terraform output -raw cloudwatch_dashboard_url 2>/dev/null || echo "  (Run terraform output cloudwatch_dashboard_url)"
echo ""
