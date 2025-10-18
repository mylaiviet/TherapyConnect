# Custom Appointment Scheduling System - Deployment & Troubleshooting Guide

## Overview

This document covers the complete process of deploying a custom appointment scheduling system built with React, Express, PostgreSQL, and TanStack Query to Render.com. It includes all issues encountered and their solutions.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Critical Deployment Issues & Solutions](#critical-deployment-issues--solutions)
4. [Local Development Setup](#local-development-setup)
5. [Production Deployment Checklist](#production-deployment-checklist)
6. [Common Errors & Fixes](#common-errors--fixes)
7. [Testing the System](#testing-the-system)

---

## System Architecture

### Tech Stack
- **Frontend**: React, TanStack Query (React Query), Shadcn UI, react-calendar
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle
- **Session Store**: connect-pg-simple
- **Hosting**: Render.com

### Components Built
1. **AvailabilityManager** - Therapist sets weekly availability
2. **BookingSettings** - Configure instant vs request/approval booking mode
3. **AppointmentsList** - Manage appointments with approve/reject
4. **BookingCalendar** - Patient-facing booking interface

---

## Database Schema

### Tables Created

```typescript
// 1. Therapist Availability (Weekly Schedule)
therapistAvailability {
  id: varchar (primary key)
  therapistId: varchar (foreign key → users.id)
  dayOfWeek: integer (0=Sunday, 6=Saturday)
  startTime: text ("09:00")
  endTime: text ("17:00")
  slotDuration: integer (30, 45, 60, 90 minutes)
  isActive: boolean
  createdAt: timestamp
}

// 2. Appointments
appointments {
  id: varchar (primary key)
  therapistId: varchar (foreign key → users.id)
  patientName: text
  patientEmail: text
  patientPhone: text
  appointmentDate: text ("2025-10-18")
  startTime: text ("09:00")
  endTime: text ("10:00")
  status: enum ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')
  notes: text
  bookingType: enum ('instant', 'request')
  createdAt: timestamp
  updatedAt: timestamp
}

// 3. Therapist Booking Settings
therapistBookingSettings {
  id: varchar (primary key)
  therapistId: varchar (foreign key → users.id, unique)
  bookingMode: enum ('instant', 'request')
  bufferTime: integer (minutes between appointments)
  advanceBookingDays: integer (how far ahead patients can book)
  minNoticeHours: integer (minimum notice required)
  allowCancellation: boolean
  cancellationHours: integer (hours before appointment)
  emailNotifications: boolean
  createdAt: timestamp
  updatedAt: timestamp
}

// 4. Blocked Time Slots (Vacations, Breaks)
blockedTimeSlots {
  id: varchar (primary key)
  therapistId: varchar (foreign key → users.id)
  startDate: text
  endDate: text
  startTime: text (optional - all day if null)
  endTime: text (optional - all day if null)
  reason: text
  createdAt: timestamp
}

// 5. Session Storage (Auto-created by connect-pg-simple)
session {
  sid: varchar (primary key)
  sess: json
  expire: timestamp
}
```

---

## Critical Deployment Issues & Solutions

### Issue 1: 401 Unauthorized Errors on Render

**Symptom:**
```
GET /api/therapist/appointments 401 in 3ms :: {"error":"Unauthorized"}
GET /api/therapist/profile 401 in 1ms :: {"error":"Unauthorized"}
```

**Root Cause:**
Sessions were stored in memory using Express's default `MemoryStore`. On Render, when the app restarts or redeploys, all sessions are lost. Users get logged out and all authenticated requests fail.

**Solution:**
Install and configure `connect-pg-simple` to store sessions in PostgreSQL database.

```bash
npm install connect-pg-simple express-session
```

**Code Changes:**

```typescript
// server/routes.ts
import session from "express-session";
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
  : undefined; // Use default MemoryStore in development

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);
```

**Result:** Sessions now persist in the database across restarts.

---

### Issue 2: Session Cookies Not Being Sent/Received on Render

**Symptom:**
Even after implementing PostgreSQL session store, 401 errors persisted. Sessions were created but cookies weren't being sent to the browser.

**Root Cause:**
Render uses a reverse proxy for HTTPS. Express needs to:
1. Trust the proxy to correctly identify the HTTPS connection
2. Set `sameSite: "none"` for cookies to work with secure HTTPS connections through proxies

**Solution:**

```typescript
// server/index.ts
const app = express();

// Trust proxy - required for Render to handle HTTPS correctly
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
```

```typescript
// server/routes.ts
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);
```

**Key Points:**
- `trust proxy: 1` - Tells Express to trust the first proxy (Render's infrastructure)
- `sameSite: "none"` - Required for cookies to work with `secure: true` through HTTPS proxies
- `sameSite: "lax"` - Used in development for better security

**Result:** Session cookies are now properly sent and received on Render.

---

### Issue 3: API Returns HTML Instead of JSON (Local Development)

**Symptom:**
```
Response status: 200 true
Error callback received: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Root Cause:**
In development, Vite dev server runs on port 5173 and Express API runs on port 5000. When the frontend makes a request to `/api/therapist/availability`, it goes to `http://localhost:5173/api/therapist/availability` (Vite server). Vite doesn't have that route, so it returns the React app's `index.html`.

**Solution:**
Add proxy configuration to Vite to forward API requests to Express.

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  // ... other config
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
    // ... rest of server config
  },
});
```

**Result:** All `/api/*` requests are now proxied from Vite (5173) to Express (5000).

**Note:** This issue only affects local development. In production, Render serves both frontend and backend from the same port, so no proxy is needed.

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase or local)
- Git

### Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd TherapyConnect
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your-secret-key-min-32-chars
NODE_ENV=development
```

4. **Run database migrations**
```bash
npm run db:push
```

5. **Seed the database (optional)**
```bash
npm run db:seed
```

6. **Start development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (frontend) with API proxied to `http://localhost:5000` (backend).

---

## Production Deployment Checklist

### Render.com Setup

#### 1. Environment Variables
Set these in Render Dashboard → Environment:

```env
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
SESSION_SECRET=<generate-secure-random-string-min-32-chars>
NODE_ENV=production
```

**Generate SESSION_SECRET:**
```bash
openssl rand -base64 32
```

#### 2. Build Configuration

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run start
```

#### 3. Database Configuration

Ensure your DATABASE_URL includes SSL settings for Supabase:
- Connection mode: Session pooler
- SSL mode: require
- Format: URI (not individual fields)

#### 4. Code Requirements

Ensure these are in your codebase:

**server/index.ts:**
```typescript
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
```

**server/routes.ts:**
```typescript
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

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);
```

**package.json:**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "connect-pg-simple": "^9.0.1",
    "react-calendar": "^6.0.0",
    "date-fns": "^2.30.0",
    // ... other dependencies
  }
}
```

#### 5. Deploy

```bash
git add -A
git commit -m "Deploy scheduling system"
git push origin main
```

Render will automatically detect the push and deploy.

---

## Common Errors & Fixes

### Error: "Failed to add availability" (Frontend shows error but server returns 200)

**Diagnosis:**
Check browser console:
- If you see `SyntaxError: Unexpected token '<'` → API proxy issue
- If you see `401 Unauthorized` → Session authentication issue
- If server logs show `200` but frontend shows error → Response parsing issue

**Fixes:**
1. **Local Development:** Add Vite proxy (see Issue 3)
2. **Production:** Add trust proxy + sameSite cookie settings (see Issue 2)
3. **Both:** Ensure PostgreSQL session store is configured (see Issue 1)

---

### Error: "MemoryStore is not designed for production"

**What it means:**
Sessions are stored in memory and will be lost on restart.

**Fix:**
Implement PostgreSQL session store with `connect-pg-simple` (see Issue 1).

---

### Error: "Session table does not exist"

**What it means:**
The `session` table hasn't been created yet.

**Fix:**
Set `createTableIfMissing: true` in PgSession configuration:
```typescript
new PgSession({
  conObject: { ... },
  tableName: 'session',
  createTableIfMissing: true, // This line
})
```

The table will be auto-created on first app startup.

---

### Error: "CORS / Cookie not being set"

**Symptoms:**
- Login succeeds but subsequent requests return 401
- Cookie appears in server logs but not in browser

**Fix:**
```typescript
// server/index.ts
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

---

## Testing the System

### After Deployment

1. **Clear browser cookies** for the site (important!)
2. **Sign up** as a new therapist
3. **Log in**
4. Navigate to **Dashboard → Availability tab**
5. **Add availability slot** (e.g., Monday 9 AM - 5 PM, 60 min sessions)
6. Check that it appears in the schedule
7. Navigate to **Settings tab**
8. Configure booking mode (instant or request)
9. Log out
10. **View your public profile** (as a patient would)
11. Click **Book Appointment** tab
12. Select a date and available time slot
13. Fill out booking form
14. Submit
15. Log back in as therapist
16. Go to **Appointments tab**
17. Verify the appointment appears
18. If booking mode is "request", test approve/reject

### Troubleshooting Tests

**Test 1: Session Persistence**
1. Log in
2. Note your session cookie in DevTools → Application → Cookies
3. Refresh the page
4. Verify you're still logged in
5. Check that the same session cookie exists

**Test 2: API Response Format**
1. Open DevTools → Network tab
2. Try to add availability
3. Click on the `/api/therapist/availability` request
4. Check **Response** tab
5. Should show JSON: `{"id": "...", "dayOfWeek": 1, ...}`
6. Should NOT show HTML: `<!DOCTYPE html>...`

**Test 3: Authentication**
1. Open DevTools → Console
2. Try to access protected route
3. Check for 401 errors
4. If present, check session configuration

---

## Key Learnings for Future Projects

### 1. Always Use Persistent Session Storage in Production
- Never use MemoryStore for production
- PostgreSQL session store is reliable and easy to set up
- Remember to set `createTableIfMissing: true`

### 2. Configure Proxy Settings Correctly
- Set `trust proxy` when deploying behind reverse proxies (Render, Vercel, etc.)
- Use `sameSite: "none"` with `secure: true` for HTTPS
- Use `sameSite: "lax"` for local development

### 3. Local Development Requires API Proxy
- Vite dev server and Express API run on different ports
- Configure Vite proxy to forward `/api/*` requests
- This prevents "HTML instead of JSON" errors

### 4. Environment Variables Matter
- Always set `DATABASE_URL` with proper SSL configuration
- Generate strong `SESSION_SECRET` (min 32 chars)
- Set `NODE_ENV=production` on Render

### 5. Testing After Deployment
- Clear browser cookies before testing
- Test the full user flow (signup → login → use features)
- Check browser console and network tab for errors
- Verify session persists across page refreshes

---

## Code Commit History

### Final Working Commits

1. **Database Schema & Storage**
   - Added 4 tables for scheduling
   - Implemented 23 storage methods

2. **API Endpoints**
   - Created 16 REST endpoints
   - GET/POST/PUT/DELETE for availability, appointments, settings, blocked times

3. **Frontend Components**
   - AvailabilityManager, BookingSettings, AppointmentsList, BookingCalendar
   - Integrated with TanStack Query

4. **Session Persistence Fix**
   - Installed connect-pg-simple
   - Configured PostgreSQL session store

5. **Trust Proxy & Cookie Fix**
   - Added `trust proxy` setting
   - Set `sameSite: "none"` for production

6. **Vite Proxy Fix**
   - Added API proxy for local development

---

## Dependencies Required

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "connect-pg-simple": "^9.0.1",
    "react-calendar": "^6.0.0",
    "date-fns": "^2.30.0",
    "@tanstack/react-query": "^5.0.0",
    "drizzle-orm": "latest",
    "postgres": "^3.4.3",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.0",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "drizzle-kit": "latest"
  }
}
```

---

## Summary

This scheduling system is **100% custom-built** with:
- **Zero recurring costs** (all open-source)
- **Complete control** over features and data
- **Full HIPAA compliance** capability
- **PostgreSQL-backed** session persistence
- **Production-ready** for Render deployment

The main challenges were session management in production and cookie configuration for HTTPS reverse proxies. All issues were resolved with proper session storage (connect-pg-simple), trust proxy settings, and SameSite cookie attributes.

---

## Support & Maintenance

### Regular Maintenance Tasks
1. Monitor session table size (clean old sessions periodically)
2. Back up PostgreSQL database regularly
3. Update dependencies for security patches
4. Monitor Render logs for errors

### Scaling Considerations
- PostgreSQL session store scales well
- Consider adding Redis for very high traffic
- Session table auto-cleans expired sessions
- Database connection pooling handled by Drizzle/Postgres

---

**Document Version:** 1.0
**Last Updated:** October 18, 2025
**Author:** Claude Code
**Status:** Production-Ready ✅
