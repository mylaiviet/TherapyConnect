# Render Deployment Guide - KareMatch/TherapyConnect

**Last Updated:** 2025-10-20
**Deployment Target:** Render.com with Neon PostgreSQL
**Purpose:** Deploy analytics platform update to Render sandbox environment

---

## 🚨 CRITICAL: Pre-Deployment Database Migration Required

**⚠️ WARNING:** You MUST run database migrations on Neon BEFORE pushing code to main branch, or the application will crash with "relation does not exist" errors.

---

## Pre-Deployment Checklist

### ✅ Step 1: Run Neon Database Migration (REQUIRED FIRST)

**Time Required:** 5 minutes
**Risk Level:** Low (uses `IF NOT EXISTS`)

#### 1.1 Access Neon Console
1. Go to [https://console.neon.tech](https://console.neon.tech)
2. Log in with your credentials
3. Select your **KareMatch/TherapyConnect** database project
4. Click **"SQL Editor"** in the left sidebar

#### 1.2 Execute Migration SQL
1. Open the migration file: `scripts/deployment/neon-migration.sql`
2. **Select All** (Ctrl+A / Cmd+A) and **Copy** the entire contents
3. **Paste** into the Neon SQL Editor
4. Click the **"Run"** button (or press Ctrl+Enter / Cmd+Enter)
5. Wait for execution (should complete in 2-5 seconds)
6. Verify you see **"Query completed successfully"** message

#### 1.3 Verify Migration Success
Run this verification query in Neon SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'page_views',
  'location_searches',
  'therapist_profile_views',
  'booking_analytics',
  'therapist_growth_metrics',
  'appointments',
  'chat_conversations'
)
ORDER BY table_name;
```

**Expected Result:** 7 rows returned showing all 7 table names

**If you get fewer than 7 rows:** Re-run the migration SQL (safe to run multiple times)

---

### ✅ Step 2: Verify Environment Variables in Render

**Required Environment Variables:**
- ✅ `DATABASE_URL` - Neon PostgreSQL connection string
- ✅ `SESSION_SECRET` - Session encryption key (auto-generated or manual)
- ✅ `NODE_ENV=production` - Already set in render.yaml
- ⚠️ `ENCRYPTION_KEY` - For chatbot PHI encryption (32-byte base64 string)
- ⚠️ `ESCALATION_EMAIL` - For chatbot crisis escalation (optional)

#### How to Check:
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your **karematch** web service
3. Click **"Environment"** tab
4. Verify `DATABASE_URL` points to your Neon database
5. Add `ENCRYPTION_KEY` if missing (see generation command below)

#### Generate ENCRYPTION_KEY (if needed):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Copy the output and add as environment variable in Render.

---

### ✅ Step 3: Code Deployment

Once database migration is complete and verified:

```bash
# Switch to main branch
git checkout main

# Merge aws-migration branch
git merge aws-migration -m "feat: Analytics platform update - Admin dashboards, IP tracking, React Query caching

This merge brings the complete analytics platform from aws-migration to main for Render deployment.

Major Features:
- 3 Admin Analytics Dashboards (Website Traffic, Therapist Analytics, Business Intelligence)
- IP Geolocation tracking for anonymous visitor analytics
- Fixed analytics dashboard empty data issue (React Query cache)
- React Query caching with manual Refresh Data buttons
- 20+ new database tables for analytics tracking
- 17 new API endpoints for analytics data
- Comprehensive seed scripts for testing

Ready for Render deployment with Neon database.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to origin
git push origin main
```

---

### ✅ Step 4: Monitor Render Deployment

1. **Watch Build Logs:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Select **karematch** service
   - Click on latest deployment
   - Watch build logs for errors

2. **Expected Build Time:** 5-8 minutes

3. **Deployment will:**
   - Run `npm install`
   - Run `npm run db:push` (validates schema, no-op if tables exist)
   - Run `npm run build` (Vite + esbuild)
   - Run `npm start` (production server)

4. **Check for Success:**
   - Status shows **"Live"** with green checkmark
   - No error messages in logs
   - Health check passing

---

### ✅ Step 5: Post-Deployment - Seed Analytics Data

**Purpose:** Populate analytics dashboards with test data so you can demo to others

#### Option A: Using Render Shell (Recommended)
1. Go to Render Dashboard → your service
2. Click **"Shell"** tab
3. Run command:
   ```bash
   npm run db:seed:analytics
   ```
4. Wait for completion (creates 2000 test therapists + analytics)

#### Option B: Using Render Console
1. Click **"Console"** tab instead of Shell
2. Run same command: `npm run db:seed:analytics`

#### What This Creates:
- ✅ 2000 test therapists across 60 US cities
- ✅ 2,350 therapist profile view records
- ✅ 5,114 booking analytics records
- ✅ 8 growth metrics records
- ✅ Realistic geographic distribution (Chicago, Atlanta, New York, etc.)

**Time Required:** 2-3 minutes

---

### ✅ Step 6: Test the Deployment

#### 6.1 Access Your Deployed Site
URL: `https://karematch.onrender.com` (or your custom domain)

#### 6.2 Test Admin Login
1. Navigate to: `https://karematch.onrender.com/admin`
2. **Username:** `admin` (or your configured admin username)
3. **Password:** [your configured admin password]

**Note:** If no admin user exists, create one using Render Shell:
```bash
npm run create-admin
```

#### 6.3 Verify Analytics Dashboards
Navigate to each tab and verify data appears:

**Website Traffic Dashboard:**
- Total Page Views should show a number
- Unique Sessions displayed
- Top Cities table populated
- Traffic Sources chart showing data

**Therapist Analytics Dashboard:**
- **Total Therapists: 2000** ✅
- **Active Therapists** count shown
- Geographic distribution table with 60 cities
- Click **"Refresh Data"** button to test cache refresh

**Business Intelligence Dashboard:**
- Supply/Demand metrics
- Search performance data
- Device usage stats

#### 6.4 Test Refresh Data Buttons
1. Click **"Refresh Data"** button on any dashboard
2. Should see spinning icon for ~1 second
3. Data should reload
4. Verify Network tab shows new API requests

---

## Troubleshooting

### Problem: "relation 'page_views' does not exist"

**Cause:** Database migration wasn't run before code deployment
**Solution:**
1. Run the Neon migration SQL immediately (Step 1)
2. Redeploy from Render dashboard (triggers new build)

---

### Problem: Dashboards Show "Total Therapists: 0"

**Cause:** Analytics data not seeded
**Solution:**
1. Run seed script via Render Shell: `npm run db:seed:analytics`
2. Click "Refresh Data" button in browser
3. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

---

### Problem: Build Fails with "npm run db:push" Error

**Cause:** `DATABASE_URL` environment variable not set or incorrect
**Solution:**
1. Check Render Environment tab
2. Verify `DATABASE_URL` points to correct Neon database
3. Test connection from local machine:
   ```bash
   psql "postgresql://[your-neon-url]" -c "SELECT version();"
   ```

---

### Problem: Admin Login Fails

**Cause:** No admin user created in production database
**Solution:**
1. SSH into Render Shell
2. Run: `npm run create-admin`
3. Follow prompts to create admin user

**Alternative:** Manually insert admin user in Neon SQL Editor:
```sql
INSERT INTO users (id, email, username, password, role, created_at)
VALUES (
  gen_random_uuid()::varchar,
  'admin@karematch.com',
  'admin',
  '[bcrypt-hashed-password]',
  'admin',
  NOW()
);
```

---

## What Was Deployed

### New Features
- ✅ Complete Admin Analytics Platform
  - Website Traffic Analytics (page views, sessions, geography)
  - Therapist Analytics (distribution, engagement, growth)
  - Business Intelligence (supply/demand, conversion funnel)
- ✅ IP Geolocation Tracking (MaxMind GeoLite2)
- ✅ React Query Caching (5-minute staleTime with manual refresh)
- ✅ 17 New Admin API Endpoints
- ✅ Fixed Analytics Dashboard Empty Data Issue

### Database Changes
- ✅ 20+ New Tables Created
  - `page_views` - Anonymous visitor tracking
  - `location_searches` - Search analytics
  - `therapist_profile_views` - Profile engagement
  - `booking_analytics` - Booking performance
  - `therapist_growth_metrics` - Signup/approval trends
  - `appointments` - Booking system
  - `chat_conversations` - Chatbot tracking
  - ... and 13 more tables

### Technical Improvements
- ✅ Organized documentation into `docs/` structure
- ✅ Comprehensive diagnostic scripts
- ✅ Improved caching strategy
- ✅ Manual "Refresh Data" buttons on all dashboards

---

## Rollback Plan

If deployment fails and you need to rollback:

### Option 1: Revert Git Commit
```bash
git checkout main
git revert HEAD
git push origin main
```
Render will automatically redeploy the previous version.

### Option 2: Rollback in Render Dashboard
1. Go to Render Dashboard → your service
2. Click **"Events"** tab
3. Find previous successful deployment
4. Click **"Rollback to this version"**

### Option 3: Manual Rollback
```bash
git checkout main
git reset --hard [previous-commit-hash]
git push origin main --force
```

**Note:** Database migrations are additive and use `IF NOT EXISTS`, so they don't need to be rolled back.

---

## Support & Resources

**Documentation:**
- [Analytics Dashboard Fix Session Summary](docs/issues/analytics-dashboard-empty-data-fix.md)
- [Database Schema Documentation](docs/architecture/DATABASE_SCHEMA.md)
- [Render Deployment Documentation](https://render.com/docs)
- [Neon Documentation](https://neon.tech/docs/introduction)

**Diagnostic Scripts:**
- `scripts/test-api-functions.ts` - Test analytics services directly
- `scripts/verify-analytics-data.js` - Verify seeded data
- `scripts/check-analytics-endpoints.js` - Test API endpoints

**Need Help?**
- Check server logs in Render Dashboard
- Review browser console for errors (F12)
- Check Network tab for failed API requests

---

## Post-Deployment Tasks

After successful deployment:

1. ✅ Test all three analytics dashboard tabs
2. ✅ Verify admin login works
3. ✅ Share deployment URL with testers
4. ✅ Document any issues found
5. ✅ Collect feedback from users
6. ✅ Monitor Render logs for errors
7. ✅ Check Neon database usage metrics

---

## Future Deployments

For future deployments to Render:

1. **Always check for new migrations** in `migrations/` folder
2. **Run new migrations on Neon first** before pushing code
3. **Update render.yaml** if environment variables change
4. **Test locally first** with `npm run dev`
5. **Use feature branches** and merge to main when ready

**Automated Migration:** The `render.yaml` now includes `npm run db:push` in the build command, so future schema changes will be applied automatically during deployment (but manual migration first is still safer).

---

**Deployment prepared by:** Claude Code
**Date:** 2025-10-20
**Version:** v2.0.0-analytics-platform
