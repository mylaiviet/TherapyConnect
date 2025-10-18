# TherapyConnect Deployment Guide

## 🚀 Deploy to GitHub and Vercel

Your project is ready to deploy! Follow these steps:

---

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Name your repository: `TherapyConnect` (or any name you prefer)
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

---

## Step 2: Connect Your Local Project to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
git remote add origin https://github.com/YOUR-USERNAME/TherapyConnect.git
git branch -M main
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

**Example:**
```bash
git remote add origin https://github.com/johnsmith/TherapyConnect.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your `TherapyConnect` repository
4. Configure your project:
   - **Framework Preset:** Other
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. **Add Environment Variables** (CRITICAL):
   Click **"Environment Variables"** and add these:

   ```
   DATABASE_URL=postgresql://postgres.vgojgfkktnbbrutexlyw:Redservice2022!@aws-1-us-east-1.pooler.supabase.com:6543/postgres

   SUPABASE_URL=https://vgojgfkktnbbrutexlyw.supabase.co

   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnb2pnZmtrdG5iYnJ1dGV4bHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MjIyMTEsImV4cCI6MjA3NjI5ODIxMX0.rFQcECGm0O84urDR0jzJYHgDg9PzTdslhWWct2OpizY

   SESSION_SECRET=OqA1lm6nWy8hqZjkI9Jtm/lmFeMRto3FtCes/JmNwPo=

   NODE_ENV=production

   PORT=5000
   ```

6. Click **"Deploy"**

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts and set environment variables when asked
```

---

## Step 4: Set Up Database (First Deployment)

After your first deployment, you need to seed the database:

1. In Vercel Dashboard → Your Project → **Settings** → **Functions**
2. Or use Vercel CLI:
   ```bash
   vercel env pull
   npm run db:seed
   ```

3. This will create 100 test therapist accounts

---

## 🔑 Important Notes

### Environment Variables
Make sure ALL environment variables are set in Vercel:
- `DATABASE_URL` - Your Supabase database connection
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SESSION_SECRET` - For session encryption
- `NODE_ENV` - Set to `production`
- `PORT` - Set to `5000`

### Supabase Configuration
Your Supabase database is already set up with:
- ✅ Database schema deployed
- ✅ 100 test therapist accounts
- ✅ All tables created (users, therapists, admin_users)

### Test Accounts
All 100 therapist accounts use password: **Test123!**

Sample accounts:
- sarah.smith@therapy.test
- michael.johnson@therapy.test
- lisa.gonzalez@therapy.test

---

## 📋 Quick Commands Reference

```bash
# Check git status
git status

# Add remote (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/TherapyConnect.git

# Push to GitHub
git push -u origin main

# View remotes
git remote -v

# Deploy to Vercel
vercel
```

---

## 🆘 Troubleshooting

### "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR-USERNAME/TherapyConnect.git
```

### Build fails on Vercel
Check that all environment variables are set correctly in Vercel Dashboard

### Database connection errors
Verify `DATABASE_URL` is correct in Vercel environment variables

### Session errors
Ensure `SESSION_SECRET` is set in Vercel environment variables

---

## ✅ After Deployment

1. Visit your Vercel deployment URL
2. Test login with: `sarah.smith@therapy.test` / `Test123!`
3. Explore therapist profiles
4. Test password reset functionality
5. Test search and filtering

---

## 🎉 You're Done!

Your TherapyConnect application is now live and ready to use!

**What's Included:**
- ✅ User authentication
- ✅ Password reset
- ✅ 100 diverse therapist profiles
- ✅ Advanced search & filtering
- ✅ Admin dashboard
- ✅ Responsive design
- ✅ Supabase database
- ✅ Session management

Enjoy your deployment! 🚀
