# Lightsail Deployment - Quick Start

## Files Created
- `Dockerfile` - Container definition
- `.dockerignore` - Files to exclude from image
- `lightsail-deployment.json` - Service configuration
- `scripts/setup-lightsail.sh` - Automated deployment script

## Prerequisites
✓ AWS CLI installed and configured (verified)
✓ Docker installed on your machine
✓ You're in the project root directory (C:\TherapyConnect)

## Deployment Steps

### Option 1: Automated (Recommended)
```bash
# Copy files to your project
# Then run:
cd C:\TherapyConnect
bash scripts/setup-lightsail.sh
```

### Option 2: Manual Step-by-Step

#### 1. Create Lightsail Service
```bash
aws lightsail create-container-service \
  --service-name therapyconnect \
  --power nano \
  --scale 1 \
  --region us-east-1
```

#### 2. Build Docker Image
```bash
docker build -t therapyconnect:latest .
```

#### 3. Push to Lightsail
```bash
aws lightsail push-container-image \
  --service-name therapyconnect \
  --label therapyconnect \
  --image therapyconnect:latest \
  --region us-east-1
```

#### 4. Deploy Container
```bash
aws lightsail create-container-service-deployment \
  --service-name therapyconnect \
  --region us-east-1 \
  --cli-input-json file://lightsail-deployment.json
```

#### 5. Check Status
```bash
aws lightsail get-container-services \
  --service-name therapyconnect \
  --region us-east-1 \
  --query 'containerServices[0].{state:state,url:url}'
```

## After Deployment

### Get Endpoint URL
```bash
aws lightsail get-container-services \
  --service-name therapyconnect \
  --region us-east-1 \
  --query 'containerServices[0].url' \
  --output text
```

### Test Health Endpoint
```bash
curl https://YOUR_ENDPOINT/health
```

### View Logs
```bash
aws logs tail /aws/lightsail/therapyconnect --follow
```

### Configure Environment Variables
In AWS Console:
1. Go to Lightsail > Container Services > therapyconnect
2. Click "Custom domains" tab
3. Add environment variables:
   - `DATABASE_URL` = Your RDS connection string
   - `SESSION_SECRET` = Random secure string
   - `ENCRYPTION_KEY` = 32-character random string

## Troubleshooting

### Build Fails
- Check Dockerfile syntax
- Verify all dependencies in package.json
- Run `npm install` locally first

### Push Fails
- Check AWS credentials: `aws sts get-caller-identity`
- Verify service exists: `aws lightsail get-container-services --service-name therapyconnect`
- Check Docker daemon is running

### Deployment Stuck
- Wait 10 minutes (initial deployment is slow)
- Check logs: `aws logs tail /aws/lightsail/therapyconnect`
- Verify health check path exists: `/health`

### Health Check Failing
- Application not listening on port 5000
- `/health` endpoint not implemented
- Application crashing on startup (check logs)

## Cost
- Nano: $7/month (512MB RAM, 0.25 vCPU)
- No additional charges for load balancer or SSL

## Next Steps After Success
1. Configure custom domain
2. Add DATABASE_URL environment variable
3. Test full application functionality
4. Set up CloudWatch alerts
5. Configure automated backups
