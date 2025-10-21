# Matomo Analytics Implementation Summary

## What Was Implemented

A complete two-tiered analytics system to distinguish between **anonymous visitors** and **authenticated users** using Matomo.

---

## Files Created

### Client-Side Files

1. **`client/src/services/analytics.ts`**
   - Client-side Matomo tracking service
   - Handles anonymous visitor tracking
   - Links visitors to users on login/signup
   - PHI sanitization for HIPAA compliance
   - Exports: `initTracking()`, `setUserId()`, `trackPageView()`, `trackEvent()`

### Server-Side Files

2. **`server/services/matomoAnalytics.ts`**
   - Server-side Matomo HTTP API integration
   - Tracks authenticated user actions
   - Generates anonymized visitor IDs from user IDs
   - Includes PHI sanitization
   - Exports: `trackUserPageView()`, `trackUserEvent()`, `trackRegistration()`, etc.

3. **`server/middleware/analyticsMiddleware.ts`**
   - Express middleware for automatic tracking
   - Helper functions for common events
   - Exports: `trackingHelpers` with login, logout, registration, etc.

### Documentation

4. **`docs/analytics/MATOMO-IMPLEMENTATION-GUIDE.md`**
   - Complete implementation guide
   - Setup instructions
   - Testing procedures
   - HIPAA compliance details
   - Troubleshooting guide

5. **`docs/analytics/IMPLEMENTATION-SUMMARY.md`** (this file)
   - Quick reference summary

---

## Files Modified

### Configuration Files

1. **`.env.example`**
   - Added Matomo environment variables:
     ```bash
     VITE_MATOMO_URL=https://analytics.yourdomain.com
     VITE_MATOMO_SITE_ID=1
     MATOMO_URL=https://analytics.yourdomain.com
     MATOMO_SITE_ID=2
     MATOMO_AUTH_TOKEN=your-token-here
     ```

### Application Files

2. **`client/src/main.tsx`**
   - Added `initTracking()` call to initialize anonymous visitor tracking

3. **`client/src/pages/login.tsx`**
   - Added `setUserId()` call on successful login
   - Links anonymous visitor to authenticated user

4. **`client/src/pages/signup.tsx`**
   - Added `setUserId()` call on successful registration
   - Links anonymous visitor to new authenticated user

5. **`server/routes.ts`**
   - Added server-side tracking for login, logout, and registration
   - Imported `trackingHelpers` from analytics middleware
   - Tracks user authentication events

---

## How It Works

### Anonymous Visitor Tracking (Before Login)

```typescript
// Initialized in main.tsx
initTracking(); // Loads Matomo JS, tracks as anonymous visitor

// Automatic tracking of:
// - Page views
// - Session duration
// - Navigation flow
// - Referrer source
```

**Matomo Site ID: 1** - "Anonymous Visitors"

### Authenticated User Tracking (After Login)

```typescript
// On login/signup success
setUserId(userId); // Links anonymous visitor to user account

// Server-side tracking of:
trackingHelpers.trackLogin(userId, userRole);
trackingHelpers.trackRegistration(userId, userRole);
// etc.
```

**Matomo Site ID: 2** - "Authenticated Users"

### Visitor-to-User Linking

1. User browses site anonymously → tracked with cookie-based visitor ID
2. User signs up or logs in → `setUserId(userId)` called
3. Matomo automatically links previous anonymous sessions to this user ID
4. All future tracking includes user ID

---

## Key Features

### HIPAA Compliance

✅ **IP Anonymization**: Last 2 octets removed
✅ **PHI Sanitization**: Automatic removal of emails, phone numbers, SSNs
✅ **No Personal Data**: Only tracks anonymized user IDs and generic events
✅ **Self-Hosted**: Complete control over data, no third-party access
✅ **Data Retention**: Configurable retention policies

### Tracking Capabilities

**Anonymous Visitors:**
- Page views and navigation
- Time on site
- Referrer sources
- Landing and exit pages
- Device and browser info

**Authenticated Users:**
- All of the above, plus:
- User registration events
- Login/logout events
- Profile completion
- Search activity (without search terms)
- Therapist matches viewed
- Appointments booked
- Custom events for any feature

### Privacy Protection

All tracking includes automatic sanitization:
- Email addresses → `[redacted]`
- Phone numbers → `[redacted]`
- SSN patterns → `[redacted]`
- Page titles cleaned before sending
- URL parameters filtered (no `email`, `phone`, `name`, `token`)

---

## Environment Variables Required

Before deploying, you must configure:

```bash
# Client-side (exposed to browser)
VITE_MATOMO_URL=https://analytics.yourdomain.com
VITE_MATOMO_SITE_ID=1

# Server-side (private)
MATOMO_URL=https://analytics.yourdomain.com
MATOMO_SITE_ID=2
MATOMO_AUTH_TOKEN=your_32_character_token_from_matomo
```

**How to get AUTH_TOKEN:**
1. Log into your Matomo instance
2. Go to: Administration → Personal → Security
3. Click "Create new token"
4. Give description: "TherapyConnect Server API"
5. Copy the token and add to `.env`

---

## Next Steps

### 1. Install Matomo Server

You need a self-hosted Matomo instance:
- Server with PHP 7.4+, MySQL 5.7+
- SSL certificate (required for HIPAA)
- Subdomain: `analytics.yourdomain.com`

See: [Official Matomo Installation Guide](https://matomo.org/docs/installation/)

### 2. Configure Matomo

Create two websites in Matomo:
- **Site 1**: TherapyConnect - Anonymous Visitors
- **Site 2**: TherapyConnect - Authenticated Users

Enable HIPAA compliance settings:
- IP anonymization (2 bytes minimum)
- Data retention policy (90-180 days)
- Secure authentication (2FA for admins)

### 3. Set Environment Variables

Copy from `.env.example` and fill in your values:
```bash
cp .env.example .env
# Edit .env with your Matomo URLs and tokens
```

### 4. Test in Development

```bash
# Start your app
npm run dev

# Open browser console
# Should see: "[Matomo] Anonymous visitor tracking initialized"

# Browse a few pages
# Check browser DevTools → Network tab for matomo.php requests

# Sign up or log in
# Should see: "[Matomo] User ID set: [your-id]"
```

### 5. Verify in Matomo Dashboard

- Open Matomo at `https://analytics.yourdomain.com`
- Check Site 1 → Real-time → Visitor Log
- Verify anonymous visits appear
- After login, check Site 2 → Behaviour → Events
- Verify login event tracked

### 6. Deploy to Production

```bash
# Ensure .env has production Matomo URL
# Deploy your app
# Monitor server logs for tracking confirmations
```

---

## Usage Examples

### Track Custom Events

**In any React component:**
```typescript
import { trackEvent } from '@/services/analytics';

// Track button click
trackEvent('Feature', 'Button Click', 'Export Data');

// Track form submission
trackEvent('Form', 'Submit', 'Contact Form');

// Track search
trackEvent('Search', 'Performed', undefined, resultsCount);
```

**In server route handlers:**
```typescript
import { trackingHelpers } from './middleware/analyticsMiddleware';

// Track appointment booking
await trackingHelpers.trackAppointmentBooked(userId, userRole);

// Track message sent
await trackingHelpers.trackMessageSent(userId, 'chat');

// Track profile completion
await trackingHelpers.trackProfileCompletion(userId, 85);
```

---

## Viewing Analytics

### Matomo Dashboard

**Site 1: Anonymous Visitors**
- Total unique visitors browsing your site
- Conversion rate (visitor → user)
- Top landing pages
- Traffic sources
- Bounce rate

**Site 2: Authenticated Users**
- Total registered users
- Active users (last 7 days, 30 days)
- Feature usage (events by category)
- User engagement metrics
- Conversion funnels

### Key Metrics

1. **Unique Visitors** = Anonymous users browsing before signup
2. **Unique Users** = Registered users with accounts
3. **Conversion Rate** = (New Users / Unique Visitors) × 100
4. **Activation Rate** = (Users with Complete Profile / Total Users) × 100
5. **Engagement Rate** = (Active Users / Total Users) × 100

---

## Troubleshooting

**No tracking data?**
1. Check environment variables are set
2. Verify Matomo URL is accessible
3. Check browser console for errors
4. Review server logs for tracking confirmations

**Server-side tracking not working?**
1. Verify `MATOMO_AUTH_TOKEN` is correct
2. Test Matomo API with curl:
   ```bash
   curl "https://analytics.yourdomain.com/matomo.php?idsite=2&rec=1&action_name=test&token_auth=YOUR_TOKEN"
   ```
3. Check server logs for error messages

**Visitor-to-user linking not working?**
1. Ensure `setUserId()` is called after login/signup
2. Check that login/signup responses include user ID
3. Verify same domain for cookie sharing

---

## Support

For detailed information, see:
- **Implementation Guide**: [`docs/analytics/MATOMO-IMPLEMENTATION-GUIDE.md`](./MATOMO-IMPLEMENTATION-GUIDE.md)
- **Matomo Documentation**: https://matomo.org/docs/
- **HIPAA Compliance**: https://matomo.org/blog/2018/04/how-matomo-helps-you-achieve-gdpr-compliance/

---

## Summary

✅ **Anonymous visitor tracking** implemented (client-side, Site ID 1)
✅ **Authenticated user tracking** implemented (server-side, Site ID 2)
✅ **Visitor-to-user linking** configured (setUserId on login/signup)
✅ **HIPAA compliance** built-in (PHI sanitization, IP anonymization)
✅ **Event tracking** ready (login, logout, registration, custom events)
✅ **Documentation** complete (setup guide, usage examples, troubleshooting)

**You can now:**
- Identify how many anonymous visitors browse your site
- Track how many visitors convert to registered users
- Monitor authenticated user behavior and engagement
- Analyze conversion funnels and feature usage
- Maintain HIPAA compliance with PHI protection

**To activate:**
1. Install Matomo on your server
2. Configure environment variables
3. Test in development
4. Deploy to production
5. Start analyzing your metrics!
