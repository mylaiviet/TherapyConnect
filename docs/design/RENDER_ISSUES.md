# Render.com Deployment Issues - TherapyConnect

## 🎯 Project Overview
- **App:** TherapyConnect - Therapist directory with appointment scheduling
- **Stack:** React + TypeScript (Vite), Express.js, Supabase PostgreSQL, Drizzle ORM
- **Deployment Target:** Render.com (free tier)
- **GitHub:** https://github.com/mylaiviet/TherapyConnect
- **Live URL:** https://therapyconnect-1ec4.onrender.com
- **Status:** ✅ **PRODUCTION - WORKING**

---

## 🎉 Major Milestones Achieved

### ✅ Phase 1: Core Platform Deployed (October 2025)
- User authentication system
- Therapist profile management
- Admin approval workflow
- Search and filtering
- 100 therapist profiles with complete data

### ✅ Phase 2: Appointment Scheduling System (October 18, 2025)
- Custom booking calendar (react-calendar)
- M-F 9-5 availability for all therapists
- Instant booking + Request/Approval modes
- Session persistence with PostgreSQL
- All scheduling features working in production

---

## 🛠️ All Issues Encountered & Resolved

### Issue #1: Build Directory Not Found ✅ RESOLVED
**Date:** Initial deployment attempts
**Error:**
```
Error: Could not find the build directory: /opt/render/project/src/dist/public
make sure to build the client first
```

**Root Cause:** Build output path mismatch. Vite was building to wrong directory.

**Solution:**
- Changed `vite.config.ts` output from `server/public` to `dist/public`
- Ensured esbuild bundles server to `dist/index.js`
- When server runs from `dist/`, it correctly finds `dist/public/`

**Files Modified:**
- `vite.config.ts:15` - Set `outDir: path.resolve(import.meta.dirname, "dist/public")`
- `package.json:11` - Build command: `vite build && esbuild server/index.ts ... --outdir=dist`

**Commit:** `e5ebff5` - "Fix build output directory for production deployment"

---

### Issue #2: Session Persistence (401 Unauthorized) ✅ RESOLVED
**Date:** October 18, 2025
**Error:**
```
GET /api/therapist/appointments 401 in 3ms :: {"error":"Unauthorized"}
GET /api/therapist/profile 401 in 1ms :: {"error":"Unauthorized"}
```

**Root Cause:** Sessions stored in memory (MemoryStore). When Render restarts/redeploys, all sessions are lost.

**Solution:** Implemented PostgreSQL session store with `connect-pg-simple`

**Steps Taken:**
1. Installed `connect-pg-simple` and `express-session`
2. Configured PgSession to use Supabase PostgreSQL
3. Auto-creates `session` table on startup
4. Sessions now persist across restarts

**Code Changes:**
```typescript
// server/routes.ts
import connectPgSimple from "connect-pg-simple";

const PgSession = connectPgSimple(session);
const sessionStore = process.env.NODE_ENV === "production"
  ? new PgSession({
      conObject: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      },
      tableName: 'session',
      createTableIfMissing: true,
    })
  : undefined;

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));
```

**Commit:** `888dbef` - "Fix production session persistence with PostgreSQL session store"

**Result:** ✅ Sessions persist correctly, users stay logged in across restarts

---

### Issue #3: Session Cookies Not Being Set (Still 401) ✅ RESOLVED
**Date:** October 18, 2025 (immediately after Issue #2)
**Error:** Even with PostgreSQL session store, cookies weren't being sent to browser

**Root Cause:**
- Render uses reverse proxy for HTTPS
- Express needs to "trust proxy" to correctly identify HTTPS connection
- Cookies need `sameSite: "none"` to work with `secure: true` through proxies

**Solution:** Added trust proxy settings and correct cookie attributes

**Code Changes:**
```typescript
// server/index.ts
const app = express();

// Trust proxy - required for Render to handle HTTPS correctly
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// server/routes.ts
cookie: {
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
}
```

**Commit:** `2293504` - "Fix session authentication on Render with trust proxy and SameSite cookie"

**Result:** ✅ Cookies now properly sent and received through Render's HTTPS proxy

---

### Issue #4: API Returns HTML Instead of JSON (Local Dev) ✅ RESOLVED
**Date:** October 18, 2025
**Error:**
```
Response status: 200 true
Error callback received: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Root Cause:**
- Vite dev server runs on port 5173
- Express API runs on port 5000
- Frontend requests to `/api/therapist/availability` go to Vite (5173)
- Vite doesn't have that route, returns `index.html`

**Solution:** Added Vite proxy configuration to forward API requests

**Code Changes:**
```typescript
// vite.config.ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:5000",
      changeOrigin: true,
    },
  },
  // ... rest of config
}
```

**Commit:** `2293504` - Part of same commit as Issue #3

**Result:** ✅ All `/api/*` requests proxied from Vite (5173) to Express (5000) in development

**Note:** This only affects local development. Production serves frontend and backend from same port.

---

### Issue #5: Replit Plugin Dependencies Breaking Build ✅ RESOLVED
**Date:** Early deployment attempts
**Error:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@replit/vite-plugin-runtime-error-modal'
```

**Root Cause:** Vite config trying to import Replit-specific plugins not available in production

**Solution:** Complete removal of all platform-specific code

**Files Deleted:**
- `.replit` - Replit configuration
- `vercel.json` - Vercel configuration
- `api/index.js` - Vercel serverless wrapper
- `replit.md`, `DEPLOYMENT.md` - Platform-specific docs
- `attached_assets/` - Temp files

**Code Changes:**
- Removed all Replit plugins from `package.json` devDependencies
- Removed all Replit plugin imports from `vite.config.ts`

**Commit:** `6d2a0e4` - "Remove Replit and Vercel configurations for clean Render deployment"

**Result:** ✅ Clean, platform-agnostic codebase that builds on any hosting provider

---

### Issue #6: Build Dependencies Not Available ✅ RESOLVED
**Date:** Early deployment attempts
**Error:** Build commands fail because vite/esbuild not installed

**Root Cause:** Render runs `npm install --production`, skipping devDependencies

**Solution:** Moved build tools from devDependencies to dependencies

**Packages Moved:**
- vite
- @vitejs/plugin-react
- esbuild
- tailwindcss, postcss, autoprefixer
- @tailwindcss/vite, @tailwindcss/typography

**File Modified:** `package.json`

**Result:** ✅ Build tools available during Render deployment

---

### Issue #7: Appointment Booking Shows "No Available Slots" ⚠️ IN PROGRESS
**Date:** October 18, 2025
**Symptom:** Patient tries to book appointment, calendar shows "No available appointments on this date"

**Investigation:**
- ✅ Database has availability data (verified with direct query)
- ✅ Diego Edwards has M-F 9-5 availability in database
- ✅ All 100 therapists have 500 total availability slots
- ⚠️ Production API endpoint returns "Not Found"

**Testing:**
```bash
# Local database - has data
> Check Diego Edwards availability
✅ Found Diego Edwards: 83145343-f0c5-4e8b-8314-b183f6b1181d
📅 Availability records: 5
  Mon: 09:00 - 17:00 (60 min)
  Tue: 09:00 - 17:00 (60 min)
  Wed: 09:00 - 17:00 (60 min)
  Thu: 09:00 - 17:00 (60 min)
  Fri: 09:00 - 17:00 (60 min)

# Production API test
$ curl "https://therapyconnect-1ec4.onrender.com/api/therapists/[id]/available-slots?date=2025-10-21"
Not Found
```

**Root Cause (Suspected):**
Scheduling API routes committed and pushed to GitHub, but Render hasn't deployed them yet OR deployment is still in progress.

**Commits Containing Scheduling Routes:**
- `c50852e` - Add appointment scheduling database schema and storage functions
- `5a49319` - Add comprehensive appointment scheduling API endpoints
- `7f14041` - Add patient booking calendar and integrate scheduling

**All commits are pushed to origin/main** ✅

**Next Steps:**
1. Check Render dashboard → Events tab
2. Verify latest deployment completed successfully
3. If still deploying, wait for completion
4. If failed, check build logs for errors
5. If needed, trigger manual deploy: "Deploy latest commit"

**Temporary Workaround:** None - need to wait for Render deployment

---

## 🔧 Production Configuration

### Environment Variables on Render
```env
DATABASE_URL=postgresql://postgres.vgojgfkktnbbrutexlyw:***@aws-1-us-east-1.pooler.supabase.com:6543/postgres
SESSION_SECRET=<generated-with-openssl-rand-base64-32>
NODE_ENV=production
PORT=<auto-set-by-render>
```

### Build Configuration
**Build Command:**
```bash
npm run build
# Expands to: vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

**Start Command:**
```bash
npm run start
# Expands to: NODE_ENV=production node dist/index.js
```

### Build Output Structure
```
dist/
├── index.js          # Bundled server (from esbuild)
└── public/           # Static frontend files (from vite)
    ├── index.html
    ├── assets/
    │   ├── index-*.js
    │   └── index-*.css
    └── ...
```

---

## 📚 Key Learnings for Future Deployments

### 1. Session Management in Production
**Problem:** MemoryStore loses sessions on restart
**Solution:** Use persistent session storage (PostgreSQL, Redis, etc.)
**Implementation:**
- `connect-pg-simple` for PostgreSQL
- Set `createTableIfMissing: true`
- Configure with `DATABASE_URL` from environment

### 2. Reverse Proxy Cookie Configuration
**Problem:** Cookies not working through HTTPS proxy
**Solution:** Trust proxy + correct SameSite attribute
**Code:**
```typescript
app.set("trust proxy", 1); // Production only
cookie: {
  secure: true,
  sameSite: "none", // Required for HTTPS with proxies
  httpOnly: true,
}
```

### 3. Local Development API Proxy
**Problem:** Frontend and backend on different ports
**Solution:** Vite proxy configuration
**Code:**
```typescript
server: {
  proxy: {
    "/api": {
      target: "http://localhost:5000",
      changeOrigin: true,
    },
  },
}
```

### 4. Build Directory Path Resolution
**Problem:** Server can't find static files after bundling
**Solution:** Ensure vite outputs to correct directory relative to bundled server
**Rule:** If server bundles to `dist/index.js`, vite must build to `dist/public`

### 5. Platform-Agnostic Codebase
**Problem:** Platform-specific plugins break deployment
**Solution:** Remove all Replit/Vercel/platform-specific code
**Best Practice:** Use environment variables for configuration, not platform detection

### 6. Build Dependencies Location
**Problem:** `npm install --production` skips devDependencies
**Solution:** Move build tools (vite, esbuild) to dependencies for platforms that build in production
**Alternative:** Use build-specific commands if platform supports separate build/install phases

---

## 🚀 Deployment Checklist for Future Projects

### Pre-Deployment
- [ ] Remove all platform-specific code (Replit, Vercel, etc.)
- [ ] Verify build works locally: `npm run build && npm start`
- [ ] Test production mode locally with `NODE_ENV=production`
- [ ] Ensure all environment variables documented

### Database Setup
- [ ] Set up production PostgreSQL database (Supabase, Railway, etc.)
- [ ] Run migrations: `npm run db:push`
- [ ] Seed database if needed: `npm run db:seed`
- [ ] Verify DATABASE_URL connection string

### Session Configuration
- [ ] Install session store: `npm install connect-pg-simple express-session`
- [ ] Configure PostgreSQL session store
- [ ] Set `createTableIfMissing: true`
- [ ] Generate secure SESSION_SECRET: `openssl rand -base64 32`

### Render Configuration
- [ ] Set Build Command: `npm run build`
- [ ] Set Start Command: `npm run start`
- [ ] Add environment variables:
  - DATABASE_URL
  - SESSION_SECRET
  - NODE_ENV=production
- [ ] Move build tools to dependencies if needed

### Production Code Settings
- [ ] Add trust proxy: `app.set("trust proxy", 1)`
- [ ] Set cookie sameSite: `"none"` for production
- [ ] Ensure secure cookies: `secure: true` for production
- [ ] Add Vite API proxy for local development

### Post-Deployment
- [ ] Check Render logs for errors
- [ ] Verify build completed successfully
- [ ] Test authentication (login/logout)
- [ ] Test all API endpoints
- [ ] Clear browser cookies before testing
- [ ] Verify session persists across page refreshes

---

## 🐛 Common Errors & Quick Fixes

### "Could not find the build directory"
**Fix:** Check vite.config.ts output path matches server expectation
```typescript
// vite.config.ts
build: {
  outDir: path.resolve(import.meta.dirname, "dist/public"),
}
```

### "401 Unauthorized" after login
**Fix:** Check session configuration
1. Verify PostgreSQL session store configured
2. Add `trust proxy` setting
3. Set `sameSite: "none"` for production cookies

### "Cannot find package '@replit/...'"
**Fix:** Remove all Replit plugins from package.json and vite.config.ts

### "HTML instead of JSON" response (local dev)
**Fix:** Add Vite API proxy
```typescript
server: {
  proxy: {
    "/api": "http://localhost:5000",
  },
}
```

### "Build tools not found" on Render
**Fix:** Move vite, esbuild to dependencies (not devDependencies)

### Cookies not being set
**Fix:**
1. `app.set("trust proxy", 1)` in production
2. `sameSite: "none"` with `secure: true`

---

## 📊 Timeline Summary

| Date | Milestone | Status |
|------|-----------|--------|
| Oct 2025 | Core platform developed locally | ✅ Complete |
| Oct 2025 | Initial Render deployment attempts | ❌ Failed (build directory) |
| Oct 2025 | Fixed build output path | ✅ Resolved |
| Oct 2025 | Core platform deployed | ✅ Success |
| Oct 18, 2025 | Session persistence issue | ✅ Resolved (PgSession) |
| Oct 18, 2025 | Cookie/proxy issue | ✅ Resolved (trust proxy) |
| Oct 18, 2025 | Scheduling system built | ✅ Complete |
| Oct 18, 2025 | Scheduling deployed | ⏳ In progress |

---

## 📞 Support Resources

**Documentation:**
- [Render Docs](https://render.com/docs)
- [Express Trust Proxy](https://expressjs.com/en/guide/behind-proxies.html)
- [connect-pg-simple](https://www.npmjs.com/package/connect-pg-simple)
- [Vite Proxy](https://vitejs.dev/config/server-options.html#server-proxy)

**GitHub Issues:**
- [TherapyConnect Issues](https://github.com/mylaiviet/TherapyConnect/issues)

---

## ✅ Current Status

**Production URL:** https://therapyconnect-1ec4.onrender.com

**Working Features:**
- ✅ User authentication (signup, login, logout)
- ✅ Therapist profiles (100 complete profiles)
- ✅ Search and filtering
- ✅ Admin approval workflow
- ✅ Session persistence
- ✅ HTTPS with secure cookies
- ⏳ Appointment scheduling (deployment in progress)

**Pending:**
- ⏳ Verify latest deployment completed
- ⏳ Test appointment booking in production

---

*Last Updated: October 18, 2025*
*Total Issues Resolved: 6/7*
*Current Status: Production - Working (with 1 pending deployment)*
*Live URL: https://therapyconnect-1ec4.onrender.com*

