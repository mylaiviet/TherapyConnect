# ⚡ KareMatch Quick Deploy Reference

**One-Page Cheat Sheet for Lightsail Deployment**

---

## 🚀 **FASTEST PATH: Run This One Command**

```powershell
.\scripts\deploy-to-lightsail.ps1
```

Then follow the on-screen instructions for Lightsail console.

---

## 📋 **Manual 4-Step Deploy**

### 1️⃣ Build & Test (2 min)
```bash
docker build -t karematch:latest .
docker run -d -p 5001:5000 --name test karematch:latest
curl http://localhost:5001/health  # Should return {"status":"healthy"}
docker stop test && docker rm test
```

### 2️⃣ Push to Lightsail (3 min)
```bash
aws lightsail push-container-image \
  --service-name karematch \
  --label latest \
  --image karematch:latest \
  --region us-east-1
```
**⚠️ Copy the output:** `:karematch.latest`

### 3️⃣ Configure Environment (5 min)

Go to: https://lightsail.aws.amazon.com/ls/webapp/us-east-1/container-services/karematch

**Environment Variables:**
```
USE_PARAMETER_STORE=true
AWS_REGION=us-east-1
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:Welcome2ppmsi%21@karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=no-verify
SESSION_SECRET=ire9naslXt6kh8DPqPm+KACgT6YMqv95VQl4r2v+YAHumjMYoyKBVFIXbDyOSDXg
ENCRYPTION_KEY=pDKEOfmV0N8nm4AsxAq4FsF+erq1ijJ1Qx5NMw+0NfM=
```

**Health Check:**
- Path: `/health`
- Timeout: `10 seconds`
- Interval: `10 seconds`

### 4️⃣ Deploy & Verify (10 min)
```bash
# Click "Save and deploy" in console

# Wait for deployment, then test:
curl https://karematch.xxxxx.us-east-1.cs.amazonlightsail.com/health
```

---

## ✅ **Success Checklist**

- [ ] Logs show "serving on port 5000"
- [ ] Health endpoint returns 200
- [ ] Memory < 80%
- [ ] API endpoints work

---

## 🚨 **Common Fixes**

| Problem | Solution |
|---------|----------|
| Deployment canceled after 3 tries | Health check timeout too low → set to 10s |
| "Failed to load secrets" | Add `USE_PARAMETER_STORE=true` env var |
| "self-signed certificate" | Change `sslmode=require` to `sslmode=no-verify` |
| Container crashes | Check logs for errors, verify all 7 env vars set |

---

## 🔍 **Quick Commands**

```bash
# View logs
aws logs tail /aws/lightsail/containers/karematch/karematch --follow

# Check deployment
aws lightsail get-container-services --service-name karematch --query 'containerServices[0].state'

# Force redeploy
aws lightsail create-container-service-deployment \
  --service-name karematch \
  --cli-input-json file://lightsail-container-config.json
```

---

## 📊 **Health Endpoint**

```bash
curl https://your-url.com/health
```

**Good Response:**
```json
{
  "status": "healthy",
  "uptime": 42.5,
  "memory": {
    "heapUsed": "87MB",
    "percentage": "23%"
  }
}
```

---

## 📚 **Full Documentation**

- **DEPLOYMENT-GUIDE.md** - Complete step-by-step guide
- **DEPLOYMENT-CHECKLIST.md** - Full task checklist
- **scripts/deploy-to-lightsail.ps1** - Automated deployment

---

**Last Updated:** 2025-10-19 | **Phase:** 1 Complete ✅
