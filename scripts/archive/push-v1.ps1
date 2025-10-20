$env:PATH = "C:\TherapyConnect;" + $env:PATH
& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" lightsail push-container-image --service-name therapyconnect --label v1 --image karematch:v1 --region us-east-1
