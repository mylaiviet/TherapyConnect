# How to Access Admin Analytics Dashboard

## Quick Start Guide

### Step 1: Create Admin Account

You have two options:

#### Option A: Automatic (Recommended)
```bash
# Make sure the dev server is running
npm run dev

# In another terminal, create admin account
npm exec tsx scripts/create-admin.ts
```

#### Option B: Manual via Signup

1. **Go to signup page:** http://localhost:5000/signup
2. **Create account with email:** `admin@karematch.com`
3. **Use any password** (you'll remember)
4. **After signup,** you need to manually add admin role to database

---

### Step 2: Login as Admin

1. **Navigate to:** http://localhost:5000/login
2. **Enter credentials:**
   - **Email:** `admin@karematch.com`
   - **Password:** `admin123` (default from script) or your password

3. **Click "Login"**

---

### Step 3: Access Admin Dashboard

1. **After login, navigate to:** http://localhost:5000/admin

   Or click "Admin Dashboard" link (if available in navigation)

2. **You should see the admin dashboard with tabs:**
   - Pending Approval
   - All Therapists
   - **Analytics** ← Click this!

---

### Step 4: View Analytics

Once in the Analytics tab, you'll see:

📊 **Summary Cards:**
- Total Visitors (unique sessions)
- Total Searches
- Geographic Reach (cities & states)
- Average Search Radius

🌎 **Top Cities by Visitors**
- Shows which cities have most traffic

📍 **Location Method Usage**
- IP Geolocation vs GPS vs Manual entry
- Success rates for each method

⚠️ **Underserved Markets**
- Cities with high demand but few therapists
- **Action item:** Recruit therapists in these areas!

💻 **Device & Browser Stats**
- Desktop vs Mobile vs Tablet breakdown
- Top browsers (Chrome, Safari, Firefox, etc.)

🔗 **Traffic Sources**
- Where visitors come from (Google, Facebook, direct, etc.)

---

## Troubleshooting

### "Cannot GET /admin" or 404 Error

**Cause:** Not logged in or not an admin

**Fix:**
1. Make sure you're logged in at `/login` first
2. Check that your account has admin role

### "Unauthorized" Error

**Cause:** Your account is not marked as admin in database

**Fix:** Run the admin creation script:
```bash
npm exec tsx scripts/create-admin.ts
```

### No Data in Analytics Dashboard

**Cause:** No analytics data has been collected yet

**Fix:**
```bash
# Seed test data (30 days of realistic data)
npm run db:seed:analytics
```

This will create:
- 3,000+ page views
- 1,500+ location searches
- 15 different cities
- 30 days of historical data

### Server Not Running

**Fix:**
```bash
# Start the development server
npm run dev
```

Server will run on: http://localhost:5000

---

## Default Admin Credentials

If you used the `create-admin.ts` script:

- **Email:** `admin@karematch.com`
- **Password:** `admin123`

⚠️ **IMPORTANT:** Change this password in production!

---

## Full Access Flow

```
1. Open Terminal
   ↓
2. Run: npm run dev
   ↓
3. Open Browser: http://localhost:5000/login
   ↓
4. Enter: admin@karematch.com / admin123
   ↓
5. Navigate to: http://localhost:5000/admin
   ↓
6. Click "Analytics" tab
   ↓
7. View insights! 🎉
```

---

## What You Can Do in Analytics Dashboard

### Date Range Selection
- Last 7 days
- Last 30 days
- Last 90 days

### Insights Available

1. **Traffic Analysis**
   - Total visitors and page views
   - New vs returning visitors
   - Traffic sources (where visitors come from)

2. **Geographic Intelligence**
   - Top cities by visitor count
   - State-level distribution
   - Underserved markets (high demand, low supply)

3. **Search Behavior**
   - Total searches performed
   - Average results found
   - Search radius patterns
   - Filter usage (specialties, insurance, etc.)

4. **Location Method Adoption**
   - How many users use IP geolocation
   - How many grant GPS permission
   - How many enter location manually
   - Success rate for each method

5. **Device & Browser**
   - Desktop vs Mobile vs Tablet
   - Browser breakdown
   - Device-specific behavior patterns

6. **Business Intelligence**
   - Cities needing more therapists
   - Search success rates
   - User engagement metrics

---

## API Access (For Developers)

All analytics data is also available via API:

```bash
# Summary stats
curl -H "Cookie: connect.sid=YOUR_SESSION" \
  "http://localhost:5000/api/admin/analytics/summary?startDate=2025-01-01&endDate=2025-10-20"

# Top cities
curl -H "Cookie: connect.sid=YOUR_SESSION" \
  "http://localhost:5000/api/admin/analytics/top-cities?limit=10"

# Underserved markets
curl -H "Cookie: connect.sid=YOUR_SESSION" \
  "http://localhost:5000/api/admin/analytics/underserved-markets"
```

**Available Endpoints:**
- `/api/admin/analytics/summary` - Dashboard overview
- `/api/admin/analytics/top-cities` - Popular cities
- `/api/admin/analytics/location-methods` - IP/GPS/Manual stats
- `/api/admin/analytics/underserved-markets` - High demand cities
- `/api/admin/analytics/visitor-trends` - Time series data
- `/api/admin/analytics/search-trends` - Search patterns
- `/api/admin/analytics/devices` - Device breakdown
- `/api/admin/analytics/traffic-sources` - Referrers
- `/api/admin/analytics/geography` - Geographic distribution
- `/api/admin/analytics/filter-usage` - Filter statistics

---

## Seeding Test Data

To populate the analytics dashboard with realistic test data:

```bash
npm run db:seed:analytics
```

This creates:
- **Page Views:** 50-200 per day for 30 days
- **Searches:** 20-80 per day for 30 days
- **Cities:** 15 major US cities
- **Devices:** Desktop, mobile, tablet mix
- **Browsers:** Chrome, Safari, Firefox, Edge
- **Referrers:** Google, Facebook, Twitter, direct traffic

---

## Production Considerations

### Security
- ✅ Change default admin password
- ✅ Use strong passwords (12+ characters)
- ✅ Enable HTTPS in production
- ✅ Set secure cookie flags

### Privacy
- ✅ Data is anonymized (no PII)
- ✅ City-level location only
- ✅ No IP addresses stored
- ✅ Auto-purge after 90 days

### Monitoring
- Check analytics dashboard weekly
- Monitor underserved markets
- Track location method adoption
- Adjust therapist recruitment based on data

---

## Quick Commands Reference

```bash
# Create admin account
npm exec tsx scripts/create-admin.ts

# Start server
npm run dev

# Seed analytics data
npm run db:seed:analytics

# Run database migrations
npm run db:push
```

---

## Need Help?

1. **Check documentation:**
   - [ANALYTICS_COMPLETE.md](../geolocation/ANALYTICS_COMPLETE.md)
   - [ANALYTICS_SCHEMA_DESIGN.md](../geolocation/ANALYTICS_SCHEMA_DESIGN.md)

2. **Check logs:**
   - Look at console output when running `npm run dev`
   - Check for errors in browser console (F12)

3. **Verify database:**
   - Make sure migrations ran: `npm run db:push`
   - Check if analytics tables exist

---

**Last Updated:** October 20, 2025
