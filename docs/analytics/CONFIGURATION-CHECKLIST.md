# Matomo Analytics - Configuration Checklist

Use this checklist to ensure your analytics implementation is properly configured and HIPAA compliant.

---

## Pre-Installation Checklist

### Server Requirements

- [ ] Server with Linux OS (Ubuntu/Debian recommended)
- [ ] PHP 7.4 or higher installed (8.0+ recommended)
- [ ] MySQL 5.7+ or MariaDB 10.3+ installed
- [ ] Apache or Nginx web server installed
- [ ] SSL/TLS certificate available (required for HIPAA)
- [ ] Subdomain DNS configured (e.g., analytics.yourdomain.com)
- [ ] Firewall rules allow HTTPS traffic (port 443)
- [ ] Server has sufficient resources:
  - [ ] Minimum 2 CPU cores
  - [ ] Minimum 4 GB RAM
  - [ ] Minimum 50 GB storage

### Development Environment

- [ ] Node.js 20+ installed
- [ ] npm or yarn package manager
- [ ] Access to application source code
- [ ] Ability to modify `.env` files
- [ ] Ability to restart application

---

## Matomo Installation Checklist

### Matomo Server Setup

- [ ] Matomo downloaded from official source
- [ ] Files extracted to web server directory
- [ ] Web server configured to serve Matomo
- [ ] SSL certificate installed and configured
- [ ] Matomo accessible via HTTPS (https://analytics.yourdomain.com)
- [ ] Database created for Matomo
- [ ] Database user created with proper privileges
- [ ] Matomo web installer completed
- [ ] Super admin account created
- [ ] Initial login successful

### Matomo Configuration

- [ ] **Site 1 created: "TherapyConnect - Anonymous"**
  - [ ] Site ID is 1
  - [ ] Website URL configured
  - [ ] Timezone set correctly
  - [ ] Ecommerce disabled (unless needed)

- [ ] **Site 2 created: "TherapyConnect - Authenticated"**
  - [ ] Site ID is 2
  - [ ] Website URL configured
  - [ ] Timezone set correctly
  - [ ] Ecommerce disabled (unless needed)

### HIPAA Compliance Settings

- [ ] **IP Anonymization enabled**
  - [ ] Navigate to: Administration → Privacy → Anonymize Visitors
  - [ ] Set to: Mask 2 bytes (minimum)
  - [ ] Confirmed setting saved

- [ ] **Data Retention Policy configured**
  - [ ] Navigate to: Administration → Privacy → Delete Old Logs
  - [ ] "Delete logs older than" enabled
  - [ ] Set to: 90-180 days (per your policy)
  - [ ] "Delete reports older than" enabled
  - [ ] Set to: 180-365 days (per your policy)
  - [ ] Automatic deletion scheduled

- [ ] **Query Parameters excluded**
  - [ ] Navigate to: Administration → Websites → Manage
  - [ ] For Site 1, excluded parameters include:
    - [ ] email
    - [ ] phone
    - [ ] name
    - [ ] token
    - [ ] password
    - [ ] ssn
  - [ ] For Site 2, same excluded parameters
  - [ ] Settings saved

- [ ] **Do Not Track respected**
  - [ ] Navigate to: Administration → Privacy → Users Opt-Out
  - [ ] "Support Do Not Track" enabled

### Security Settings

- [ ] **Two-Factor Authentication (2FA) enabled**
  - [ ] For super admin account
  - [ ] For all admin accounts
  - [ ] Backup codes saved securely

- [ ] **Strong Passwords enforced**
  - [ ] Navigate to: Administration → General Settings → Security
  - [ ] "Force strong passwords" enabled
  - [ ] Minimum 12 characters recommended

- [ ] **Authentication Token created**
  - [ ] Navigate to: Administration → Personal → Security
  - [ ] Token created with description: "TherapyConnect Server API"
  - [ ] Token copied and saved securely
  - [ ] Token has appropriate permissions (read/write)

- [ ] **Admin Panel secured**
  - [ ] IP whitelisting configured (optional but recommended)
  - [ ] Login rate limiting enabled
  - [ ] Activity log plugin installed and enabled

### Optional: Custom Dimensions

- [ ] Navigate to: Administration → Custom Dimensions
- [ ] **Dimension 1: User Role**
  - [ ] Scope: Visit
  - [ ] Active: Yes
- [ ] **Dimension 2: Account Age**
  - [ ] Scope: Visit
  - [ ] Active: Yes
- [ ] **Dimension 3: Session Type**
  - [ ] Scope: Action
  - [ ] Active: Yes

---

## Application Configuration Checklist

### Dependencies Installed

- [ ] `axios` installed (for server-side API calls)
  ```bash
  npm install axios
  ```

### Environment Variables

- [ ] `.env` file exists (copied from `.env.example`)
- [ ] **Client-side variables set:**
  ```bash
  VITE_MATOMO_URL=https://analytics.yourdomain.com
  VITE_MATOMO_SITE_ID=1
  ```
  - [ ] `VITE_MATOMO_URL` points to your Matomo server
  - [ ] `VITE_MATOMO_SITE_ID` is set to 1

- [ ] **Server-side variables set:**
  ```bash
  MATOMO_URL=https://analytics.yourdomain.com
  MATOMO_SITE_ID=2
  MATOMO_AUTH_TOKEN=your_token_here
  ```
  - [ ] `MATOMO_URL` points to your Matomo server
  - [ ] `MATOMO_SITE_ID` is set to 2
  - [ ] `MATOMO_AUTH_TOKEN` contains your actual auth token (32+ chars)

- [ ] `.env` file is in `.gitignore` (never commit secrets!)

### Files Created

- [ ] `client/src/services/analytics.ts` exists
- [ ] `server/services/matomoAnalytics.ts` exists
- [ ] `server/middleware/analyticsMiddleware.ts` exists

### Files Modified

- [ ] `client/src/main.tsx` calls `initTracking()`
- [ ] `client/src/pages/login.tsx` calls `setUserId()` on success
- [ ] `client/src/pages/signup.tsx` calls `setUserId()` on success
- [ ] `server/routes.ts` imports `trackingHelpers`
- [ ] `server/routes.ts` tracks registration in signup route
- [ ] `server/routes.ts` tracks login in login route
- [ ] `server/routes.ts` tracks logout in logout route

### Application Restart

- [ ] Application restarted after changes
- [ ] No build errors
- [ ] No TypeScript errors
- [ ] Application loads successfully

---

## Testing Checklist

### Test 1: Anonymous Visitor Tracking

- [ ] Opened app in incognito/private window
- [ ] Opened browser DevTools → Console
- [ ] Saw message: `[Matomo] Anonymous visitor tracking initialized`
- [ ] Opened browser DevTools → Network tab
- [ ] Filtered by: `matomo`
- [ ] Saw requests to `matomo.php` with `idsite=1`
- [ ] Browsed 2-3 pages
- [ ] Each page view triggered tracking request

**Verify in Matomo:**
- [ ] Logged into Matomo dashboard
- [ ] Selected Site 1 (Anonymous Visitors)
- [ ] Navigated to: Visitors → Real-time → Visitor Log
- [ ] Saw my visit in the log
- [ ] Visit shows correct pages visited
- [ ] Visit shows correct timestamps

### Test 2: User Registration Tracking

- [ ] Continued in same incognito window
- [ ] Navigated to signup page
- [ ] Filled in registration form
- [ ] Submitted form
- [ ] Registration successful
- [ ] Saw console message: `[Matomo] User ID set: [user-id]`

**Verify in Matomo:**
- [ ] Logged into Matomo dashboard
- [ ] Selected Site 2 (Authenticated Users)
- [ ] Navigated to: Behaviour → Events
- [ ] Filtered by: Category = "User", Action = "Registration"
- [ ] Saw my registration event
- [ ] Event includes correct timestamp

**Verify Server Logs:**
- [ ] Checked server logs
- [ ] Saw message: `[Matomo Server] Event tracked: User/Registration`
- [ ] No error messages

### Test 3: Login Tracking

- [ ] Opened new incognito window
- [ ] Navigated to login page
- [ ] Entered valid credentials
- [ ] Submitted login form
- [ ] Login successful
- [ ] Saw console message: `[Matomo] User ID set: [user-id]`

**Verify in Matomo:**
- [ ] Logged into Matomo dashboard
- [ ] Selected Site 2 (Authenticated Users)
- [ ] Navigated to: Behaviour → Events
- [ ] Filtered by: Category = "Authentication", Action = "Login"
- [ ] Saw my login event
- [ ] Event includes correct timestamp

**Verify Server Logs:**
- [ ] Checked server logs
- [ ] Saw message: `[Matomo Server] Event tracked: Authentication/Login`
- [ ] No error messages

### Test 4: Logout Tracking

- [ ] Logged into application
- [ ] Clicked logout button
- [ ] Logout successful

**Verify in Matomo:**
- [ ] Logged into Matomo dashboard
- [ ] Selected Site 2 (Authenticated Users)
- [ ] Navigated to: Behaviour → Events
- [ ] Filtered by: Category = "Authentication", Action = "Logout"
- [ ] Saw my logout event

### Test 5: Visitor-to-User Linking

- [ ] Opened app in incognito window
- [ ] Browsed 2-3 pages as anonymous visitor
- [ ] Noted the pages visited
- [ ] Logged in with existing account
- [ ] Browsed 2-3 more pages as authenticated user

**Verify in Matomo:**
- [ ] Logged into Matomo dashboard
- [ ] Selected Site 2 (Authenticated Users)
- [ ] Navigated to: Visitors → User Log
- [ ] Searched for my user ID
- [ ] Saw complete journey:
  - [ ] Anonymous visits (before login)
  - [ ] Login event
  - [ ] Authenticated visits (after login)
- [ ] All visits linked to same user ID

### Test 6: PHI Sanitization

- [ ] Created test data with PHI:
  - Email: test@example.com
  - Phone: 555-123-4567
  - SSN: 123-45-6789

- [ ] Attempted to track event with PHI:
  ```typescript
  trackEvent('Test', 'PHI Test', 'email: test@example.com');
  ```

**Verify in Matomo:**
- [ ] Logged into Matomo dashboard
- [ ] Found the test event
- [ ] Verified PHI was sanitized:
  - [ ] Email shows as `[redacted]`
  - [ ] Phone shows as `[redacted]`
  - [ ] SSN shows as `[redacted]`

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] All tests passing in development
- [ ] Environment variables configured for production
- [ ] Matomo server has SSL certificate (A+ rating on SSL Labs)
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Privacy policy updated to mention analytics

### Deployment

- [ ] Code deployed to production server
- [ ] Application restarted
- [ ] Environment variables loaded correctly
- [ ] No errors in production logs
- [ ] Health checks passing

### Post-Deployment Verification

- [ ] Visited production site
- [ ] Verified tracking works in production
- [ ] Checked Matomo dashboard shows production data
- [ ] Verified HTTPS is enforced
- [ ] No console errors in browser
- [ ] No server errors in logs

### Matomo Production Configuration

- [ ] **Archiving configured**
  - [ ] Navigate to: Administration → System → General Settings
  - [ ] "Archive reports when viewed from the browser" disabled
  - [ ] Cron job set up for archiving:
    ```bash
    */5 * * * * /path/to/matomo/console core:archive
    ```

- [ ] **Email Reports configured**
  - [ ] Navigate to: Personal → Email Reports
  - [ ] Weekly summary report created
  - [ ] Recipients added
  - [ ] Schedule confirmed

- [ ] **Alerts configured** (optional)
  - [ ] Install Alerts plugin
  - [ ] Create alert for traffic drops
  - [ ] Create alert for error spikes
  - [ ] Test alert notifications

---

## HIPAA Compliance Checklist

### Data Protection

- [ ] **Encryption at rest**
  - [ ] Database encryption enabled
  - [ ] File system encryption enabled (optional)

- [ ] **Encryption in transit**
  - [ ] SSL/TLS certificate valid
  - [ ] HTTPS enforced (no HTTP allowed)
  - [ ] Certificate rated A+ on SSL Labs
  - [ ] TLS 1.2 or higher only

- [ ] **IP Anonymization**
  - [ ] Last 2 octets removed (minimum)
  - [ ] Verified in Matomo reports

- [ ] **PHI Not Tracked**
  - [ ] No patient names in tracking
  - [ ] No email addresses in tracking
  - [ ] No phone numbers in tracking
  - [ ] No diagnoses or symptoms in tracking
  - [ ] No insurance information in tracking
  - [ ] No appointment details in tracking
  - [ ] Verified with test data

### Access Control

- [ ] **Admin Access Restricted**
  - [ ] Strong passwords enforced (12+ characters)
  - [ ] 2FA enabled for all admins
  - [ ] IP whitelisting configured (optional)
  - [ ] Login attempts rate-limited

- [ ] **Audit Logging**
  - [ ] Activity log plugin installed
  - [ ] All admin actions logged
  - [ ] Logs retained for 6+ years (HIPAA requirement)

- [ ] **User Permissions**
  - [ ] Least privilege principle applied
  - [ ] Only necessary staff have access
  - [ ] Permissions reviewed regularly

### Data Retention & Deletion

- [ ] **Retention Policy Set**
  - [ ] Raw logs: 90-180 days
  - [ ] Reports: 180-365 days
  - [ ] Policy documented in privacy policy

- [ ] **Automatic Deletion Enabled**
  - [ ] Old logs deleted automatically
  - [ ] Confirmed in Matomo settings

- [ ] **User Deletion Process**
  - [ ] Process for user data deletion requests
  - [ ] Tested deletion process
  - [ ] Documentation created

### Business Associate Agreements

- [ ] **Hosting Provider BAA**
  - [ ] BAA signed with hosting provider
  - [ ] Provider is HIPAA-compliant
  - [ ] Copy of BAA stored securely

- [ ] **Infrastructure BAA**
  - [ ] BAA covers all infrastructure services
  - [ ] AWS, Google Cloud, or Azure configured for HIPAA
  - [ ] HIPAA-eligible services used

### Documentation

- [ ] **Privacy Policy updated**
  - [ ] Mentions analytics tracking
  - [ ] Describes data collected
  - [ ] Explains data usage
  - [ ] Details retention policy
  - [ ] Provides opt-out instructions

- [ ] **Security Procedures documented**
  - [ ] Incident response plan
  - [ ] Breach notification procedure
  - [ ] Regular security assessments
  - [ ] Employee training plan

- [ ] **Risk Assessment completed**
  - [ ] Annual HIPAA risk analysis
  - [ ] Vulnerabilities identified
  - [ ] Mitigation plan created
  - [ ] Documentation stored securely

---

## Maintenance Checklist

### Weekly

- [ ] Review real-time visitor activity
- [ ] Check for tracking errors in logs
- [ ] Verify data collection is working
- [ ] Monitor server resources (CPU, RAM, disk)

### Monthly

- [ ] Review data retention policy compliance
- [ ] Check for Matomo updates
- [ ] Review top pages and events
- [ ] Analyze conversion rates
- [ ] Update custom dimensions if needed

### Quarterly

- [ ] Conduct security audit
- [ ] Review and update PHI sanitization rules
- [ ] Rotate authentication tokens
- [ ] Update Matomo to latest version
- [ ] Review user access permissions
- [ ] Test backup and restore procedures

### Annually

- [ ] Complete HIPAA risk assessment
- [ ] Review and update privacy policy
- [ ] Renew SSL certificates
- [ ] Review and update BAAs
- [ ] Employee HIPAA training
- [ ] Penetration testing (recommended)

---

## Troubleshooting Checklist

### No Tracking Data

- [ ] Environment variables set correctly
- [ ] Matomo server is accessible
- [ ] No JavaScript errors in console
- [ ] Network requests to Matomo succeeding
- [ ] Correct Site IDs used
- [ ] Application restarted after config changes

### Server-Side Tracking Not Working

- [ ] `MATOMO_AUTH_TOKEN` is correct
- [ ] Auth token has proper permissions
- [ ] Server can reach Matomo URL
- [ ] No firewall blocking requests
- [ ] SSL certificate valid
- [ ] Check server logs for error messages

### Visitor-to-User Linking Not Working

- [ ] `setUserId()` called after login/signup
- [ ] User ID is consistent
- [ ] Same cookie domain used
- [ ] Cookies not blocked by browser
- [ ] Third-party cookie restrictions considered

### High Server Load

- [ ] Matomo archiving not running on every page view
- [ ] Cron job set up for archiving
- [ ] Database optimized (indexes, etc.)
- [ ] Old logs being deleted
- [ ] Consider using Redis for caching

---

## Final Verification

### Analytics Working

- [ ] ✅ Anonymous visitors being tracked
- [ ] ✅ Authenticated users being tracked
- [ ] ✅ Visitor-to-user linking working
- [ ] ✅ Events being recorded
- [ ] ✅ Data visible in Matomo dashboard
- [ ] ✅ No errors in logs

### HIPAA Compliant

- [ ] ✅ PHI not being tracked
- [ ] ✅ IP addresses anonymized
- [ ] ✅ Data encrypted in transit
- [ ] ✅ Data retention policy enforced
- [ ] ✅ Access controls in place
- [ ] ✅ Audit logging enabled
- [ ] ✅ BAAs signed

### Production Ready

- [ ] ✅ All tests passing
- [ ] ✅ Documentation complete
- [ ] ✅ Monitoring configured
- [ ] ✅ Backups configured
- [ ] ✅ Privacy policy updated
- [ ] ✅ Team trained

---

## Sign-Off

**Configuration completed by:** _________________________

**Date:** _________________________

**Verified by:** _________________________

**Date:** _________________________

**HIPAA compliance reviewed by:** _________________________

**Date:** _________________________

---

## Notes & Issues

Use this space to document any issues encountered, deviations from the checklist, or important notes:

```
[Your notes here]
```

---

**Checklist Version**: 1.0
**Last Updated**: 2025-10-20
