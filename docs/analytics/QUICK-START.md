# Matomo Analytics - Quick Start Guide

This quick start guide will get you tracking anonymous visitors vs. authenticated users in **under 30 minutes**.

---

## Prerequisites

- [ ] Self-hosted Matomo instance (or ready to install one)
- [ ] Server with PHP 7.4+, MySQL 5.7+, SSL certificate
- [ ] Admin access to Matomo dashboard

---

## Step 1: Install Matomo (15 minutes)

### Option A: Quick Install (Recommended)

```bash
# SSH into your server
ssh user@your-server.com

# Download Matomo
cd /var/www
sudo wget https://builds.matomo.org/matomo-latest.zip
sudo unzip matomo-latest.zip

# Set up subdomain (e.g., analytics.yourdomain.com)
# Point to /var/www/matomo

# Set permissions
sudo chown -R www-data:www-data /var/www/matomo
sudo chmod -R 755 /var/www/matomo

# Create MySQL database
mysql -u root -p
CREATE DATABASE matomo;
CREATE USER 'matomo'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON matomo.* TO 'matomo'@'localhost';
FLUSH PRIVILEGES;
exit;

# Install SSL certificate (Let's Encrypt)
sudo certbot --nginx -d analytics.yourdomain.com

# Open browser and complete web installer
https://analytics.yourdomain.com
```

### Option B: Docker Install (Fastest)

```bash
# Create docker-compose.yml
version: '3'
services:
  matomo:
    image: matomo:latest
    ports:
      - "8080:80"
    environment:
      - MATOMO_DATABASE_HOST=db
      - MATOMO_DATABASE_ADAPTER=mysql
      - MATOMO_DATABASE_TABLES_PREFIX=matomo_
      - MATOMO_DATABASE_USERNAME=matomo
      - MATOMO_DATABASE_PASSWORD=matomo
      - MATOMO_DATABASE_DBNAME=matomo
    volumes:
      - ./matomo:/var/www/html
  db:
    image: mariadb:10
    environment:
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_DATABASE=matomo
      - MYSQL_USER=matomo
      - MYSQL_PASSWORD=matomo
    volumes:
      - ./db:/var/lib/mysql

# Start containers
docker-compose up -d

# Open browser
http://localhost:8080
```

---

## Step 2: Configure Matomo (5 minutes)

### 2.1 Create Two Websites

1. **Log into Matomo dashboard**
   - Go to: `https://analytics.yourdomain.com`

2. **Create Site 1 (Anonymous Visitors)**
   - Click: Administration → Websites → Manage
   - Click: "Add a new website"
   - Fill in:
     - Name: `TherapyConnect - Anonymous`
     - URL: `https://yourdomain.com`
     - Timezone: `Your timezone`
     - Ecommerce: `Disabled`
   - Click: "Save"
   - **Note the Site ID (should be 1)**

3. **Create Site 2 (Authenticated Users)**
   - Click: "Add a new website" again
   - Fill in:
     - Name: `TherapyConnect - Authenticated`
     - URL: `https://app.yourdomain.com`
     - Timezone: `Your timezone`
     - Ecommerce: `Disabled`
   - Click: "Save"
   - **Note the Site ID (should be 2)**

### 2.2 Enable HIPAA Compliance

1. **Anonymize IP Addresses**
   - Go to: Administration → Privacy → Anonymize Visitors' Data
   - Set: "Anonymize IP addresses" = **2 bytes** (or more)
   - Click: "Save"

2. **Set Data Retention**
   - Go to: Administration → Privacy → Delete Old Logs
   - Enable: "Regularly delete old visitor logs"
   - Set: "Delete logs older than" = **90 days** (or per your policy)
   - Enable: "Regularly delete old report data"
   - Click: "Save changes"

3. **Exclude Query Parameters**
   - Go to: Administration → Websites → Manage
   - Click on Site 1 (Anonymous)
   - Under "Excluded Query Parameters", add:
     ```
     email,phone,name,token,password,ssn
     ```
   - Repeat for Site 2 (Authenticated)

### 2.3 Create Authentication Token

1. **Generate Token**
   - Go to: Administration → Personal → Security
   - Scroll to: "Auth tokens"
   - Click: "Create new token"
   - Description: `TherapyConnect Server API`
   - Click: "Create new token"

2. **Copy Token**
   - **IMPORTANT**: Copy the token immediately (it won't be shown again)
   - Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

## Step 3: Configure Environment Variables (2 minutes)

### 3.1 Update Your .env File

Open your `.env` file and add:

```bash
# Matomo Analytics Configuration

# Anonymous visitor tracking (client-side)
VITE_MATOMO_URL=https://analytics.yourdomain.com
VITE_MATOMO_SITE_ID=1

# Authenticated user tracking (server-side)
MATOMO_URL=https://analytics.yourdomain.com
MATOMO_SITE_ID=2
MATOMO_AUTH_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Replace:**
- `https://analytics.yourdomain.com` with your actual Matomo URL
- `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` with your actual auth token

### 3.2 Restart Your Application

```bash
# If using npm
npm run dev

# If using Docker
docker-compose restart

# If on production server
pm2 restart therapyconnect
```

---

## Step 4: Test It Works (5 minutes)

### Test 1: Anonymous Visitor Tracking

1. **Open your app in incognito/private window**
   ```
   https://yourdomain.com
   ```

2. **Open browser DevTools (F12)**
   - Go to: Console tab
   - You should see:
     ```
     [Matomo] Anonymous visitor tracking initialized
     ```

3. **Check Network tab**
   - Filter by: `matomo`
   - You should see requests to `matomo.php`

4. **Verify in Matomo Dashboard**
   - Open: `https://analytics.yourdomain.com`
   - Go to: Site 1 (Anonymous) → Visitors → Real-time
   - Click: "Visitor Log"
   - **You should see your visit!**

### Test 2: User Registration Tracking

1. **Continue in same incognito window**

2. **Sign up for a new account**
   - Fill in email and password
   - Submit form

3. **Check browser console**
   - You should see:
     ```
     [Matomo] User ID set: abc-123-def-456
     ```

4. **Verify in Matomo Dashboard**
   - Go to: Site 2 (Authenticated) → Behaviour → Events
   - Filter by: Category = "User", Action = "Registration"
   - **You should see your registration event!**

### Test 3: Login Tracking

1. **Open new incognito window**

2. **Log in with existing account**

3. **Check server logs**
   ```bash
   # Should see:
   [Matomo Server] Event tracked: Authentication/Login for user abc-123-def-456
   ```

4. **Verify in Matomo Dashboard**
   - Go to: Site 2 (Authenticated) → Behaviour → Events
   - Filter by: Category = "Authentication", Action = "Login"
   - **You should see your login event!**

---

## Step 5: View Your Analytics (3 minutes)

### View Anonymous Visitors

1. **Go to Matomo Dashboard**
   - Select: Site 1 (Anonymous Visitors)

2. **Key Metrics to Watch:**
   - **Unique Visitors**: Total anonymous users
   - **Visits**: Number of sessions
   - **Bounce Rate**: % who leave immediately
   - **Top Entry Pages**: Where visitors land
   - **Referrers**: How they found you

### View Authenticated Users

1. **Go to Matomo Dashboard**
   - Select: Site 2 (Authenticated Users)

2. **Key Metrics to Watch:**
   - **Unique Users**: Total registered users
   - **Events by Category**: Feature usage
   - **User Engagement**: Return rate, session length
   - **Conversion Events**: Registration, login, profile completion

### Calculate Conversion Rate

```
Conversion Rate = (New Users / Unique Visitors) × 100

Example:
- Unique Visitors (Site 1): 1000
- New Registrations (Site 2): 150
- Conversion Rate: (150 / 1000) × 100 = 15%
```

---

## Troubleshooting

### Issue: No tracking data appearing

**Check 1: Environment variables**
```bash
echo $VITE_MATOMO_URL
echo $VITE_MATOMO_SITE_ID
echo $MATOMO_AUTH_TOKEN
```

**Check 2: Matomo is accessible**
```bash
curl https://analytics.yourdomain.com/matomo.php
# Should return: GIF89a
```

**Check 3: Browser console**
- Open DevTools → Console
- Look for Matomo-related errors

**Check 4: Server logs**
```bash
grep "Matomo" server.log
```

### Issue: Tracking works but no data in Matomo

**Check 1: Correct Site ID**
- Verify Site IDs match in `.env` and Matomo dashboard

**Check 2: Archiving**
- Matomo may need to process data
- Wait 5-10 minutes, then refresh

**Check 3: Real-time view**
- Go to: Visitors → Real-time → Visitor Log
- This shows data immediately without waiting for archiving

### Issue: Server-side tracking not working

**Check 1: Auth token**
```bash
curl "https://analytics.yourdomain.com/matomo.php?idsite=2&rec=1&action_name=test&token_auth=YOUR_TOKEN"
# Should return: HTTP 200 OK
```

**Check 2: Firewall**
- Ensure your server can reach Matomo URL
```bash
telnet analytics.yourdomain.com 443
```

**Check 3: SSL certificate**
- Matomo must have valid SSL certificate
- Test: `curl -v https://analytics.yourdomain.com`

---

## What's Next?

### Enhance Your Tracking

**1. Track custom events:**
```typescript
import { trackEvent } from '@/services/analytics';

// Track any user action
trackEvent('Feature', 'Export', 'PDF');
trackEvent('Search', 'Performed', undefined, resultsCount);
```

**2. Add custom dimensions:**
- Go to: Matomo → Administration → Custom Dimensions
- Create dimensions for:
  - User role (patient/provider)
  - Account age
  - Plan type
  - Feature flags

**3. Set up goals:**
- Go to: Matomo → Administration → Goals
- Create goals for:
  - User registration
  - Profile completion
  - First appointment booked
  - Message sent

### Create Dashboards

**Weekly Executive Dashboard:**
1. Go to: Dashboard → Create new dashboard
2. Add widgets:
   - Unique Visitors (Site 1)
   - New Registrations (Site 2, Events)
   - Conversion Rate (custom calculation)
   - Top Landing Pages
   - Referrers

**User Engagement Dashboard:**
1. Create new dashboard
2. Add widgets:
   - Active Users (last 7 days)
   - Events by Category
   - User Flow
   - Returning Visitors
   - Session Duration

### Set Up Alerts

**Email Reports:**
1. Go to: Dashboard → Email Reports
2. Create report: "Weekly Summary"
3. Include:
   - Visitor count
   - User registration count
   - Top pages
   - Goal completions
4. Schedule: Every Monday at 9am
5. Recipients: Add your email

**Anomaly Alerts:**
1. Install "Alerts" plugin in Matomo
2. Create alerts for:
   - Visitor count drops > 50%
   - Registration count drops > 30%
   - Error rate increases > 5%

---

## Summary Checklist

- [ ] Matomo installed and accessible
- [ ] Site 1 created (Anonymous Visitors)
- [ ] Site 2 created (Authenticated Users)
- [ ] IP anonymization enabled
- [ ] Data retention policy set
- [ ] Auth token created and copied
- [ ] Environment variables configured
- [ ] Application restarted
- [ ] Anonymous visitor tracking tested
- [ ] User registration tracking tested
- [ ] Login tracking tested
- [ ] Data visible in Matomo dashboard

---

## You're Done!

You can now:

✅ Track **anonymous visitors** browsing your site
✅ Track **authenticated users** after login
✅ Distinguish between the two groups
✅ Calculate conversion rates
✅ Monitor user engagement
✅ Maintain HIPAA compliance

**Key Metrics:**
- **Unique Visitors** (Site 1) = Anonymous users
- **Unique Users** (Site 2) = Registered users
- **Conversion Rate** = (Users / Visitors) × 100

**View Analytics:**
- Matomo Dashboard: `https://analytics.yourdomain.com`
- Real-time tracking: Visitors → Real-time → Visitor Log
- Events: Behaviour → Events

**Need Help?**
- Full guide: [`docs/analytics/MATOMO-IMPLEMENTATION-GUIDE.md`](./MATOMO-IMPLEMENTATION-GUIDE.md)
- Matomo docs: https://matomo.org/docs/
- Support: https://forum.matomo.org/

---

**Happy tracking! 📊**
