#!/bin/bash
# Run this script on your AMD64 machine

set -e  # Exit on error

echo "=== KareMatch AMD64 Deployment Script ==="
echo ""

# Step 1: Clone the repository (if not already)
if [ ! -d "TherapyConnect" ]; then
    echo "[1/6] Cloning repository..."
    git clone <YOUR_REPO_URL> TherapyConnect
    cd TherapyConnect
else
    echo "[1/6] Repository exists, pulling latest..."
    cd TherapyConnect
    git pull origin aws-migration
fi

# Step 2: Build Docker image
echo ""
echo "[2/6] Building Docker image for AMD64..."
docker build -t karematch:latest .

# Step 3: Test locally
echo ""
echo "[3/6] Testing Docker image..."
CONTAINER_ID=$(docker run -d -p 5001:5000 \
    -e NODE_ENV=production \
    -e PORT=5000 \
    -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
    -e SESSION_SECRET="test" \
    -e ENCRYPTION_KEY="dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==" \
    karematch:latest)

sleep 5
curl http://localhost:5001/health
docker stop $CONTAINER_ID
docker rm $CONTAINER_ID

# Step 4: Login to ECR
echo ""
echo "[4/6] Logging into Amazon ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 051826703172.dkr.ecr.us-east-1.amazonaws.com

# Step 5: Tag and push to ECR
echo ""
echo "[5/6] Pushing image to ECR..."
docker tag karematch:latest 051826703172.dkr.ecr.us-east-1.amazonaws.com/karematch:latest
docker push 051826703172.dkr.ecr.us-east-1.amazonaws.com/karematch:latest

# Step 6: Deploy to Lightsail
echo ""
echo "[6/6] Deploying to Lightsail..."
aws lightsail create-container-service-deployment \
    --service-name karematch \
    --region us-east-1 \
    --containers '{
        "karematch": {
            "image": "051826703172.dkr.ecr.us-east-1.amazonaws.com/karematch:latest",
            "environment": {
                "USE_PARAMETER_STORE": "true",
                "AWS_REGION": "us-east-1",
                "NODE_ENV": "production",
                "PORT": "5000",
                "DATABASE_URL": "postgresql://postgres:Welcome2ppmsi%21@karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=no-verify",
                "SESSION_SECRET": "ire9naslXt6kh8DPqPm+KACgT6YMqv95VQl4r2v+YAHumjMYoyKBVFIXbDyOSDXg",
                "ENCRYPTION_KEY": "pDKEOfmV0N8nm4AsxAq4FsF+erq1ijJ1Qx5NMw+0NfM="
            },
            "ports": {
                "5000": "HTTP"
            }
        }
    }' \
    --public-endpoint '{
        "containerName": "karematch",
        "containerPort": 5000,
        "healthCheck": {
            "path": "/health",
            "intervalSeconds": 10,
            "timeoutSeconds": 8,
            "healthyThreshold": 2,
            "unhealthyThreshold": 3
        }
    }'

echo ""
echo "=== Deployment initiated! ==="
echo ""
echo "Monitor deployment:"
echo "aws lightsail get-container-service-deployments --service-name karematch --region us-east-1 --query 'deployments[0].state'"
echo ""
echo "View logs:"
echo "aws logs tail /aws/lightsail/containers/karematch/karematch --region us-east-1 --follow"
echo ""
echo "Test health endpoint (wait 2-3 minutes first):"
echo "curl https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com/health"
