# IAM Permissions Needed for Lightsail Deployment

## Current Error
```
User: arn:aws:iam::051826703172:user/lightsail-app-user is not authorized to perform:
lightsail:CreateContainerServiceRegistryLogin
```

## Required IAM Permissions

Your IAM user `cli-deployment-user` needs these additional permissions:

### Option 1: Add to Existing Policy (Recommended)

1. Go to AWS Console: https://console.aws.amazon.com/iam/
2. Click **Users** → **cli-deployment-user**
3. Click **Add permissions** → **Create inline policy**
4. Click **JSON** tab and paste:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lightsail:CreateContainerServiceRegistryLogin",
                "lightsail:PushContainerImage",
                "lightsail:GetContainerImages"
            ],
            "Resource": "*"
        }
    ]
}
```

5. Name it: `LightsailRegistryAccess`
6. Click **Create policy**

### Option 2: Use AWS Managed Policy

Alternatively, attach the AWS managed policy:
- **AmazonLightsailFullAccess** (gives full Lightsail access)

### After Adding Permissions

Run this command again in PowerShell (Administrator):
```powershell
cd C:\TherapyConnect
aws lightsail push-container-image --service-name karematch --label latest --image karematch:latest --region us-east-1
```

This will:
1. Push your `karematch:latest` Docker image to Lightsail
2. Return an image reference like: `:karematch.latest.1`
3. You'll use that reference in the deployment

### Then Update Deployment

In Lightsail Console:
1. Go to Deployments tab
2. Click "Modify your deployment"
3. Change the **Image** field from:
   - `051826703172.dkr.ecr.us-east-1.amazonaws.com/karematch:latest`
   - TO: `:karematch.latest.1` (the reference from the push command)
4. Click "Save and deploy"

## Why This Is Needed

Lightsail has its own container registry (separate from ECR). The `push-container-image` command:
1. Authenticates with Lightsail's registry (needs `CreateContainerServiceRegistryLogin`)
2. Pushes the Docker image (needs `PushContainerImage`)
3. Stores it in Lightsail's registry (associated with your service)

This is simpler than ECR because the registry is built-in to the Lightsail service.
