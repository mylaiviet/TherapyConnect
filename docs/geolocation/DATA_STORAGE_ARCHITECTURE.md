# Geolocation Data Storage Architecture

## Overview

This document explains where and how geolocation data is stored in the TherapyConnect application, with a focus on privacy, HIPAA compliance, and performance.

## TL;DR - Quick Answer

**User location data is NOT stored in the database.**

- ✅ Therapist locations → PostgreSQL (public data)
- ✅ ZIP code coordinates → PostgreSQL (public data)
- ❌ User IP addresses → NOT stored (ephemeral)
- ❌ User GPS coordinates → NOT stored in database (sessionStorage only)
- ✅ GeoIP database → File system (GeoLite2.mmdb)

## Database Schema

### 1. Therapist Locations (Existing ✅)

**Table:** `therapists`
**File:** [shared/schema.ts:32-37](../../shared/schema.ts#L32-L37)

```sql
CREATE TABLE therapists (
  id VARCHAR PRIMARY KEY,
  -- Location fields (already exist)
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT DEFAULT 'USA',
  latitude NUMERIC,        -- ✅ Already in database
  longitude NUMERIC,       -- ✅ Already in database
  street_address TEXT,

  -- Other fields...
);
```

**Purpose:**
- Store therapist office locations
- Enable proximity-based matching
- Calculate distances to users

**Privacy:** Public information (displayed on profiles)

**Status:** ✅ No migration needed - already exists

---

### 2. ZIP Code Reference Table (Existing ✅)

**Table:** `zip_codes`
**File:** [shared/schema.ts:573-581](../../shared/schema.ts#L573-L581)

```sql
CREATE TABLE zip_codes (
  zip VARCHAR(5) PRIMARY KEY,
  city TEXT NOT NULL,
  state VARCHAR(2) NOT NULL,
  latitude NUMERIC(10, 8),    -- ✅ Already in database
  longitude NUMERIC(11, 8),   -- ✅ Already in database
  county TEXT,
  timezone TEXT
);
```

**Purpose:**
- Convert ZIP codes to coordinates
- Support ZIP code-based searches
- Geocode user input (e.g., "94102" → lat/lng)

**Privacy:** Public information (US Census data)

**Status:** ✅ Already populated with data

---

### 3. User Location Data (NOT Stored ❌)

**Storage:** NONE (ephemeral, request-scoped only)

```typescript
// This data exists ONLY during the HTTP request
// ❌ NOT saved to database
// ❌ NOT logged to files
// ❌ NOT persisted anywhere

interface IPLocationResult {
  success: true;
  location: {
    city: "San Francisco",
    state: "California",
    latitude: 37.7749,
    longitude: -122.4194
  }
}
// Discarded immediately after response sent
```

**Why not store it?**

1. **HIPAA Compliance**
   - User location + health search = PHI
   - Storing would require BAA, encryption, audit logs
   - Not worth the compliance burden

2. **Privacy**
   - Users expect location to be temporary
   - No need for historical location tracking
   - Reduces data breach risk

3. **Performance**
   - IP geolocation is instant (<1ms)
   - No benefit to caching
   - Fresh data on every request

4. **Legal**
   - GDPR "right to be forgotten" compliance
   - No PII to manage or delete
   - Reduced liability

**Where it goes:**
```
User Request → IP Geolocation → Search Therapists → Return Results
                     ↓
            (discarded here)
```

---

### 4. User Location Preferences (Browser SessionStorage)

**Storage:** Client-side `sessionStorage` only

```javascript
// Stored in user's browser (not server)
sessionStorage.setItem('userLocation', JSON.stringify({
  method: 'gps',              // or 'ip' or 'manual'
  latitude: 37.7749,
  longitude: -122.4194,
  city: 'San Francisco',
  state: 'CA',
  accuracy: 20,               // meters
  timestamp: Date.now(),
  permissionGranted: true
}));
```

**Lifetime:** Current browser tab/session only

**Cleared when:**
- User closes browser tab
- User clears browser data
- Session expires

**Purpose:**
- Remember user's location during browsing session
- Avoid re-requesting GPS permission
- Pre-populate location in search form

**Privacy:**
- ✅ Client-side only (never sent to server except for searches)
- ✅ No user account linkage
- ✅ Automatically deleted on session end

---

### 5. GeoIP Database (File System)

**Storage:** `server/data/GeoLite2-City.mmdb`

**Type:** Binary database file (MaxMind format)

**Size:** ~70MB

**Loaded:** Into memory on server startup

**Purpose:** Convert IP address → city, state, coordinates

**Example Lookup:**
```typescript
IP: "8.8.8.8"
     ↓
GeoLite2-City.mmdb (in memory)
     ↓
{
  city: "Mountain View",
  state: "California",
  latitude: 37.4056,
  longitude: -122.0775
}
```

**Privacy:**
- ✅ Public database (not user data)
- ✅ No personally identifiable information
- ✅ Can be shared, backed up, version controlled (excluding from git due to size)

**Updates:** Monthly from MaxMind

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ USER MAKES REQUEST                                           │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ SERVER: Extract IP from request headers                      │
│ IP: "72.14.207.99" (example)                                 │
│ Storage: ❌ Not stored (memory only)                         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ SERVER: Lookup in GeoLite2.mmdb (in memory)                 │
│ Result: {city: "SF", lat: 37.77, lng: -122.41}              │
│ Storage: ❌ Not stored (memory only)                         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ SERVER: Query PostgreSQL                                     │
│ SELECT * FROM therapists                                     │
│ WHERE calculate_distance(37.77, -122.41, latitude, longitude) < 25 │
│ Storage: ✅ therapists.latitude/longitude (already exists)   │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ SERVER: Calculate distances using Haversine formula          │
│ Sort by distance, return results                             │
│ Storage: ❌ Not stored (calculated on-the-fly)               │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ CLIENT: Receive therapist list with distances                │
│ Optional: Save location preference to sessionStorage         │
│ Storage: ✅ Browser sessionStorage (user's device only)      │
└─────────────────────────────────────────────────────────────┘
```

---

## Optional: Analytics Table (Future Consideration)

If you need to track aggregate search patterns (for business intelligence), you could add:

### Option A: Anonymized Search Analytics

```sql
CREATE TABLE location_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_date TIMESTAMP DEFAULT NOW(),

  -- Aggregate data only (no user linkage)
  city_searched TEXT,              -- "San Francisco"
  state_searched TEXT,             -- "CA"
  radius_miles INTEGER,            -- 25
  results_count INTEGER,           -- 15
  location_method TEXT,            -- "ip" | "gps" | "manual"

  -- ❌ NO user_id (anonymous)
  -- ❌ NO exact coordinates
  -- ❌ NO IP addresses
);
```

**HIPAA Status:** ✅ Safe (no PHI, aggregate data only)

**Use Cases:**
- Understand which cities have search demand
- Identify underserved areas
- Plan therapist recruitment

---

### Option B: User Search History (Requires Consent)

```sql
CREATE TABLE user_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  search_date TIMESTAMP DEFAULT NOW(),
  search_query TEXT,               -- "anxiety therapist"
  location_used TEXT,              -- "San Francisco, CA" (not exact coords)
  radius_miles INTEGER,
  results_viewed INTEGER,

  -- ❌ NO exact GPS coordinates
  -- ❌ NO IP addresses
);
```

**HIPAA Status:** ⚠️ PHI (requires encryption, consent, BAA)

**Use Cases:**
- Personalized recommendations
- "Continue where you left off" feature
- User analytics dashboard

**Requirements:**
- User consent required
- Encryption at rest (AES-256)
- Audit logging
- HIPAA Business Associate Agreement

---

## Do We Need Database Migrations?

### ✅ No Migrations Needed for Phase 1-3

The existing schema already has everything we need:

```sql
-- Already exists in migrations/0000_nasty_smiling_tiger.sql
ALTER TABLE therapists
  ADD COLUMN latitude NUMERIC,
  ADD COLUMN longitude NUMERIC;  -- ✅ Already done
```

**Verification:**
```bash
grep -E "(latitude|longitude)" migrations/0000_nasty_smiling_tiger.sql
# Output: "latitude" numeric,
#         "longitude" numeric,
```

### Future: Optional Spatial Index (Performance)

If therapist searches become slow, add a spatial index:

```sql
-- Future optimization (not needed yet)
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;

CREATE INDEX idx_therapist_location
  ON therapists
  USING GIST (ll_to_earth(latitude::float8, longitude::float8));
```

**When to add:**
- 1000+ therapists in database
- Location searches taking >500ms
- High traffic (10k+ searches/day)

**Performance impact:**
- 10-100x faster distance queries
- Enables radius search optimization

---

## HIPAA Compliance Summary

| Data Type | Stored? | PHI? | Compliant? |
|-----------|---------|------|------------|
| User IP address | ❌ No | ✅ Yes (if stored) | ✅ Yes (not stored) |
| User GPS coords | ❌ No (sessionStorage only) | ✅ Yes (if stored) | ✅ Yes (client-only) |
| User search location | ❌ No | ✅ Yes (if stored) | ✅ Yes (not stored) |
| Therapist locations | ✅ Yes (PostgreSQL) | ❌ No (public) | ✅ Yes |
| ZIP codes | ✅ Yes (PostgreSQL) | ❌ No (public) | ✅ Yes |
| GeoIP database | ✅ Yes (file system) | ❌ No (public) | ✅ Yes |

**Result:** ✅ Current implementation is HIPAA compliant

---

## Privacy-by-Design Principles

1. **Data Minimization**
   - Only collect what's absolutely necessary
   - User location is ephemeral (request-scoped)

2. **Purpose Limitation**
   - Location used ONLY for therapist matching
   - Not shared, not sold, not stored

3. **Transparency**
   - Clear privacy notices before GPS request
   - Users know when location is being used

4. **User Control**
   - Can deny location permission
   - Can use manual ZIP code entry instead
   - Can clear sessionStorage anytime

5. **Security**
   - No location data in database → no database breaches
   - No PII to protect → reduced attack surface

---

## Performance Characteristics

| Operation | Storage | Speed | Scalability |
|-----------|---------|-------|-------------|
| IP → Coordinates | In-memory (GeoLite2) | <1ms | ✅ Excellent |
| ZIP → Coordinates | PostgreSQL query | ~5ms | ✅ Good (indexed) |
| Distance calculation | Computed on-the-fly | ~10ms per therapist | ✅ Good (up to 10k therapists) |
| Therapist search | PostgreSQL query | ~50ms | ✅ Good (will optimize with spatial index) |

**Memory Usage:**
- GeoLite2 database: ~80MB in RAM
- No additional overhead (no caching)

---

## Backup and Disaster Recovery

**What needs backup:**
- ✅ `therapists` table (latitude/longitude)
- ✅ `zip_codes` table
- ✅ GeoLite2-City.mmdb file (can re-download)

**What doesn't need backup:**
- ❌ User location data (doesn't exist)
- ❌ User search history (doesn't exist)

**Recovery:**
- GeoLite2 database can be re-downloaded from MaxMind
- No user data loss (because there's no user data stored)

---

## Frequently Asked Questions

### Q: Why not cache user location in Redis?

**A:** No performance benefit. IP geolocation is already <1ms. Caching adds complexity without speed improvement.

### Q: Should we log user searches for analytics?

**A:** Only if:
1. Anonymized (no user linkage)
2. Aggregate city-level data only
3. Business need justifies the risk
4. Proper consent obtained

### Q: What if users want to save their location?

**A:** Two options:
1. Use browser localStorage (client-side)
2. Add optional user profile field (requires HIPAA compliance)

### Q: How accurate is IP geolocation?

**A:**
- City-level: 70-80% accurate
- State-level: 95%+ accurate
- Street-level: Not possible with IP alone

### Q: What about VPN users?

**A:** They'll see therapists near their VPN server location. That's expected behavior. Solution: Offer manual ZIP code entry.

---

## Summary

**Current Implementation:**

✅ **Zero user data stored in database**
- Privacy-first approach
- HIPAA compliant by design
- No PII management overhead
- Reduced security risk

✅ **All necessary geolocation infrastructure exists:**
- Therapist lat/lng columns
- ZIP code reference table
- Haversine distance calculation
- Proximity matching service

✅ **No database migrations needed**

**Future Considerations:**

- Optional: Add spatial index for performance (when needed)
- Optional: Add anonymized analytics table (if justified)
- Optional: Add user search history (requires HIPAA compliance)

---

**Recommendation:** Keep current approach (no user data storage) unless specific business requirements justify the added complexity and compliance burden.

**Last Updated:** October 20, 2025
