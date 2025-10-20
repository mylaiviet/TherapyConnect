#!/bin/bash
# karematch - Lightsail Deployment Script
# This script creates and deploys the application to AWS Lightsail

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="karematch"
REGION="us-east-1"
POWER="nano"  # 512MB RAM, 0.25 vCPU - $7/month
SCALE=1       # Number of containers

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}karematch Lightsail Deployment${NC}"
echo -e "${GREEN}=====================================${NC}\n"

# Step 1: Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}ERROR: AWS CLI not installed${NC}"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}ERROR: AWS credentials not configured${NC}"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI installed and configured${NC}\n"

# Step 2: Check if Lightsail service already exists
echo -e "${YELLOW}Step 2: Checking if Lightsail service exists...${NC}"

if aws lightsail get-container-services --service-name "$SERVICE_NAME" --region "$REGION" &> /dev/null; then
    echo -e "${YELLOW}⚠ Service '$SERVICE_NAME' already exists${NC}"
    read -p "Delete and recreate? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Deleting existing service..."
        aws lightsail delete-container-service --service-name "$SERVICE_NAME" --region "$REGION"
        echo "Waiting for deletion to complete (60 seconds)..."
        sleep 60
    else
        echo -e "${GREEN}Using existing service${NC}\n"
        SKIP_CREATE=true
    fi
fi

# Step 3: Create Lightsail container service
if [ "$SKIP_CREATE" != true ]; then
    echo -e "${YELLOW}Step 3: Creating Lightsail container service...${NC}"
    echo "Configuration: $POWER power, $SCALE containers in $REGION"
    
    aws lightsail create-container-service \
        --service-name "$SERVICE_NAME" \
        --power "$POWER" \
        --scale "$SCALE" \
        --region "$REGION"
    
    echo -e "${GREEN}✓ Service created successfully${NC}"
    echo "Waiting for service to become active (60 seconds)..."
    sleep 60
else
    echo -e "${YELLOW}Step 3: Skipped (service exists)${NC}\n"
fi

# Step 4: Build Docker image
echo -e "${YELLOW}Step 4: Building Docker image...${NC}"

if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}ERROR: Dockerfile not found in current directory${NC}"
    exit 1
fi

docker build -t "$SERVICE_NAME:latest" .

echo -e "${GREEN}✓ Docker image built successfully${NC}\n"

# Step 5: Push image to Lightsail
echo -e "${YELLOW}Step 5: Pushing image to Lightsail...${NC}"
echo "This may take 3-5 minutes depending on image size..."

aws lightsail push-container-image \
    --service-name "$SERVICE_NAME" \
    --label "$SERVICE_NAME" \
    --image "$SERVICE_NAME:latest" \
    --region "$REGION"

echo -e "${GREEN}✓ Image pushed successfully${NC}\n"

# Step 6: Deploy container
echo -e "${YELLOW}Step 6: Deploying container...${NC}"

if [ ! -f "lightsail-deployment.json" ]; then
    echo -e "${RED}ERROR: lightsail-deployment.json not found${NC}"
    exit 1
fi

aws lightsail create-container-service-deployment \
    --service-name "$SERVICE_NAME" \
    --region "$REGION" \
    --cli-input-json file://lightsail-deployment.json

echo -e "${GREEN}✓ Deployment initiated${NC}\n"

# Step 7: Wait and check status
echo -e "${YELLOW}Step 7: Waiting for deployment to complete...${NC}"
echo "This typically takes 5-10 minutes. Checking status every 30 seconds..."

for i in {1..20}; do
    sleep 30
    STATE=$(aws lightsail get-container-services \
        --service-name "$SERVICE_NAME" \
        --region "$REGION" \
        --query 'containerServices[0].state' \
        --output text)
    
    echo "Attempt $i/20: State = $STATE"
    
    if [ "$STATE" == "RUNNING" ]; then
        echo -e "${GREEN}✓ Deployment complete!${NC}\n"
        break
    elif [ "$STATE" == "FAILED" ]; then
        echo -e "${RED}✗ Deployment failed${NC}"
        exit 1
    fi
    
    if [ $i -eq 20 ]; then
        echo -e "${YELLOW}⚠ Deployment taking longer than expected${NC}"
        echo "Check AWS Console for details"
    fi
done

# Step 8: Get endpoint URL
echo -e "${YELLOW}Step 8: Getting endpoint URL...${NC}"

ENDPOINT=$(aws lightsail get-container-services \
    --service-name "$SERVICE_NAME" \
    --region "$REGION" \
    --query 'containerServices[0].url' \
    --output text)

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo "Power: $POWER ($7/month)"
echo "Endpoint: https://$ENDPOINT"
echo ""
echo "Health Check: https://$ENDPOINT/health"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test health endpoint: curl https://$ENDPOINT/health"
echo "2. Configure environment variables (DATABASE_URL, etc.)"
echo "3. Set up custom domain in Lightsail console"
echo "4. Monitor logs: aws logs tail /aws/lightsail/$SERVICE_NAME --follow"
echo ""
echo -e "${GREEN}Cost: \$7/month${NC}"
