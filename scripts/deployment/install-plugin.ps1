$pluginDir = Join-Path $env:USERPROFILE ".aws\plugins\lightsail\bin"
New-Item -ItemType Directory -Force -Path $pluginDir | Out-Null
Copy-Item -Path ".\lightsailctl.exe" -Destination (Join-Path $pluginDir "lightsailctl.exe") -Force
Write-Host "✅ Lightsailctl plugin installed to $pluginDir"
