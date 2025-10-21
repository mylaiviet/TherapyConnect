# Analytics Implementation - README

## Overview

This directory contains the complete implementation for tracking **anonymous visitors** vs **authenticated users** using Matomo analytics.

## What's Included

### Documentation Files

1. **[QUICK-START.md](./QUICK-START.md)** - Start here!
   - 30-minute setup guide
   - Step-by-step instructions
   - Testing procedures
   - Checklist format

2. **[MATOMO-IMPLEMENTATION-GUIDE.md](./MATOMO-IMPLEMENTATION-GUIDE.md)** - Complete reference
   - Detailed architecture explanation
   - HIPAA compliance details
   - Advanced features
   - Troubleshooting guide

3. **[IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md)** - Quick reference
   - Files created/modified
   - How it works
   - Usage examples
   - Next steps

4. **[README.md](./README.md)** - This file
   - Documentation index
   - Installation requirements
   - Quick links

### Implementation Files

**Client-Side:**
- `client/src/services/analytics.ts` - Anonymous visitor tracking
- `client/src/main.tsx` - Tracking initialization
- `client/src/pages/login.tsx` - User identification on login
- `client/src/pages/signup.tsx` - User identification on signup

**Server-Side:**
- `server/services/matomoAnalytics.ts` - Authenticated user tracking via API
- `server/middleware/analyticsMiddleware.ts` - Automatic tracking helpers
- `server/routes.ts` - Login/logout/registration tracking

**Configuration:**
- `.env.example` - Environment variables template

---

## Installation Requirements

### 1. Install Dependencies

The server-side Matomo integration requires `axios`:

```bash
npm install axios
```

### 2. Install Matomo Server

You need a self-hosted Matomo instance. Choose one:

**Option A: Traditional Server Install**
- Requirements: PHP 7.4+, MySQL 5.7+, Apache/Nginx
- Guide: https://matomo.org/docs/installation/
- Time: ~15 minutes

**Option B: Docker Install (Recommended)**
```bash
# Use the docker-compose.yml in QUICK-START.md
docker-compose up -d
```
- Time: ~5 minutes

### 3. Configure Environment Variables

Copy values from `.env.example`:

```bash
# Anonymous visitor tracking (client-side)
VITE_MATOMO_URL=https://analytics.yourdomain.com
VITE_MATOMO_SITE_ID=1

# Authenticated user tracking (server-side)
MATOMO_URL=https://analytics.yourdomain.com
MATOMO_SITE_ID=2
MATOMO_AUTH_TOKEN=your_token_here
```

### 4. Restart Your Application

```bash
npm run dev
```

---

## Quick Start

### If You're Just Getting Started:

👉 **Start with: [QUICK-START.md](./QUICK-START.md)**

This guide will walk you through:
1. Installing Matomo (15 min)
2. Configuring Matomo (5 min)
3. Setting environment variables (2 min)
4. Testing it works (5 min)
5. Viewing your analytics (3 min)

**Total time: ~30 minutes**

### If You Want to Understand the Details:

👉 **Read: [MATOMO-IMPLEMENTATION-GUIDE.md](./MATOMO-IMPLEMENTATION-GUIDE.md)**

This comprehensive guide covers:
- Architecture overview
- Two-tiered tracking system
- HIPAA compliance
- Advanced features
- Troubleshooting

**Total reading time: ~20 minutes**

### If You Just Need a Quick Reference:

👉 **See: [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md)**

Quick answers to:
- What files were created?
- How does it work?
- What do I need to configure?
- How do I use it?

**Total reading time: ~5 minutes**

---

## How It Works

### The Two-Tiered System

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANONYMOUS VISITORS                            │
│                                                                   │
│  User browses site → Matomo JS loads → Cookie-based tracking    │
│  Site ID: 1                                                      │
│                                                                   │
│  Tracked:                                                        │
│  ✓ Page views                                                    │
│  ✓ Session duration                                              │
│  ✓ Navigation flow                                               │
│  ✓ Referrer source                                               │
│  ✓ Device/browser info                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    User logs in / signs up
                              ↓
                      setUserId(userId)
                              ↓
        Matomo links previous anonymous session to user ID
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   AUTHENTICATED USERS                            │
│                                                                   │
│  Server-side tracking → Matomo HTTP API → User ID linked        │
│  Site ID: 2                                                      │
│                                                                   │
│  Tracked:                                                        │
│  ✓ All anonymous data above, PLUS:                              │
│  ✓ Login/logout events                                           │
│  ✓ Registration events                                           │
│  ✓ Profile completion                                            │
│  ✓ Search activity                                               │
│  ✓ Feature usage                                                 │
│  ✓ Custom events (appointments, messages, etc.)                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Metrics You Can Track

**Anonymous Visitors (Site 1):**
- **Unique Visitors**: How many people visited your site
- **Conversion Rate**: What % signed up
- **Top Landing Pages**: Where they entered
- **Traffic Sources**: How they found you

**Authenticated Users (Site 2):**
- **Unique Users**: Total registered users
- **Active Users**: Who logged in recently
- **Feature Usage**: What features they use
- **Engagement**: How often they return

**Combined Insights:**
```
Visitor-to-User Conversion = (New Users / Unique Visitors) × 100
User Activation Rate = (Active Users / Total Users) × 100
```

---

## Usage Examples

### Track Page Views (Automatic)

Page views are tracked automatically:
- Anonymous visitors: Client-side JavaScript
- Authenticated users: Server-side on authenticated routes

### Track Custom Events

**In React components:**
```typescript
import { trackEvent } from '@/services/analytics';

// Track button click
const handleExport = () => {
  trackEvent('Feature', 'Export', 'PDF');
  // ... rest of your code
};

// Track search
const handleSearch = (results: any[]) => {
  trackEvent('Search', 'Performed', undefined, results.length);
};
```

**In server routes:**
```typescript
import { trackingHelpers } from './middleware/analyticsMiddleware';

// Track appointment booking
app.post('/api/appointments', async (req, res) => {
  // ... create appointment ...

  await trackingHelpers.trackAppointmentBooked(
    req.session.userId,
    req.session.role
  );

  res.json({ success: true });
});
```

### Track User Milestones

The tracking helpers provide pre-built functions:

```typescript
// After user completes profile
await trackingHelpers.trackProfileCompletion(userId, 100);

// After user views matches
await trackingHelpers.trackMatchViewed(userId, matchCount);

// After user sends message
await trackingHelpers.trackMessageSent(userId, 'therapist-chat');
```

---

## HIPAA Compliance

### Built-In Protections

✅ **IP Anonymization**: Last 2 octets removed automatically
✅ **PHI Sanitization**: Emails, phones, SSNs automatically filtered
✅ **Self-Hosted**: Complete control over data
✅ **No Third-Party**: No data sent to external services
✅ **Data Retention**: Configurable auto-deletion

### What's Safe to Track

✅ Anonymous user IDs (UUIDs)
✅ Generic page titles
✅ Feature usage (without personal context)
✅ Aggregated metrics
✅ Device/browser info
✅ City-level location

### What's Not Tracked

❌ Patient names, emails, phone numbers
❌ Symptoms, diagnoses, conditions
❌ Appointment content
❌ Message content
❌ Insurance information
❌ Full IP addresses

---

## Testing

### Quick Test (2 minutes)

1. **Open your app in incognito window**
2. **Browse a few pages**
3. **Check browser console:**
   ```
   [Matomo] Anonymous visitor tracking initialized
   ```
4. **Sign up or log in**
5. **Check console again:**
   ```
   [Matomo] User ID set: abc-123-def-456
   ```

### Verify in Matomo (1 minute)

1. **Open Matomo dashboard**
2. **Go to: Visitors → Real-time → Visitor Log**
3. **You should see your visit!**

For detailed testing procedures, see: [QUICK-START.md § Step 4](./QUICK-START.md#step-4-test-it-works-5-minutes)

---

## Viewing Analytics

### Matomo Dashboard

**Access:** `https://analytics.yourdomain.com`

**Site 1 - Anonymous Visitors:**
- Dashboard → Select "TherapyConnect - Anonymous"
- View: Unique visitors, page views, referrers

**Site 2 - Authenticated Users:**
- Dashboard → Select "TherapyConnect - Authenticated"
- View: User events, feature usage, engagement

### Key Reports

1. **Visitor Overview**
   - Visitors → Overview

2. **Real-time Activity**
   - Visitors → Real-time → Visitor Log

3. **Event Tracking**
   - Behaviour → Events

4. **User Flow**
   - Behaviour → Pages

5. **Conversion Funnel**
   - Goals → Overview (after setting up goals)

---

## Support & Resources

### Documentation

- **Quick Start**: [QUICK-START.md](./QUICK-START.md)
- **Full Guide**: [MATOMO-IMPLEMENTATION-GUIDE.md](./MATOMO-IMPLEMENTATION-GUIDE.md)
- **Summary**: [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md)

### External Resources

- **Matomo Docs**: https://matomo.org/docs/
- **Matomo Forums**: https://forum.matomo.org/
- **HIPAA Guide**: https://matomo.org/blog/2018/04/how-matomo-helps-you-achieve-gdpr-compliance/
- **Installation Guide**: https://matomo.org/docs/installation/

### Troubleshooting

Common issues and solutions:

**No tracking data?**
→ See: [QUICK-START.md § Troubleshooting](./QUICK-START.md#troubleshooting)

**Server tracking not working?**
→ See: [MATOMO-IMPLEMENTATION-GUIDE.md § Troubleshooting](./MATOMO-IMPLEMENTATION-GUIDE.md#troubleshooting)

**HIPAA compliance questions?**
→ See: [MATOMO-IMPLEMENTATION-GUIDE.md § HIPAA Compliance](./MATOMO-IMPLEMENTATION-GUIDE.md#hipaa-compliance)

---

## File Structure

```
docs/analytics/
├── README.md (this file)
├── QUICK-START.md (30-min setup guide)
├── MATOMO-IMPLEMENTATION-GUIDE.md (complete reference)
└── IMPLEMENTATION-SUMMARY.md (quick reference)

client/src/
├── services/
│   └── analytics.ts (client-side tracking)
├── pages/
│   ├── login.tsx (user identification)
│   └── signup.tsx (user identification)
└── main.tsx (tracking initialization)

server/
├── services/
│   └── matomoAnalytics.ts (server-side API)
├── middleware/
│   └── analyticsMiddleware.ts (tracking helpers)
└── routes.ts (login/logout/registration tracking)
```

---

## Next Steps

### 1. Install (If Not Done)

```bash
# Install axios dependency
npm install axios

# Set up Matomo server (see QUICK-START.md)
```

### 2. Configure

```bash
# Add to .env
VITE_MATOMO_URL=https://analytics.yourdomain.com
VITE_MATOMO_SITE_ID=1
MATOMO_URL=https://analytics.yourdomain.com
MATOMO_SITE_ID=2
MATOMO_AUTH_TOKEN=your_token
```

### 3. Test

```bash
# Start app
npm run dev

# Open in incognito
# Browse, sign up, log in
# Check Matomo dashboard
```

### 4. Deploy

```bash
# Deploy with production .env
# Verify tracking works in production
# Set up dashboards and reports
```

### 5. Analyze

- Monitor visitor-to-user conversion rate
- Track feature usage
- Optimize based on data

---

## Summary

✅ **Complete implementation** for tracking anonymous visitors vs authenticated users
✅ **HIPAA compliant** with built-in PHI protection
✅ **Easy to use** with automatic tracking and helper functions
✅ **Well documented** with guides for every level
✅ **Production ready** with error handling and optimization

**You can now:**
- Identify anonymous visitors browsing your site
- Track when visitors convert to users
- Monitor authenticated user behavior
- Analyze conversion funnels and engagement
- Maintain HIPAA compliance

**Get started:** [QUICK-START.md](./QUICK-START.md)

---

**Questions?** Check the troubleshooting sections in the guides or consult Matomo documentation.
