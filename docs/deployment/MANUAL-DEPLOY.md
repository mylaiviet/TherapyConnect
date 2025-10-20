# Manual Deployment Guide - Lightsail Without lightsailctl

Since the `lightsailctl` plugin isn't working, here's how to deploy manually:

## Current Status
✅ Docker image built: `karematch:latest`
✅ Image tested locally and works (health check passed)
❌ Cannot push to Lightsail (plugin issue)

## Solution: Use Render or Alternative

### Option 1: Deploy to Render (Recommended - Simpler)
Render doesn't require special plugins and works with standard Docker commands.

1. Create account at https://render.com
2. Create new "Web Service"
3. Connect your GitHub repo
4. Render will auto-detect Dockerfile
5. Add environment variables in Render dashboard
6. Deploy

### Option 2: Fix lightsailctl Plugin

The plugin needs to be in the AWS CLI plugins directory. Try this in **PowerShell as Administrator**:

```powershell
# Create plugin directory
$pluginDir = "C:\Program Files\Amazon\AWSCLIV2\aws_completer\plugins\lightsail"
New-Item -ItemType Directory -Force -Path $pluginDir

# Copy plugin
Copy-Item "C:\TherapyConnect\lightsailctl.exe" -Destination "$pluginDir\lightsailctl.exe" -Force

# Test
aws lightsail push-container-image --service-name karematch --label latest --image karematch:latest --region us-east-1
```

### Option 3: Use ECR Instead

Add these permissions to your IAM user `cli-deployment-user`:
- `ecr:GetAuthorizationToken`
- `ecr:BatchCheckLayerAvailability`
- `ecr:PutImage`
- `ecr:InitiateLayerUpload`
- `ecr:UploadLayerPart`
- `ecr:CompleteLayerUpload`

Then the [deploy-from-amd64.ps1](deploy-from-amd64.ps1) script will work.

## Which Service to Use?

You have TWO Lightsail services:
1. **karematch** - Uses ECR (needs more IAM permissions)
2. **therapyconnect** - Can use Lightsail's built-in registry (needs lightsailctl)

**Recommendation:** Since both have issues, consider using Render instead. It's simpler and has a free tier.
