# Test Credentials for KareMatch

This document contains login credentials for testing the KareMatch platform in development and production environments.

## 🔑 Test Accounts

After running the production seed script (`npm run db:seed:production`), the following test accounts will be available:

### Therapist Account
- **Email**: `therapist@test.com`
- **Password**: `password123`
- **Role**: Therapist
- **Profile**: Complete therapist profile with all fields populated
- **Status**: Approved and active

**Use this account to**:
- Test therapist dashboard functionality
- Upload credentialing documents
- Manage availability and appointments
- View therapist-specific features

---

### Admin Account
- **Email**: `admin@test.com`
- **Password**: `admin123`
- **Role**: Admin
- **Access**: Full administrative privileges

**Use this account to**:
- Access admin dashboard
- Manage therapist approvals
- View analytics and reports
- Access credentialing management
- Moderate content

---

### Sample Therapist Accounts

The production seed also creates 50 therapist accounts with the naming pattern:
- **Email**: `firstname.lastname@therapist.com`
- **Password**: `password123` (all accounts)
- **Examples**:
  - `sarah.smith@therapist.com`
  - `michael.johnson@therapist.com`
  - `jessica.williams@therapist.com`

All sample accounts are **approved and active** for testing search and filtering functionality.

---

## 📍 Environment-Specific Usage

### Local Development
```bash
# Start local server
npm run dev

# Login at: http://localhost:5000/login
```

### Production (Render)
```bash
# After deployment, seed the database:
# 1. Go to Render Dashboard
# 2. Open Shell for your service
# 3. Run: npm run db:seed:production

# Login at: https://therapyconnect-i6c4.onrender.com/login
```

---

## 🚀 Seeding Instructions

### First-Time Setup (Production)

After deploying to Render for the first time:

1. **Wait for deployment to complete** (~5-10 minutes)

2. **Open Render Shell**:
   - Go to Render Dashboard
   - Select your `karematch` service
   - Click "Shell" tab
   - Wait for shell to connect

3. **Run production seed**:
   ```bash
   npm run db:seed:production
   ```

4. **Expected output**:
   ```
   🌱 Starting PRODUCTION database seeding...

   👤 Creating test accounts...
      ✅ Test therapist created: therapist@test.com / password123
      ✅ Test admin created: admin@test.com / admin123

   👥 Creating 50 sample therapist profiles...
      ✓ Created 10/50 therapists...
      ✓ Created 20/50 therapists...
      ✓ Created 30/50 therapists...
      ✓ Created 40/50 therapists...
      ✓ Created 50/50 therapists...

   ✅ Successfully seeded production database!
      👤 2 test accounts (therapist + admin)
      👥 50 sample therapist profiles
      📸 All profiles have professional avatars

   🔑 Test Credentials:
      Therapist: therapist@test.com / password123
      Admin: admin@test.com / admin123
      Sample: sarah.smith@therapist.com / password123

   🎉 Production seeding complete!
   ```

5. **Verify**:
   - Visit your production site
   - Login with `therapist@test.com` / `password123`
   - Search for therapists (should show 50 results)

---

## 🔄 Re-seeding Database

If you need to reset and re-seed the database:

### Option 1: Via Render Shell (Recommended)
```bash
# Connect to Render Shell
npm run db:push  # Reset schema
npm run db:seed:production  # Seed data
```

### Option 2: Via Local CLI with Remote Database
```bash
# Make sure DATABASE_URL points to production database
npm run db:push
npm run db:seed:production
```

⚠️ **Warning**: This will delete all existing data!

---

## 📊 Data Included in Production Seed

### Test Accounts (2)
- 1 Therapist account (`therapist@test.com`)
- 1 Admin account (`admin@test.com`)

### Sample Therapists (50)
- Distributed across 10 major cities (Austin, Houston, Dallas, NYC, LA, Chicago, Seattle, Miami, Boston, San Antonio)
- ~40% virtual providers
- Complete profiles with:
  - Professional credentials
  - Specialties and modalities
  - Insurance and payment info
  - Availability and contact details
  - Professional avatars
  - All approved and searchable

### Total Database Size
- **52 users** (2 test + 50 sample)
- **52 therapist profiles**
- All with `profileStatus: "approved"`

---

## 🔒 Security Notes

### Development
- Default passwords are simple for easy testing
- All credentials documented here
- Database can be reset anytime

### Production
- **Change these credentials** after initial setup
- Use strong, unique passwords
- Enable two-factor authentication when available
- Rotate credentials regularly
- **Do not commit** `.env` files with production credentials

---

## 🐛 Troubleshooting

### "Invalid email or password" Error
**Problem**: Login fails even with correct credentials
**Solution**:
1. Verify database was seeded: Check Render logs for seed output
2. Re-run seed script: `npm run db:seed:production`
3. Check for typos in email/password (case-sensitive)

### "No therapists found" in Search
**Problem**: Therapist search returns empty results
**Solution**:
1. Confirm seeding completed successfully
2. Check database has 50+ therapists: Use Render Shell to query database
3. Re-seed: `npm run db:seed:production`

### "Database already contains data" Warning
**Problem**: Seed script skips seeding
**Solution**:
- This is expected if database already has data
- To re-seed, first run: `npm run db:push` (⚠️ deletes all data)
- Then run: `npm run db:seed:production`

---

## 📝 Development vs Production Seeding

| Feature | Development (`db:seed:full`) | Production (`db:seed:production`) |
|---------|------------------------------|-----------------------------------|
| **Therapists** | 2000 | 50 |
| **Test Accounts** | Random emails | Known emails |
| **Execution Time** | ~5-10 minutes | ~30 seconds |
| **Use Case** | Local testing, load testing | Production deployment |
| **Build Command** | ❌ Too slow | ✅ Fast enough |

---

## ✅ Quick Reference

```bash
# Seed production database (after deployment)
npm run db:seed:production

# Login credentials
Email: therapist@test.com
Password: password123

Email: admin@test.com
Password: admin123

# Test therapist search
Visit: /therapists
Should show: 50 therapists

# Test blog
Visit: /blog
Should show: 7 articles
```

---

*For additional help, see `BLOG_FIX_FINAL.md` or `RENDER_DEPLOYMENT_GUIDE.md`*
