$env:PATH = "C:\TherapyConnect;" + $env:PATH
& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" lightsail push-container-image --service-name therapyconnect --label latest --image karematch:latest --region us-east-1
