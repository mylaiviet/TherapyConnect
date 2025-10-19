#!/bin/bash
# Build and Push Docker Image to AWS ECR
# Builds the backend application container and pushes to ECR

set -e  # Exit on error

echo "========================================="
echo "KareMatch Docker Build & Push"
echo "========================================="

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# Get ECR repository URL from Terraform output
cd terraform
ECR_REPO_URL=$(terraform output -raw ecr_repository_url 2>/dev/null)
AWS_REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")

if [ -z "$ECR_REPO_URL" ]; then
    echo "ERROR: Could not get ECR repository URL from Terraform"
    echo "Make sure you've run ./scripts/setup-infrastructure.sh first"
    exit 1
fi

cd "$PROJECT_ROOT"

echo "ECR Repository: $ECR_REPO_URL"
echo "AWS Region: $AWS_REGION"

# Login to ECR
echo ""
echo "Logging in to AWS ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REPO_URL"

# Build Docker image
echo ""
echo "Building Docker image..."
docker build -t karematch-backend:latest .

# Tag image for ECR
echo ""
echo "Tagging image for ECR..."
docker tag karematch-backend:latest "$ECR_REPO_URL:latest"
docker tag karematch-backend:latest "$ECR_REPO_URL:$(date +%Y%m%d-%H%M%S)"

# Push image to ECR
echo ""
echo "Pushing image to ECR..."
docker push "$ECR_REPO_URL:latest"
docker push "$ECR_REPO_URL:$(date +%Y%m%d-%H%M%S)"

echo ""
echo "✓ Docker image built and pushed successfully!"
echo ""
echo "Next step: Run ./scripts/deploy-backend.sh"
