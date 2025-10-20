#!/bin/bash
# KareMatch Lightsail Deployment Script
# Automates Docker build, push, and deployment to AWS Lightsail

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="karematch"
IMAGE_NAME="karematch"
IMAGE_TAG="latest"
AWS_REGION="us-east-1"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}KareMatch Lightsail Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Build Docker image
echo -e "${YELLOW}[1/4] Building Docker image...${NC}"
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
else
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi
echo ""

# Step 2: Test image locally (quick smoke test)
echo -e "${YELLOW}[2/4] Testing Docker image locally...${NC}"
CONTAINER_ID=$(docker run -d \
    -p 5001:5000 \
    -e NODE_ENV=production \
    -e PORT=5000 \
    -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
    -e SESSION_SECRET="test-secret" \
    -e ENCRYPTION_KEY="dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==" \
    ${IMAGE_NAME}:${IMAGE_TAG})

echo "Container started: $CONTAINER_ID"
echo "Waiting 5 seconds for startup..."
sleep 5

# Test health endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/health)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Health check passed (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    docker logs $CONTAINER_ID
    docker stop $CONTAINER_ID > /dev/null 2>&1
    exit 1
fi

# Cleanup test container
docker stop $CONTAINER_ID > /dev/null 2>&1
docker rm $CONTAINER_ID > /dev/null 2>&1
echo ""

# Step 3: Push to Lightsail
echo -e "${YELLOW}[3/4] Pushing image to AWS Lightsail...${NC}"
echo "Service: $SERVICE_NAME"
echo "Region: $AWS_REGION"
echo ""

aws lightsail push-container-image \
    --service-name ${SERVICE_NAME} \
    --label ${IMAGE_TAG} \
    --image ${IMAGE_NAME}:${IMAGE_TAG} \
    --region ${AWS_REGION}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image pushed to Lightsail${NC}"
else
    echo -e "${RED}❌ Failed to push image to Lightsail${NC}"
    echo "Make sure:"
    echo "  1. AWS CLI is configured (aws configure)"
    echo "  2. You have Lightsail permissions"
    echo "  3. Service name 'karematch' exists in Lightsail"
    exit 1
fi
echo ""

# Step 4: Deploy new version
echo -e "${YELLOW}[4/4] Deploying to Lightsail...${NC}"
echo -e "${BLUE}Please complete these manual steps in Lightsail console:${NC}"
echo ""
echo "1. Go to: https://lightsail.aws.amazon.com/ls/webapp/us-east-1/container-services/${SERVICE_NAME}"
echo ""
echo "2. Update environment variables (if not already set):"
echo "   USE_PARAMETER_STORE=true"
echo "   AWS_REGION=us-east-1"
echo "   NODE_ENV=production"
echo "   PORT=5000"
echo ""
echo "3. Update DATABASE_URL:"
echo "   postgresql://postgres:Welcome2ppmsi%21@karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=no-verify"
echo ""
echo "4. Update Health Check settings:"
echo "   - Path: /health"
echo "   - Timeout: 10 seconds"
echo "   - Interval: 10 seconds"
echo ""
echo "5. Click 'Save and deploy'"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment preparation complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Monitor deployment at:"
echo "https://lightsail.aws.amazon.com/ls/webapp/us-east-1/container-services/${SERVICE_NAME}/deployments"
