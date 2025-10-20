# TherapyConnect - Developer Guide

This guide will help you run the application locally, commit changes to GitHub, and troubleshoot common issues.

---

## 🚀 Running the Application Locally

### Prerequisites
- **Node.js** (v20.0.0 or higher)
- **Git** installed
- **Database** connection (Supabase/PostgreSQL)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Development Server
```bash
npm run dev
```

This command starts both:
- **Backend server** on `http://localhost:5000`
- **Frontend client** (Vite dev server automatically proxies to backend)

### Step 3: Access the Application

**Local URLs:**
- **Homepage:** http://localhost:5000
- **Find Therapists:** http://localhost:5000/therapists
- **Match Questionnaire:** http://localhost:5000/match
- **Admin Login:** http://localhost:5000/login

**API Endpoints (for testing):**
- `http://localhost:5000/api/therapists` - List all therapists
- `http://localhost:5000/api/chat/start` - Start chatbot conversation
- `http://localhost:5000/api/location/search?q=Minneapolis` - Search locations

### Step 4: Testing the Application

**Test the Chatbot:**
1. Go to http://localhost:5000
2. Click the blue chatbot button in the bottom-right corner
3. Follow the conversation flow
4. Verify therapist matches appear with correct names and locations

**Test Location Matching:**
1. In the chatbot, enter "Minneapolis" or "55401"
2. Complete the questionnaire
3. Verify you get therapists from Minneapolis

**Test the /match Page:**
1. Go to http://localhost:5000
2. Dismiss the welcome modal or click "Help me match with a therapist"
3. Fill out the full-page questionnaire
4. Click "Find My Therapist"

### Stopping the Server

**Windows:**
```bash
# Find the process running on port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /F /PID <PID>
```

**Or simply:**
- Press `Ctrl + C` in the terminal where `npm run dev` is running

---

## 📝 Committing Changes to GitHub

### Step 1: Check What Changed
```bash
git status
```

This shows all modified, new, and deleted files.

### Step 2: Stage Your Changes

**Stage specific files:**
```bash
git add path/to/file1.ts path/to/file2.tsx
```

**Stage all changes:**
```bash
git add .
```

**Stage specific folders:**
```bash
git add client/src/components/
git add server/services/
```

### Step 3: Commit Your Changes

**Simple commit:**
```bash
git commit -m "Brief description of what you changed"
```

**Detailed commit (recommended):**
```bash
git commit -m "$(cat <<'EOF'
Short summary of changes (50 chars or less)

More detailed explanation:
- What you changed
- Why you changed it
- Any side effects or considerations

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Step 4: Push to GitHub
```bash
git push
```

If this is your first push on a new branch:
```bash
git push -u origin main
```

### Common Git Workflows

**Undo uncommitted changes to a file:**
```bash
git restore path/to/file.ts
```

**Undo the last commit (keep changes):**
```bash
git reset --soft HEAD~1
```

**View commit history:**
```bash
git log --oneline
```

**View changes before committing:**
```bash
git diff
```

---

## 🐛 Troubleshooting Guide

### Issue 1: "Port 5000 already in use"

**Problem:** Another process is using port 5000

**Solution (Windows):**
```bash
# Find process on port 5000
netstat -ano | findstr :5000

# Kill the process (replace <PID> with the number from above)
taskkill /F /PID <PID>

# Restart dev server
npm run dev
```

**Solution (Mac/Linux):**
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9

# Restart dev server
npm run dev
```

---

### Issue 2: "DATABASE_URL environment variable is not set"

**Problem:** Missing .env file or database connection

**Solution:**
1. Check that `.env` file exists in the root directory
2. Verify it contains:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   ```
3. Restart the dev server

---

### Issue 3: Database Schema Errors

**Problem:** "relation does not exist" or "column not found"

**Solution:**
```bash
# Push latest schema to database
npm run db:push
```

If you need to seed ZIP codes:
```bash
npx tsx server/seedZipCodes.ts
```

---

### Issue 4: Changes Not Appearing in Browser

**Problem:** Code changes don't reflect in the browser

**Solutions:**
1. **Hard refresh:** Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. **Clear cache:** Open DevTools → Network tab → Check "Disable cache"
3. **Restart dev server:** Stop (`Ctrl + C`) and run `npm run dev` again
4. **For backend changes:** Backend server auto-reloads with `tsx`, but sometimes you need to manually restart

---

### Issue 5: TypeScript Errors

**Problem:** TypeScript compilation errors

**Solution:**
```bash
# Check for type errors
npm run check

# If issues persist, delete build artifacts
rm -rf dist node_modules/.vite

# Reinstall dependencies
npm install
```

---

### Issue 6: Chatbot Not Loading

**Problem:** Chatbot button appears but clicking shows blank screen

**Solutions:**
1. **Check browser console:** Press `F12` → Console tab
2. **Verify API is running:** Visit http://localhost:5000/api/therapists
3. **Check network requests:** F12 → Network tab → Look for failed requests
4. **Restart server:** Stop and restart `npm run dev`

---

### Issue 7: Location Matching Not Working

**Problem:** Chatbot returns 0 therapists or wrong location

**Solutions:**
1. **Verify ZIP codes are seeded:**
   ```bash
   npx tsx server/seedZipCodes.ts
   ```
2. **Check therapist data has locations:**
   - Visit: http://localhost:5000/api/therapists
   - Verify therapists have `city` and `zipCode` fields

---

## 🆘 Sharing Issues with Claude

When encountering an issue, provide this information:

### 1. Error Message
Copy the **exact error message** from:
- Terminal/console
- Browser DevTools console (F12 → Console)
- Network tab (F12 → Network → Failed requests)

### 2. What You Were Doing
Describe:
- What feature you were testing
- What you clicked/typed
- Expected vs actual behavior

### 3. Environment Info
Run these commands and share the output:
```bash
# Node version
node --version

# Git status
git status

# Check if server is running
netstat -ano | findstr :5000
```

### 4. Relevant Code
If you modified code, share:
- File path (e.g., `client/src/components/MyComponent.tsx`)
- What you changed
- Line numbers if possible

### 5. Screenshots
Take screenshots of:
- Browser error messages
- Terminal output
- Network tab showing failed requests

### Example Issue Report Template:
```
**Issue:** Chatbot showing "Unknown" for therapist names

**Error Message:**
(paste error from console)

**Steps to Reproduce:**
1. Opened http://localhost:5000
2. Clicked chatbot button
3. Completed conversation
4. Saw "Unknown, MA" instead of therapist names

**Environment:**
- Node version: v22.19.0
- Browser: Chrome 120
- Git status: (paste git status output)

**Screenshots:**
(attach screenshot)
```

---

## 🔧 Useful Commands Reference

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # Type-check TypeScript
```

### Database
```bash
npm run db:push      # Push schema changes to database
npm run db:seed      # Seed sample therapist data
npx tsx server/seedZipCodes.ts  # Seed ZIP codes
```

### Git
```bash
git status           # Check changes
git add .            # Stage all changes
git commit -m "msg"  # Commit changes
git push             # Push to GitHub
git log --oneline    # View commit history
```

### Testing APIs
```bash
# Test therapist API
curl http://localhost:5000/api/therapists

# Test chatbot start
curl -X POST http://localhost:5000/api/chat/start -H "Content-Type: application/json"

# Test location search
curl "http://localhost:5000/api/therapists?location=Minneapolis"
```

---

## 📚 Project Structure

```
TherapyConnect/
├── client/               # Frontend React app
│   └── src/
│       ├── components/   # Reusable UI components
│       │   ├── chatbot/  # Chatbot components
│       │   └── layout/   # Header, footer, etc.
│       └── pages/        # Route pages (home, match, therapists)
├── server/               # Backend Express server
│   ├── services/         # Business logic
│   │   ├── stateMachine.ts       # Chatbot conversation flow
│   │   ├── therapistMatcher.ts   # Matching algorithm
│   │   ├── locationSearch.ts     # Fuzzy location search
│   │   └── crisisDetection.ts    # Crisis keyword detection
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Database queries
│   └── seedZipCodes.ts   # ZIP code seeding script
├── shared/
│   └── schema.ts         # Database schema (Drizzle ORM)
└── .env                  # Environment variables (DATABASE_URL)
```

---

## 🎯 Quick Reference: Most Common Tasks

### I want to test the chatbot
1. `npm run dev`
2. Open http://localhost:5000
3. Click blue chatbot button
4. Complete conversation flow

### I want to see what changed
```bash
git status
git diff
```

### I want to commit my changes
```bash
git add .
git commit -m "Description of changes"
git push
```

### I want to restart the server
```bash
# Press Ctrl + C in terminal
npm run dev
```

### I want to update the database schema
```bash
npm run db:push
```

### Server won't start (port in use)
```bash
netstat -ano | findstr :5000
taskkill /F /PID <PID>
npm run dev
```

---

## 📞 Need Help?

If you're stuck:
1. Check the **Troubleshooting** section above
2. Look for error messages in browser console (F12)
3. Share the error with Claude using the issue template
4. Include screenshots and exact error messages

Good luck! 🚀
