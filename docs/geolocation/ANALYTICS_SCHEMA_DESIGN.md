# Geolocation Analytics Schema Design

## Goal

Track **aggregate** user behavior and geographic patterns without storing personally identifiable information (PII).

## Use Cases

1. **Geographic Distribution:** Where are visitors coming from?
2. **Market Analysis:** Which cities/regions have high demand?
3. **Feature Usage:** Do users prefer IP vs GPS location?
4. **Search Patterns:** What radius do users typically search?
5. **Conversion Analysis:** Which regions have highest booking rates?
6. **Underserved Areas:** Where should we recruit more therapists?

## Privacy-First Principles

✅ **Anonymous by Design:**
- No user IDs for anonymous visitors
- No IP addresses stored (HIPAA compliant)
- No exact GPS coordinates (city-level only)
- No linking to health searches

✅ **Aggregate Data Only:**
- Count visitors per city/state
- Average search radius
- Geographic trends over time

✅ **Auto-Purging:**
- Data retention: 90 days for raw data
- Permanent: Monthly aggregates only

## Database Schema

### Table 1: Page Views (Anonymous Traffic Analytics)

```sql
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Geographic data (city-level only, no exact coords)
  city TEXT,                    -- "San Francisco"
  state TEXT,                   -- "CA"
  country TEXT DEFAULT 'USA',   -- "United States"

  -- Detection method
  location_method TEXT,         -- "ip" | "unknown"

  -- Page context
  page_path TEXT,               -- "/", "/therapist-search", "/therapist-profile/123"
  referrer_domain TEXT,         -- "google.com", "direct", null

  -- Session tracking (anonymous)
  session_id UUID,              -- Random UUID (not linked to user account)
  is_new_session BOOLEAN DEFAULT true,

  -- Device info (non-identifying)
  device_type TEXT,             -- "desktop" | "mobile" | "tablet"
  browser_family TEXT,          -- "Chrome" | "Safari" | "Firefox"

  -- ❌ NO user_id (for anonymous visitors)
  -- ❌ NO ip_address
  -- ❌ NO exact latitude/longitude
  -- ❌ NO user agent string (contains version = fingerprinting)

  CONSTRAINT page_views_location_method_check
    CHECK (location_method IN ('ip', 'gps', 'manual', 'unknown'))
);

-- Index for analytics queries
CREATE INDEX idx_page_views_created_at ON page_views(created_at);
CREATE INDEX idx_page_views_city_state ON page_views(city, state);
CREATE INDEX idx_page_views_session ON page_views(session_id);

-- Auto-delete after 90 days
CREATE INDEX idx_page_views_retention ON page_views(created_at)
  WHERE created_at < NOW() - INTERVAL '90 days';
```

**Purpose:** Track overall traffic and geographic distribution

**Example Query:**
```sql
-- Top 10 cities by visitor count (last 30 days)
SELECT city, state, COUNT(*) as visitors
FROM page_views
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND city IS NOT NULL
GROUP BY city, state
ORDER BY visitors DESC
LIMIT 10;
```

---

### Table 2: Location Searches (Therapist Search Analytics)

```sql
CREATE TABLE location_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Search location (city-level only)
  search_city TEXT,             -- "San Francisco"
  search_state TEXT,            -- "CA"
  search_zip TEXT,              -- "94102" (optional, if user entered)

  -- Search parameters
  radius_miles INTEGER,         -- 25, 50, 100
  location_method TEXT NOT NULL, -- "ip" | "gps" | "manual"

  -- Results
  results_found INTEGER,        -- 15
  results_clicked INTEGER DEFAULT 0,

  -- Filters used (anonymized)
  had_specialty_filter BOOLEAN DEFAULT false,
  had_insurance_filter BOOLEAN DEFAULT false,
  had_modality_filter BOOLEAN DEFAULT false,

  -- Session tracking (anonymous)
  session_id UUID,              -- Links to page_views session

  -- ❌ NO user_id (for anonymous searches)
  -- ❌ NO exact search coordinates
  -- ❌ NO filter values (e.g., which specialties - that's PHI)
  -- ❌ NO therapist IDs clicked (privacy)

  CONSTRAINT location_searches_method_check
    CHECK (location_method IN ('ip', 'gps', 'manual')),
  CONSTRAINT location_searches_radius_check
    CHECK (radius_miles IN (10, 25, 50, 100, 150, 200))
);

-- Indexes
CREATE INDEX idx_location_searches_created_at ON location_searches(created_at);
CREATE INDEX idx_location_searches_city_state ON location_searches(search_city, search_state);
CREATE INDEX idx_location_searches_method ON location_searches(location_method);

-- Auto-delete after 90 days
CREATE INDEX idx_location_searches_retention ON location_searches(created_at)
  WHERE created_at < NOW() - INTERVAL '90 days';
```

**Purpose:** Understand search behavior and demand patterns

**Example Query:**
```sql
-- Average search radius by location method
SELECT
  location_method,
  ROUND(AVG(radius_miles)) as avg_radius,
  COUNT(*) as search_count
FROM location_searches
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY location_method;

-- Cities with most searches but fewest results (underserved markets)
SELECT
  search_city,
  search_state,
  COUNT(*) as searches,
  ROUND(AVG(results_found)) as avg_results
FROM location_searches
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND search_city IS NOT NULL
GROUP BY search_city, search_state
HAVING AVG(results_found) < 5
ORDER BY searches DESC
LIMIT 10;
```

---

### Table 3: Geographic Aggregates (Permanent Summary)

```sql
CREATE TABLE geographic_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Time period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  aggregation_type TEXT NOT NULL, -- "daily" | "weekly" | "monthly"

  -- Location
  city TEXT,
  state TEXT NOT NULL,
  country TEXT DEFAULT 'USA',

  -- Metrics
  total_visitors INTEGER DEFAULT 0,
  total_searches INTEGER DEFAULT 0,
  total_results_found INTEGER DEFAULT 0,
  avg_search_radius INTEGER,

  -- Location method breakdown
  ip_location_count INTEGER DEFAULT 0,
  gps_location_count INTEGER DEFAULT 0,
  manual_location_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(period_start, period_end, aggregation_type, state, city)
);

-- Indexes
CREATE INDEX idx_geo_agg_period ON geographic_aggregates(period_start, period_end);
CREATE INDEX idx_geo_agg_state_city ON geographic_aggregates(state, city);
```

**Purpose:** Permanent historical records (aggregated, not raw data)

**Example Query:**
```sql
-- Monthly growth by state
SELECT
  state,
  DATE_TRUNC('month', period_start) as month,
  SUM(total_visitors) as visitors,
  SUM(total_searches) as searches
FROM geographic_aggregates
WHERE aggregation_type = 'monthly'
  AND period_start >= '2025-01-01'
GROUP BY state, month
ORDER BY state, month;
```

---

### Table 4: Registered User Location (Optional - With Consent)

```sql
CREATE TABLE user_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Location (city-level only, no exact coords)
  city TEXT,
  state TEXT,
  zip_code TEXT,                -- If user entered
  country TEXT DEFAULT 'USA',

  -- Context
  location_method TEXT,         -- "ip" | "gps" | "manual"
  action_type TEXT,             -- "search" | "profile_view" | "booking"

  -- ❌ NO exact latitude/longitude
  -- ❌ NO IP address

  CONSTRAINT user_location_method_check
    CHECK (location_method IN ('ip', 'gps', 'manual')),
  CONSTRAINT user_location_action_check
    CHECK (action_type IN ('search', 'profile_view', 'booking', 'account_creation'))
);

-- Indexes
CREATE INDEX idx_user_location_user_id ON user_location_history(user_id);
CREATE INDEX idx_user_location_created_at ON user_location_history(created_at);

-- Auto-delete after 1 year (configurable per privacy policy)
CREATE INDEX idx_user_location_retention ON user_location_history(created_at)
  WHERE created_at < NOW() - INTERVAL '1 year';
```

**Purpose:** Track registered user behavior (requires consent)

**HIPAA Considerations:**
- ⚠️ This IS PHI (user + location + health search context)
- ✅ City-level only (not exact coordinates)
- ✅ Requires explicit user consent
- ✅ Must be encrypted at rest
- ✅ Audit logging required
- ✅ Auto-purge after 1 year

**Example Query:**
```sql
-- Geographic distribution of registered users
SELECT
  state,
  COUNT(DISTINCT user_id) as registered_users,
  COUNT(*) as total_actions
FROM user_location_history
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY state
ORDER BY registered_users DESC;
```

---

## Data Retention Policy

| Table | Raw Data Retention | Aggregate Retention | Auto-Purge |
|-------|-------------------|---------------------|------------|
| `page_views` | 90 days | N/A | ✅ Yes |
| `location_searches` | 90 days | N/A | ✅ Yes |
| `geographic_aggregates` | N/A | Permanent | ❌ No |
| `user_location_history` | 1 year | N/A | ✅ Yes |

**Implementation:**
```sql
-- Automated cleanup job (run daily)
DELETE FROM page_views
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM location_searches
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM user_location_history
WHERE created_at < NOW() - INTERVAL '1 year';
```

---

## Session Tracking (Anonymous)

**Anonymous Session ID Generation:**
```typescript
// server/services/analytics.ts
import { v4 as uuidv4 } from 'uuid';

function getOrCreateSessionId(req: Request): string {
  // Check if session already has analytics session ID
  if (req.session.analyticsSessionId) {
    return req.session.analyticsSessionId;
  }

  // Generate new anonymous session ID
  const sessionId = uuidv4();
  req.session.analyticsSessionId = sessionId;

  return sessionId;
}
```

**Session vs User:**
- ❌ NOT linked to user account (for anonymous visitors)
- ✅ Tracks single browsing session
- ✅ Expires with browser session
- ✅ New session = new UUID

---

## Example Analytics Queries

### 1. Geographic Heat Map Data
```sql
SELECT
  state,
  city,
  COUNT(*) as visitor_count,
  COUNT(DISTINCT session_id) as unique_sessions
FROM page_views
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND city IS NOT NULL
GROUP BY state, city
ORDER BY visitor_count DESC;
```

### 2. Location Method Adoption
```sql
SELECT
  location_method,
  COUNT(*) as searches,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM location_searches
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY location_method
ORDER BY searches DESC;
```

### 3. Search Success Rate by City
```sql
SELECT
  search_city,
  search_state,
  COUNT(*) as total_searches,
  SUM(CASE WHEN results_found > 0 THEN 1 ELSE 0 END) as successful_searches,
  ROUND(100.0 * SUM(CASE WHEN results_found > 0 THEN 1 ELSE 0 END) / COUNT(*), 1) as success_rate,
  ROUND(AVG(results_found), 1) as avg_results
FROM location_searches
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND search_city IS NOT NULL
GROUP BY search_city, search_state
HAVING COUNT(*) >= 10  -- Min 10 searches for statistical significance
ORDER BY total_searches DESC
LIMIT 20;
```

### 4. Underserved Markets
```sql
WITH city_stats AS (
  SELECT
    search_city,
    search_state,
    COUNT(*) as search_demand,
    AVG(results_found) as avg_results,
    AVG(radius_miles) as avg_radius
  FROM location_searches
  WHERE created_at >= NOW() - INTERVAL '90 days'
    AND search_city IS NOT NULL
  GROUP BY search_city, search_state
)
SELECT
  search_city,
  search_state,
  search_demand,
  ROUND(avg_results, 1) as avg_results,
  ROUND(avg_radius) as avg_radius
FROM city_stats
WHERE avg_results < 5      -- Few therapists available
  AND search_demand >= 20  -- But high demand
ORDER BY search_demand DESC, avg_results ASC
LIMIT 10;
```

### 5. Traffic Sources by Geography
```sql
SELECT
  state,
  referrer_domain,
  COUNT(*) as visits,
  COUNT(DISTINCT session_id) as unique_visitors
FROM page_views
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND state IS NOT NULL
GROUP BY state, referrer_domain
ORDER BY state, visits DESC;
```

---

## Privacy Policy Updates Required

Add to your privacy policy:

> **Anonymous Analytics**
>
> We collect anonymized location data (city and state level only) to understand:
> - Geographic distribution of visitors
> - Which areas have high demand for mental health services
> - How users interact with our location-based search features
>
> This data:
> - Does NOT include your exact location (GPS coordinates)
> - Does NOT include your IP address
> - Is NOT linked to your identity (for non-registered users)
> - Is automatically deleted after 90 days
> - Is used only for improving our service and identifying underserved areas
>
> **For Registered Users:**
> If you create an account, we may associate your city-level location with your account to:
> - Provide personalized therapist recommendations
> - Show you relevant search results
> - Analyze regional service usage patterns
>
> You can opt out of location tracking or delete your account at any time.

---

## HIPAA Compliance Checklist

✅ **Safe (No PHI):**
- `page_views` (anonymous traffic)
- `location_searches` (no user linkage, city-level only)
- `geographic_aggregates` (aggregate statistics)

⚠️ **Requires HIPAA Controls:**
- `user_location_history` (user + location + context = PHI)
  - Requires: Encryption at rest (AES-256)
  - Requires: Access audit logging
  - Requires: User consent
  - Requires: BAA with cloud provider

---

## Next Steps

1. Create migration for analytics tables
2. Implement analytics tracking service
3. Add tracking to relevant endpoints
4. Build analytics dashboard/reports
5. Update privacy policy
6. Set up automated data purging

**Estimated Effort:** 4-6 hours

Would you like me to proceed with implementation?
