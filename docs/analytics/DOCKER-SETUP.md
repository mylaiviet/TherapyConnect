# Matomo Docker Setup - Complete Guide

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- 4GB RAM available
- 10GB disk space available

### Step 1: Start Matomo

**Windows:**
```cmd
cd C:\TherapyConnect
setup-matomo.bat
```

**Mac/Linux:**
```bash
cd ~/TherapyConnect
chmod +x scripts/setup-matomo.sh
./scripts/setup-matomo.sh
```

**Or manually:**
```bash
docker-compose -f docker-compose.matomo.yml up -d
```

### Step 2: Complete Web Installation

1. **Open browser**: http://localhost:8080
2. **Follow the wizard** (see detailed steps below)
3. **Done!**

---

## 📋 Detailed Installation Steps

### Installation Wizard

#### Screen 1: Welcome
- Click **"Next"**

#### Screen 2: System Check
- All checks should be green
- Click **"Next"**

#### Screen 3: Database Setup

**IMPORTANT: Use these exact values:**
```
Database Server:   matomo-db
Login:            matomo
Password:         SecurePassword123!
Database Name:    matomo
Table Prefix:     matomo_
```

- Click **"Next"**

#### Screen 4: Database Tables
- Wait for tables to be created
- Click **"Next"**

#### Screen 5: Super User

**Create your admin account:**
```
Super user login:    admin
Password:           (choose a strong password - SAVE THIS!)
Email:              your-email@example.com
```

- Check "Subscribe to newsletter" if desired
- Click **"Next"**

#### Screen 6: Setup Website 1 (Anonymous Visitors)

**Enter these details:**
```
Website name:     TherapyConnect - Anonymous
Website URL:      https://therapyconnect.com
Website timezone: (select your timezone)
Ecommerce:       No
```

- Click **"Next"**
- **IMPORTANT**: Note the Site ID (should be **1**)

#### Screen 7: JavaScript Tracking Code
- You can skip this (we already have custom implementation)
- Click **"Next"**

#### Screen 8: Congratulations!
- Click **"Continue to Matomo"**

### Create Website 2 (Authenticated Users)

After installation:

1. **Go to**: Administration (gear icon) → Websites → Manage
2. **Click**: "Add a new website"
3. **Enter details:**
   ```
   Website name:     TherapyConnect - Authenticated
   Website URL:      https://app.therapyconnect.com
   Website timezone: (same as Website 1)
   Ecommerce:       No
   ```
4. **Click**: "Save"
5. **IMPORTANT**: Note the Site ID (should be **2**)

---

## 🔐 HIPAA Compliance Configuration

### Step 1: Anonymize IP Addresses

1. **Go to**: Administration → Privacy → Anonymize Visitors' Data
2. **Set**: "Anonymize IP addresses" = **2 bytes**
3. **Click**: "Save"

### Step 2: Set Data Retention

1. **Go to**: Administration → Privacy → Delete Old Logs
2. **Enable**: "Regularly delete old visitor logs"
3. **Set**: "Delete logs older than" = **90 days**
4. **Enable**: "Regularly delete old report data"
5. **Set**: "Delete reports older than" = **180 days**
6. **Click**: "Save changes"

### Step 3: Exclude PHI Query Parameters

**For Site 1 (Anonymous):**
1. **Go to**: Administration → Websites → Manage
2. **Click on**: "TherapyConnect - Anonymous"
3. **Find**: "Excluded Query Parameters"
4. **Add**: `email,phone,name,token,password,ssn,dob`
5. **Click**: "Save"

**For Site 2 (Authenticated):**
1. Repeat above steps for "TherapyConnect - Authenticated"

### Step 4: Enable 2FA (Recommended)

1. **Go to**: Administration → Personal → Security
2. **Click**: "Enable Two-Factor Authentication"
3. **Scan QR code** with authenticator app (Google Authenticator, Authy, etc.)
4. **Enter code** from app
5. **Save backup codes** in safe place
6. **Click**: "Enable"

---

## 🔑 Generate API Authentication Token

1. **Go to**: Administration → Personal → Security
2. **Scroll to**: "Auth tokens"
3. **Click**: "Create new token"
4. **Description**: `TherapyConnect Server API`
5. **Click**: "Create new token"
6. **COPY THE TOKEN** (32+ characters)
   - Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
   - You won't see this again!

---

## ⚙️ Update TherapyConnect .env File

Open your `.env` file and add:

```bash
# Matomo Analytics Configuration

# Anonymous visitor tracking (client-side)
VITE_MATOMO_URL=http://localhost:8080
VITE_MATOMO_SITE_ID=1

# Authenticated user tracking (server-side)
MATOMO_URL=http://localhost:8080
MATOMO_SITE_ID=2
MATOMO_AUTH_TOKEN=paste_your_token_here
```

**Replace** `paste_your_token_here` with the actual token you copied.

---

## 🧪 Test the Installation

### Test 1: Verify Matomo is Running

```bash
# Should return "GIF89a"
curl http://localhost:8080/matomo.php
```

### Test 2: Test API Authentication

```bash
# Replace YOUR_TOKEN with your actual token
curl "http://localhost:8080/?module=API&method=API.getMatomoVersion&format=JSON&token_auth=YOUR_TOKEN"

# Should return: {"value":"5.x.x"}
```

### Test 3: Install Axios and Restart TherapyConnect

```bash
cd C:\TherapyConnect

# Install axios dependency
npm install axios

# Restart your app
npm run dev
```

### Test 4: Verify Client-Side Tracking

1. **Open app**: http://localhost:5000
2. **Open DevTools**: Press F12
3. **Go to Console tab**
4. **You should see**: `[Matomo] Anonymous visitor tracking initialized`
5. **Go to Network tab**
6. **Filter by**: `matomo`
7. **Refresh page**
8. **You should see**: Request to `matomo.php` with status 200

### Test 5: Verify in Matomo Dashboard

1. **Open Matomo**: http://localhost:8080
2. **Go to**: Visitors → Real-time → Visitor Log
3. **You should see**: Your visit!

---

## 🐳 Docker Commands

### View Logs

```bash
# All containers
docker-compose -f docker-compose.matomo.yml logs -f

# Just Matomo
docker logs -f therapyconnect-matomo

# Just database
docker logs -f therapyconnect-matomo-db
```

### Stop Matomo

```bash
docker-compose -f docker-compose.matomo.yml down
```

### Restart Matomo

```bash
docker-compose -f docker-compose.matomo.yml restart
```

### Start Matomo

```bash
docker-compose -f docker-compose.matomo.yml up -d
```

### Check Status

```bash
docker-compose -f docker-compose.matomo.yml ps
```

### Update Matomo

```bash
# Pull latest images
docker-compose -f docker-compose.matomo.yml pull

# Restart with new images
docker-compose -f docker-compose.matomo.yml up -d
```

---

## 💾 Backup and Restore

### Backup

```bash
# Stop containers
docker-compose -f docker-compose.matomo.yml down

# Backup volumes
docker run --rm -v therapyconnect-matomo-data:/data -v $(pwd):/backup ubuntu tar czf /backup/matomo-data-backup.tar.gz /data
docker run --rm -v therapyconnect-matomo-db-data:/data -v $(pwd):/backup ubuntu tar czf /backup/matomo-db-backup.tar.gz /data

# Restart containers
docker-compose -f docker-compose.matomo.yml up -d
```

### Restore

```bash
# Stop containers
docker-compose -f docker-compose.matomo.yml down

# Remove old volumes
docker volume rm therapyconnect-matomo-data therapyconnect-matomo-db-data

# Restore from backups
docker run --rm -v therapyconnect-matomo-data:/data -v $(pwd):/backup ubuntu tar xzf /backup/matomo-data-backup.tar.gz -C /
docker run --rm -v therapyconnect-matomo-db-data:/data -v $(pwd):/backup ubuntu tar xzf /backup/matomo-db-backup.tar.gz -C /

# Restart containers
docker-compose -f docker-compose.matomo.yml up -d
```

---

## 🔧 Troubleshooting

### Matomo won't start

**Check logs:**
```bash
docker-compose -f docker-compose.matomo.yml logs
```

**Common issues:**
- Port 8080 already in use → Change port in `docker-compose.matomo.yml`
- Not enough memory → Increase Docker Desktop memory limit
- Docker not running → Start Docker Desktop

### Can't access http://localhost:8080

**Check if container is running:**
```bash
docker ps | grep matomo
```

**If not running, check why:**
```bash
docker logs therapyconnect-matomo
```

**Try restarting:**
```bash
docker-compose -f docker-compose.matomo.yml restart
```

### Database connection error during setup

**Verify database is running:**
```bash
docker ps | grep matomo-db
```

**Check database credentials** in `docker-compose.matomo.yml`:
- Should match what you entered in wizard
- Default: `matomo-db` / `matomo` / `SecurePassword123!`

### Tracking not working in TherapyConnect

**Check environment variables:**
```bash
# In your .env file
VITE_MATOMO_URL=http://localhost:8080
VITE_MATOMO_SITE_ID=1
MATOMO_URL=http://localhost:8080
MATOMO_SITE_ID=2
MATOMO_AUTH_TOKEN=your_token
```

**Restart app:**
```bash
npm run dev
```

**Check browser console** for errors

### Archive cron not running

**Check archive container logs:**
```bash
docker logs therapyconnect-matomo-archive
```

**Should see** archiving messages every 5 minutes

---

## 📊 Performance Tuning

### Increase Database Memory

Edit `docker-compose.matomo.yml`:

```yaml
matomo-db:
  command:
    - --max-allowed-packet=64MB
    - --innodb-buffer-pool-size=1G  # Increase from 512M
    - --character-set-server=utf8mb4
    - --collation-server=utf8mb4_unicode_ci
```

### Increase PHP Memory

Edit `docker-compose.matomo.yml`:

```yaml
matomo:
  environment:
    - PHP_MEMORY_LIMIT=4096M  # Increase from 2048M
```

Then restart:
```bash
docker-compose -f docker-compose.matomo.yml restart
```

---

## 🌐 Production Deployment

### Add SSL/HTTPS Support

Create `nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name analytics.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/analytics.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/analytics.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Update .env for Production

```bash
# Use your actual domain
VITE_MATOMO_URL=https://analytics.yourdomain.com
MATOMO_URL=https://analytics.yourdomain.com
```

---

## ✅ Configuration Checklist

- [ ] Docker Desktop installed and running
- [ ] Matomo containers started
- [ ] Web installation wizard completed
- [ ] Site 1 created (Anonymous - ID: 1)
- [ ] Site 2 created (Authenticated - ID: 2)
- [ ] IP anonymization enabled (2 bytes)
- [ ] Data retention policy set (90 days)
- [ ] PHI query parameters excluded
- [ ] 2FA enabled for admin account
- [ ] API auth token generated
- [ ] `.env` file updated with Matomo config
- [ ] Axios installed (`npm install axios`)
- [ ] TherapyConnect app restarted
- [ ] Tracking verified in browser console
- [ ] Visit visible in Matomo dashboard

---

## 📚 Next Steps

1. ✅ Matomo is running
2. ✅ Configuration complete
3. **Read**: [QUICK-START.md](./QUICK-START.md) for full configuration details
4. **Browse your app** to generate test data
5. **View analytics** in Matomo dashboard
6. **Set up dashboards** and reports in Matomo

---

## 🆘 Need Help?

- **Docker issues**: Check Docker Desktop logs
- **Matomo issues**: Check container logs with `docker-compose -f docker-compose.matomo.yml logs -f`
- **Tracking issues**: See [MATOMO-IMPLEMENTATION-GUIDE.md § Troubleshooting](./MATOMO-IMPLEMENTATION-GUIDE.md#troubleshooting)
- **HIPAA questions**: See [MATOMO-IMPLEMENTATION-GUIDE.md § HIPAA Compliance](./MATOMO-IMPLEMENTATION-GUIDE.md#hipaa-compliance)

---

**You're all set!** Matomo is now collecting analytics data for TherapyConnect. 🎉
