#!/bin/bash
# Setup AWS Infrastructure for KareMatch
# Runs Terraform to create all AWS resources

set -e  # Exit on error

echo "========================================="
echo "KareMatch Infrastructure Setup"
echo "========================================="

# Change to terraform directory
cd "$(dirname "$0")/../terraform" || exit 1

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "ERROR: AWS CLI is not installed"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "ERROR: Terraform is not installed"
    echo "Install it from: https://www.terraform.io/downloads"
    exit 1
fi

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "ERROR: AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)
echo "✓ AWS Account ID: $AWS_ACCOUNT_ID"
echo "✓ AWS Region: $AWS_REGION"

# Initialize Terraform
echo ""
echo "Initializing Terraform..."
terraform init

# Validate Terraform configuration
echo ""
echo "Validating Terraform configuration..."
terraform validate

# Format Terraform files
echo ""
echo "Formatting Terraform files..."
terraform fmt -recursive

# Plan infrastructure changes
echo ""
echo "Planning infrastructure changes..."
terraform plan -out=tfplan

# Confirm before applying
echo ""
echo "========================================="
echo "REVIEW THE PLAN ABOVE"
echo "========================================="
read -p "Do you want to apply these changes? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted by user"
    rm -f tfplan
    exit 0
fi

# Apply infrastructure changes
echo ""
echo "Applying infrastructure changes..."
terraform apply tfplan

# Clean up plan file
rm -f tfplan

# Display outputs
echo ""
echo "========================================="
echo "Infrastructure Created Successfully!"
echo "========================================="
terraform output deployment_instructions

echo ""
echo "✓ Infrastructure setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: ./scripts/build-and-push.sh"
echo "2. Run: ./scripts/deploy-frontend.sh"
