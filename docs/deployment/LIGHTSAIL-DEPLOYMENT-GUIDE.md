# AWS Lightsail Deployment Guide - Complete Walkthrough

## Overview

This guide walks you through deploying the KareMatch application to AWS Lightsail container service using the `lightsailctl` plugin.

## Current Status

### ✅ What's Ready
- Docker image built and tested locally (`karematch:latest`)
- IAM user (`cli-deployment-user`) has full Lightsail permissions
- Lightsail container service `karematch` created and configured
- 7 environment variables configured in the service:
  - `NODE_ENV=production`
  - `PORT=5000`
  - `AWS_REGION=us-east-1`
  - `DATABASE_URL=postgresql://...` (RDS connection string)
  - `SESSION_SECRET=...`
  - `ENCRYPTION_KEY=...`
  - `USE_PARAMETER_STORE=true`
- Health check configured: `/health` endpoint
- Public domain: `karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com`

### ⚠️ The Issue
The `lightsailctl` plugin is installed but AWS CLI can't find it because it's not in the Windows system PATH.

## Deployment Steps

### Prerequisites

1. **Docker Desktop** running
2. **AWS CLI v2** installed (you have 2.31.18 ✅)
3. **AWS credentials** configured (you have this ✅)
4. **PowerShell with Administrator privileges**

### Step 1: Fix the lightsailctl PATH

This needs to be done **once** and will fix the issue permanently.

**Open PowerShell as Administrator:**
1. Press Windows key
2. Type "PowerShell"
3. Right-click "Windows PowerShell"
4. Select "Run as Administrator"

**Run the PATH fix script:**
```powershell
cd C:\TherapyConnect
.\fix-lightsail-path.ps1
```

**What this does:**
- Verifies `lightsailctl.exe` exists at `C:\Users\mylai\.aws\plugins\lightsail\bin`
- Adds that directory to the Windows system PATH
- Tests if AWS CLI can now find the plugin

**Expected output:**
```
✅ Found: C:\Users\mylai\.aws\plugins\lightsail\bin\lightsailctl.exe
✅ Added to System PATH
✅ Session PATH updated
✅ SUCCESS! AWS CLI can now find the lightsailctl plugin
```

**If it says to restart PowerShell:**
- Close the PowerShell window
- Open a NEW PowerShell as Administrator
- Continue to Step 2

### Step 2: Deploy to Lightsail

**In the same or new PowerShell (Administrator) window:**
```powershell
cd C:\TherapyConnect
.\deploy-to-lightsail.ps1
```

**What this script does:**
1. Verifies the Docker image exists locally
2. Tests that lightsailctl is working
3. **Pushes the image to Lightsail's registry** (this takes 2-5 minutes)
4. Outputs an image reference like: `:karematch.latest.1`
5. Provides instructions for the manual deployment step

**Expected output:**
```
[1/5] Verifying Docker image...
✅ Found image: karematch:latest

[2/5] Testing lightsailctl plugin...
✅ lightsailctl plugin is available

[3/5] Pushing image to Lightsail...
This may take several minutes...

<upload progress...>

✅ Image pushed successfully!
Image reference: :karematch.latest.1
```

**IMPORTANT:** Copy the image reference (e.g., `:karematch.latest.1`) - you'll need it in the next step!

### Step 3: Update Deployment in Lightsail Console

The script will pause and ask you to complete this manual step in the AWS web console.

**Open your browser and go to:**
```
https://lightsail.aws.amazon.com/ls/webapp/us-east-1/container-services/karematch/deployments
```

**Follow these steps:**

1. **Click the "Modify your deployment" button**

2. **In the "Image" field**, you'll see:
   ```
   051826703172.dkr.ecr.us-east-1.amazonaws.com/karematch:latest
   ```

3. **DELETE that entire URL and replace it with the image reference from Step 2:**
   ```
   :karematch.latest.1
   ```
   (Use the actual reference number from your deployment output)

4. **Verify the environment variables are still there:**
   - NODE_ENV
   - PORT
   - AWS_REGION
   - DATABASE_URL
   - SESSION_SECRET
   - ENCRYPTION_KEY
   - USE_PARAMETER_STORE

5. **Verify the configuration:**
   - Container name: `karematch`
   - Open ports: `5000` (HTTP)
   - Launch command: `launch.sh`

6. **Scroll to the bottom and click "Save and deploy"**

7. **Wait for deployment** (usually 2-3 minutes)
   - You'll see the status change from "Deploying" to "Active"
   - The page will refresh automatically

### Step 4: Verify Deployment

**Back in PowerShell**, the script will ask:
```
Have you completed the manual deployment steps? (yes/no)
```

Type `yes` and press Enter.

**The script will test the health endpoint:**
```
Testing health endpoint...
✅ SUCCESS! Application is running
Status Code: 200

Application URL: https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com/health
```

**If the health check fails:**
- Wait 1-2 more minutes (deployment might still be finalizing)
- Check the Lightsail console for deployment status
- Check the "Logs" tab for any errors

### Step 5: Test Your Application

**Visit these URLs to verify everything works:**

1. **Health check:**
   ```
   https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com/health
   ```
   Should return: `{"status":"ok"}`

2. **API endpoints:**
   ```
   https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com/api/therapists
   ```

3. **Full application:**
   ```
   https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com
   ```

## Troubleshooting

### Issue: "lightsailctl plugin not found"

**Solution:**
1. Run `.\fix-lightsail-path.ps1` as Administrator
2. Close PowerShell completely
3. Open a NEW PowerShell as Administrator
4. Test: `aws lightsail push-container-image --help`
5. If still failing, restart your computer to ensure PATH changes take effect

### Issue: Deployment fails with "Health check failed"

**Possible causes:**
1. Application not listening on port 5000
2. `/health` endpoint not responding
3. Database connection issues
4. Environment variables incorrect

**Check the logs:**
1. Go to Lightsail console → karematch → Logs tab
2. Look for error messages
3. Common issues:
   - Database connection refused (check DATABASE_URL)
   - Missing environment variables
   - Port mismatch

### Issue: "No logs available"

This means the container never started. Possible causes:
1. Docker image corrupted
2. Syntax error in Dockerfile
3. Missing dependencies

**Solution:**
1. Test locally first: `docker run -p 5001:5000 karematch:latest`
2. Check local container logs: `docker logs <container-id>`
3. Fix any issues
4. Rebuild image: `docker build -t karematch:latest .`
5. Re-run deployment script

### Issue: IAM permission errors

**Error message:**
```
User is not authorized to perform: lightsail:CreateContainerServiceRegistryLogin
```

**Solution:**
1. Go to IAM console: https://console.aws.amazon.com/iam/
2. Click Users → cli-deployment-user
3. Verify the `LightsailFullAccess` policy is attached
4. If not, add it:
   - Click "Add permissions" → "Attach policies directly"
   - Search for "Lightsail"
   - Check "AmazonLightsailFullAccess"
   - Click "Add permissions"

## Post-Deployment

### Monitor Your Application

**Lightsail Console:**
- Metrics: CPU, memory, network usage
- Logs: Real-time application logs
- Deployments: History of all deployments

**CloudWatch (optional):**
```bash
aws logs tail /aws/lightsail/containers/karematch/karematch --region us-east-1 --follow
```

### Update Your Application

When you make code changes:

1. **Rebuild Docker image:**
   ```bash
   docker build -t karematch:latest .
   ```

2. **Run deployment script:**
   ```powershell
   .\deploy-to-lightsail.ps1
   ```

3. **Update image reference in Lightsail console** (the version number will increment)

### Scale Your Application

To handle more traffic:

1. Go to Lightsail console → karematch → Capacity tab
2. Increase the scale (number of nodes)
3. Or upgrade the power (Nano → Micro → Small)

**Pricing:**
- Nano (512 MB RAM): $7/month
- Micro (1 GB RAM): $15/month
- Small (2 GB RAM): $30/month

## Files Reference

### Created Scripts

- **`fix-lightsail-path.ps1`** - One-time PATH configuration (run as Administrator)
- **`deploy-to-lightsail.ps1`** - Complete deployment automation (run as Administrator)
- **`install-plugin.ps1`** - Downloads and installs lightsailctl (already done)

### Configuration Files

- **`Dockerfile`** - Container image definition
- **`lightsail-deployment.json`** - Service configuration (for `therapyconnect` service)
- **`.dockerignore`** - Files excluded from Docker image

### Documentation

- **`LIGHTSAIL-DEPLOYMENT-GUIDE.md`** (this file) - Complete deployment walkthrough
- **`IAM-PERMISSIONS-NEEDED.md`** - IAM policy documentation
- **`MANUAL-DEPLOY.md`** - Alternative deployment methods

## Support Resources

- **AWS Lightsail Documentation:** https://docs.aws.amazon.com/lightsail/
- **lightsailctl GitHub:** https://github.com/aws/lightsailctl
- **Docker Documentation:** https://docs.docker.com/

## Summary Checklist

- [ ] Run `.\fix-lightsail-path.ps1` as Administrator
- [ ] Restart PowerShell (new Administrator session)
- [ ] Run `.\deploy-to-lightsail.ps1` as Administrator
- [ ] Copy the image reference from output (e.g., `:karematch.latest.1`)
- [ ] Go to Lightsail console deployment page
- [ ] Click "Modify your deployment"
- [ ] Replace Image field with the new reference
- [ ] Click "Save and deploy"
- [ ] Wait 2-3 minutes for deployment
- [ ] Test health endpoint
- [ ] Test application endpoints
- [ ] Monitor logs for any errors

## Next Steps After Successful Deployment

1. **Set up a custom domain** (optional)
   - Lightsail → Custom domains tab
   - Add your domain and configure DNS

2. **Enable automatic deployments** (optional)
   - Connect GitHub repository
   - Auto-deploy on push to main branch

3. **Set up monitoring alerts**
   - CloudWatch alarms for CPU/memory
   - Lightsail metrics and notifications

4. **Configure backups**
   - Database snapshots
   - Container service configurations

5. **Implement CI/CD** (optional)
   - GitHub Actions workflow
   - Automated testing and deployment

---

**Good luck with your deployment!** 🚀

If you encounter any issues not covered in this guide, check the Lightsail logs first - they usually contain the specific error message that will point you to the solution.
