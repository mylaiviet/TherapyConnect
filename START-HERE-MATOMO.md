# 🚀 Start Here: Matomo Analytics Setup

## What You're About To Do (10 Minutes)

You're going to set up **self-hosted Matomo analytics** to track:
- ✅ **Anonymous visitors** (people browsing before signing up)
- ✅ **Authenticated users** (people after login/signup)
- ✅ **Complete user journey** (visitor → signup → user)

**Cost**: $0 (completely free, open source)
**Complexity**: Low (automated script does everything)
**Time**: 10 minutes

---

## ⚡ Quick Start (Just 3 Steps!)

### Step 1: Start Matomo (1 minute)

**Open Command Prompt or PowerShell and run:**

```cmd
cd C:\TherapyConnect
setup-matomo.bat
```

This will:
- ✅ Check Docker is installed
- ✅ Download Matomo containers
- ✅ Start Matomo server
- ✅ Open browser automatically

**Wait for**: Browser to open http://localhost:8080

---

### Step 2: Complete Installation Wizard (5 minutes)

Your browser should open automatically. Follow these steps:

#### 2.1 Welcome Screen
- Click **"Next"**

#### 2.2 System Check
- All green checkmarks? Good!
- Click **"Next"**

#### 2.3 Database Setup
**COPY THESE EXACT VALUES:**
```
Database Server:   matomo-db
Login:            matomo
Password:         SecurePassword123!
Database Name:    matomo
Table Prefix:     matomo_
```
- Click **"Next"**

#### 2.4 Super User (YOUR ADMIN ACCOUNT)
```
Super user login:    admin
Password:           (choose a STRONG password - SAVE IT!)
Email:              your-email@example.com
```
- Click **"Next"**

#### 2.5 First Website (Anonymous Visitors)
```
Website name:     TherapyConnect - Anonymous
Website URL:      https://therapyconnect.com
Timezone:         (your timezone)
Ecommerce:       No
```
- Click **"Next"**
- **IMPORTANT**: Note the Site ID (**should be 1**)

#### 2.6 JavaScript Code
- Skip this (click **"Next"**)

#### 2.7 Done!
- Click **"Continue to Matomo"**

---

### Step 3: Final Configuration (4 minutes)

#### 3.1 Create Second Website (Authenticated Users)

1. Click **Administration** (gear icon top right)
2. Click **Websites** → **Manage**
3. Click **"Add a new website"**
4. Enter:
   ```
   Website name:     TherapyConnect - Authenticated
   Website URL:      https://app.therapyconnect.com
   Timezone:         (same as before)
   Ecommerce:       No
   ```
5. Click **"Save"**
6. **IMPORTANT**: Note the Site ID (**should be 2**)

#### 3.2 Enable HIPAA Compliance

1. Click **Administration** → **Privacy** → **Anonymize Visitors' Data**
2. Set **"Anonymize IP addresses"** = **2 bytes**
3. Click **"Save"**

4. Click **Administration** → **Privacy** → **Delete Old Logs**
5. Check **"Regularly delete old visitor logs"**
6. Set **"Delete logs older than"** = **90 days**
7. Click **"Save changes"**

#### 3.3 Generate API Token

1. Click **Administration** → **Personal** → **Security**
2. Scroll to **"Auth tokens"**
3. Click **"Create new token"**
4. Description: `TherapyConnect Server API`
5. Click **"Create new token"**
6. **COPY THE TOKEN** (looks like: a1b2c3d4e5f6...)

#### 3.4 Update .env File

Open `C:\TherapyConnect\.env` and find this line:
```
MATOMO_AUTH_TOKEN=REPLACE_WITH_TOKEN_FROM_MATOMO_DASHBOARD
```

Replace it with your actual token:
```
MATOMO_AUTH_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

Save the file.

#### 3.5 Install Axios & Restart

```cmd
cd C:\TherapyConnect
npm install axios
npm run dev
```

---

## ✅ Verify It's Working

### Test 1: Check Browser Console

1. Open your app: http://localhost:5000
2. Press **F12** (open DevTools)
3. Go to **Console** tab
4. You should see:
   ```
   [Matomo] Anonymous visitor tracking initialized
   ```

### Test 2: Check Network Requests

1. Still in DevTools, go to **Network** tab
2. Type `matomo` in the filter box
3. Refresh the page
4. You should see requests to `matomo.php` with status **200**

### Test 3: Check Matomo Dashboard

1. Open Matomo: http://localhost:8080
2. Go to: **Visitors** → **Real-time** → **Visitor Log**
3. **You should see your visit!** 🎉

---

## 🎉 Success! What Now?

You now have a complete analytics system tracking:

### What's Being Tracked

**Anonymous Visitors (Site 1):**
- Page views
- Session duration
- Navigation patterns
- Where they came from
- Device/browser info

**Authenticated Users (Site 2):**
- Everything above, PLUS:
- Login/logout events
- Registration events
- Custom events (searches, appointments, etc.)

### View Your Analytics

**Matomo Dashboard**: http://localhost:8080

**Key Reports:**
- **Visitors → Overview**: Daily traffic
- **Visitors → Real-time**: Live visitor activity
- **Behaviour → Pages**: Most viewed pages
- **Behaviour → Events**: Custom events (login, signup, etc.)

### Key Metrics

**In Matomo, compare:**
- Site 1 (Anonymous) = Unique Visitors
- Site 2 (Authenticated) = Unique Users
- Conversion Rate = (Users / Visitors) × 100

---

## 📚 Documentation

**For detailed information:**
- **Docker Setup**: [docs/analytics/DOCKER-SETUP.md](./docs/analytics/DOCKER-SETUP.md)
- **Quick Start**: [docs/analytics/QUICK-START.md](./docs/analytics/QUICK-START.md)
- **Full Guide**: [docs/analytics/MATOMO-IMPLEMENTATION-GUIDE.md](./docs/analytics/MATOMO-IMPLEMENTATION-GUIDE.md)

---

## 🔧 Common Commands

### View Matomo Logs
```cmd
docker-compose -f docker-compose.matomo.yml logs -f
```

### Stop Matomo
```cmd
docker-compose -f docker-compose.matomo.yml down
```

### Restart Matomo
```cmd
docker-compose -f docker-compose.matomo.yml restart
```

### Start Matomo Again
```cmd
docker-compose -f docker-compose.matomo.yml up -d
```

---

## ❓ Troubleshooting

### "Docker is not installed"
1. Install Docker Desktop: https://www.docker.com/products/docker-desktop
2. Restart your computer
3. Run `setup-matomo.bat` again

### "Port 8080 already in use"
1. Stop whatever is using port 8080
2. Or edit `docker-compose.matomo.yml` and change `8080:80` to `8081:80`
3. Run `setup-matomo.bat` again

### "Can't access http://localhost:8080"
1. Check Docker Desktop is running
2. Check containers are running:
   ```cmd
   docker ps | findstr matomo
   ```
3. View logs:
   ```cmd
   docker-compose -f docker-compose.matomo.yml logs
   ```

### "Tracking not working"
1. Check `.env` file has correct Matomo URLs
2. Make sure you ran `npm install axios`
3. Restart app: `npm run dev`
4. Check browser console for errors (F12)

---

## 📊 What You Can Track Now

### Anonymous Visitors
- "How many people visit our site?"
- "Where do they come from?"
- "What pages do they view?"
- "How long do they stay?"

### Authenticated Users
- "How many visitors sign up?"
- "What's our conversion rate?"
- "Which features do users engage with?"
- "How often do users return?"

### User Journey
- "What do visitors do before signing up?"
- "Which landing pages convert best?"
- "Where do visitors drop off?"

---

## ✨ You're Done!

**Everything is set up and working!**

- ✅ Matomo running on Docker
- ✅ Two websites configured (Anonymous & Authenticated)
- ✅ HIPAA compliance enabled
- ✅ TherapyConnect integrated
- ✅ Tracking verified

**Start browsing your app to generate data!**

The more you use your app, the more analytics data you'll collect.

---

## 🎯 Next Steps

1. **Browse your app** to generate some test data
2. **Check Matomo dashboard** to see the data
3. **Read the full docs** to learn about advanced features
4. **Set up custom events** for specific features (see docs)

---

**Need help?** See [docs/analytics/DOCKER-SETUP.md](./docs/analytics/DOCKER-SETUP.md) for detailed troubleshooting.

**Questions about implementation?** See [docs/analytics/MATOMO-IMPLEMENTATION-GUIDE.md](./docs/analytics/MATOMO-IMPLEMENTATION-GUIDE.md)

---

**Happy tracking! 📈**
