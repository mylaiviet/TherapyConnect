# Project Brief: HIPAA-Compliant Therapy Matching Platform with Self-Hosted Matomo Analytics

## Project Overview
Build a behavioral health provider and patient matching platform that tracks both anonymous unique visitors and authenticated unique users while maintaining HIPAA compliance. The platform must use self-hosted Matomo On-Premise analytics infrastructure.

## Business Requirements

### Core Functionality
1. **Patient Portal**
   - Account registration and authentication
   - Profile creation (symptoms, preferences, insurance, location)
   - Provider search and filtering
   - Appointment booking system
   - Secure messaging with providers

2. **Provider Portal**
   - Account registration and authentication with credential verification
   - Profile management (specialties, certifications, availability, insurance accepted)
   - Patient match notifications
   - Appointment management
   - Secure messaging with patients

3. **Matching Engine**
   - Algorithm to match patients with providers based on:
     - Specialty and treatment approach
     - Insurance compatibility
     - Geographic location/telehealth availability
     - Provider availability
     - Patient preferences

### Analytics Requirements

#### Track Two Distinct User Types:

**Unique Visitors (Pre-Registration):**
- Track anonymous users browsing the site before creating accounts
- Metrics needed: page views, session duration, bounce rate, conversion funnel
- Use cookie-based tracking with UUID generation
- Track: landing pages, search behavior, pages visited before signup

**Unique Users (Post-Registration):**
- Track authenticated patients and providers after login
- Link analytics to database user_id (not email or PHI)
- Track: matches viewed, appointments booked, messages sent, profile completions
- Maintain tracking across devices for same authenticated user

## Technical Architecture

### Technology Stack (Your Choice)
- **Frontend:** React, Vue, or Angular with TypeScript
- **Backend:** Node.js/Express, Python/Django, or Ruby on Rails
- **Database:** PostgreSQL with encryption at rest
- **Authentication:** JWT tokens with secure session management
- **Hosting:** AWS, Google Cloud, or Azure (must support HIPAA BAA)

### Matomo Self-Hosted Analytics Integration

#### Server Requirements
For a startup platform (under 1 million page views/month):
- 1 server: 4 CPU, 8 GB RAM, 250GB SSD
- Linux (Ubuntu/Debian) or compatible OS
- PHP 7.4+ (8.0+ recommended)
- MySQL 5.7+ or MariaDB 10.3+
- Web server: Apache or Nginx

#### Matomo Installation Steps
1. Download Matomo On-Premise from official source
2. Set up dedicated subdomain (e.g., analytics.yourdomain.com)
3. Configure SSL/TLS certificates (Let's Encrypt)
4. Install Matomo via web installer or command line
5. Create site IDs for different tracking contexts

#### Implementation Requirements

**JavaScript Tracking for Unique Visitors:**
```javascript
// Embed in all public pages before user authentication
var _paq = window._paq = window._paq || [];
_paq.push(['trackPageView']);
_paq.push(['enableLinkTracking']);
(function() {
  var u="//analytics.yourdomain.com/";
  _paq.push(['setTrackerUrl', u+'matomo.php']);
  _paq.push(['setSiteId', '1']); // Site ID for visitor tracking
  var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
  g.type='text/javascript'; g.async=true; g.src=u+'matomo.js'; 
  s.parentNode.insertBefore(g,s);
})();
```

**Server-Side Tracking API for Authenticated Users:**
After user login, switch to server-side tracking that includes user_id:
- Use Matomo Tracking HTTP API
- Send tracking requests from backend
- Include `uid` parameter with database user_id (anonymized identifier)
- Track custom events: profile_completed, match_viewed, appointment_booked, message_sent

Example API call structure:
```
POST https://analytics.yourdomain.com/matomo.php
Parameters:
- idsite: 2 (separate site ID for authenticated users)
- rec: 1
- action_url: [page URL]
- uid: [anonymized_user_id]
- cdt: [timestamp]
- token_auth: [auth token]
```

## HIPAA Compliance Requirements

### Data Security Configuration

**1. Encryption:**
- Enable MySQL/MariaDB data encryption at rest
- Use encrypted SSL database connections between Matomo and MySQL
- SSL/TLS certificates on all endpoints (A+ rating on SSL Labs)
- Encrypt Matomo email notifications

**2. Access Controls:**
- Implement IP whitelisting for Matomo admin panel
- Two-factor authentication for all Matomo admin accounts
- Role-based access control (RBAC)
- Enable Matomo's Activity Log plugin to audit all changes

**3. Data Anonymization:**
- Anonymize IP addresses (remove last 2 octets minimum)
- Do NOT track: user emails, phone numbers, full names, diagnosis info
- Use anonymized user_id (e.g., UUID) not actual database primary keys
- Avoid tracking URLs containing PHI (e.g., /patient/john-smith/depression)
- Sanitize page titles to remove health information

**4. Data Retention:**
- Set data retention policy (recommend 90-180 days for analytics)
- Implement automated data deletion for old tracking data
- Create backup and restore procedures with encryption
- Document data deletion process for user requests

**5. Session Management:**
- Secure session storage with HttpOnly and Secure flags on cookies
- Implement session timeout after 15-30 minutes of inactivity
- Regenerate session IDs after login
- Use OWASP session management best practices

### Infrastructure Requirements

**Hosting Provider Must:**
- Sign Business Associate Agreement (BAA)
- Offer HIPAA-compliant infrastructure
- Provide encryption at rest and in transit
- Recommended: AWS (with HIPAA eligible services), Google Cloud Healthcare API, or Azure for Healthcare

**Network Security:**
- VPC with private subnets for database and Matomo server
- Security groups limiting inbound traffic
- DDoS protection (CloudFlare or AWS Shield)
- Web Application Firewall (WAF)
- Intrusion Detection System (IDS)

**Database Security:**
- Encrypted backups stored in separate region
- Automated backup schedule (daily minimum)
- Point-in-time recovery enabled
- Database access logs enabled and monitored

### Administrative Requirements

Create and implement:
1. **Privacy Policy** - Document data collection, use, storage, and deletion
2. **Security Incident Response Plan** - Breach notification procedures
3. **Risk Assessment** - Annual security risk analysis
4. **Employee Training** - HIPAA training for all team members
5. **Business Associate Agreements** - With hosting provider and any third-party services
6. **Audit Logs** - Enable and preserve access logs for 6+ years

## Development Deliverables

### Phase 1: Core Platform (MVP)
- User authentication system (patient and provider)
- Basic profile creation and management
- Simple matching algorithm
- Database schema with encryption
- Secure API endpoints

### Phase 2: Matomo Integration
- Self-hosted Matomo installation and configuration
- Cookie-based tracking for unique visitors
- Server-side tracking API integration for authenticated users
- Custom event tracking implementation
- Analytics dashboard for admin users

### Phase 3: HIPAA Hardening
- Implement all encryption requirements
- Configure data anonymization rules
- Set up audit logging and monitoring
- Implement data retention and deletion policies
- Security testing and vulnerability assessment
- Privacy policy and user consent workflows

### Phase 4: Matching & Booking
- Advanced matching algorithm
- Real-time availability calendar
- Appointment booking workflow
- Email/SMS notifications (via HIPAA-compliant service)
- Secure messaging system

## Code Structure Requirements

```
project-root/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   │   └── analytics.service.js  # Matomo tracking wrapper
│   │   └── utils/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── services/
│   │   ├── analytics.service.js      # Matomo API integration
│   │   ├── matching.service.js
│   │   └── auth.service.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── hipaa.middleware.js       # PHI filtering and logging
│   └── routes/
├── database/
│   ├── migrations/
│   └── seeds/
├── infrastructure/
│   ├── terraform/                    # Infrastructure as code
│   └── docker/
└── docs/
    ├── api-documentation.md
    ├── privacy-policy.md
    └── security-procedures.md
```

## Key Technical Considerations

### Tracking Implementation Strategy

1. **Anonymous Visitor Flow:**
   - User lands on site → JavaScript generates UUID → Stored in first-party cookie
   - All page views tracked client-side via Matomo JavaScript
   - Track: page views, clicks, time on page, referrer

2. **Transition to Authenticated User:**
   - User registers/logs in → Backend creates user_id in database
   - Generate anonymized tracking ID (separate from primary key)
   - Send user_id to Matomo via User ID feature
   - Switch from client-side to server-side tracking for sensitive actions

3. **Authenticated User Flow:**
   - Critical actions tracked server-side (appointments, matches, messages)
   - General navigation can remain client-side with user_id attached
   - Never send PHI in tracking parameters

### Data That Must NOT Be Tracked
- Patient names, emails, phone numbers
- Provider credentials or personal contact info
- Diagnosis codes, treatment details, or symptoms
- Insurance policy numbers
- Appointment notes or message content
- IP addresses (must be anonymized)
- Full geographic location (city-level only)

### Custom Dimensions to Track
Safe metrics to measure platform performance:
- User role (patient/provider) - generic only
- Account creation date (month/year)
- Profile completion percentage
- Number of matches viewed
- Appointment booking rate
- Message response time (aggregated)
- Search filters used (anonymized)

## Security Testing Checklist

Before launch, verify:
- [ ] Penetration testing completed
- [ ] SQL injection protection validated
- [ ] XSS prevention confirmed
- [ ] CSRF tokens implemented
- [ ] SSL/TLS configuration A+ rated
- [ ] Password policies enforced (min 12 chars, complexity)
- [ ] Rate limiting on API endpoints
- [ ] File upload restrictions (if applicable)
- [ ] Error messages don't leak sensitive info
- [ ] Matomo admin panel not publicly accessible
- [ ] Database credentials stored in environment variables
- [ ] API keys rotated and secured

## Success Metrics

Track platform performance via Matomo:
- **Unique Visitors:** Anonymous traffic to marketing pages
- **Conversion Rate:** Visitor → Registered User
- **Unique Users:** Authenticated patients and providers
- **Activation Rate:** Registered User → Profile Completed
- **Engagement:** Matches viewed, appointments booked per user
- **Retention:** 7-day and 30-day user return rate
- **Provider Utilization:** Bookings per provider

## Your Task

Using this brief, build a production-ready HIPAA-compliant therapy matching platform with self-hosted Matomo analytics. Provide:

1. Complete application code (frontend and backend)
2. Matomo integration implementation (both JavaScript and API)
3. Database schema with security considerations
4. Infrastructure configuration files (Docker, Terraform, or equivalent)
5. Deployment documentation
6. Security configuration guide
7. HIPAA compliance checklist specific to this implementation
8. API documentation
9. Testing suite (unit and integration tests)

Prioritize security, privacy, and HIPAA compliance in every architectural decision. Assume this will handle real patient data and must meet healthcare regulatory standards.
