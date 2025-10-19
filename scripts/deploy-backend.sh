#!/bin/bash
# Deploy Backend to AWS ECS
# Forces a new deployment of the ECS service to pull latest Docker image

set -e  # Exit on error

echo "========================================="
echo "KareMatch Backend Deployment"
echo "========================================="

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Get ECS cluster and service names from Terraform output
cd "$PROJECT_ROOT/terraform"
ECS_CLUSTER=$(terraform output -raw ecs_cluster_name 2>/dev/null)
ECS_SERVICE=$(terraform output -raw ecs_service_name 2>/dev/null)
AWS_REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")

if [ -z "$ECS_CLUSTER" ] || [ -z "$ECS_SERVICE" ]; then
    echo "ERROR: Could not get ECS cluster/service from Terraform"
    echo "Make sure you've run ./scripts/setup-infrastructure.sh first"
    exit 1
fi

echo "ECS Cluster: $ECS_CLUSTER"
echo "ECS Service: $ECS_SERVICE"
echo "AWS Region: $AWS_REGION"

# Force new deployment
echo ""
echo "Triggering ECS service update..."
aws ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service "$ECS_SERVICE" \
    --force-new-deployment \
    --region "$AWS_REGION"

echo ""
echo "✓ Deployment triggered successfully!"
echo ""
echo "Monitoring deployment status..."
echo "(This may take 2-5 minutes)"
echo ""

# Wait for deployment to stabilize
aws ecs wait services-stable \
    --cluster "$ECS_CLUSTER" \
    --services "$ECS_SERVICE" \
    --region "$AWS_REGION"

echo ""
echo "✓ Deployment completed successfully!"
echo ""
echo "To view logs, run:"
echo "  aws logs tail /aws/ecs/karematch --follow"
