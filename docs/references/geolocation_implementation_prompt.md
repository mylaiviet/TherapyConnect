# Geolocation Implementation Prompt for AI Coding Assistant

## PROJECT CONTEXT

I'm building a behavioral health provider and patient matching platform. I need you to implement automatic user location detection to match patients with nearby therapists.

## TECH STACK REQUIREMENTS

**Analyze the existing codebase and use the current tech stack already implemented in this application.** Identify:
- Backend framework (Flask, Express, Django, FastAPI, etc.)
- Frontend framework (React, Vue, Angular, vanilla JS, etc.)
- Database (PostgreSQL, MySQL, MongoDB, etc.)
- Any existing architecture patterns (REST API, GraphQL, microservices, etc.)

**If no existing codebase:** Choose the most appropriate modern stack based on best practices for a healthcare matching platform. Justify your choices.

## TECHNICAL REQUIREMENTS

Build a complete geolocation system using **FREE and OPEN-SOURCE tools only**. Implement both methods described below with a hybrid fallback approach.

### METHOD 1: Browser Geolocation API (Frontend - Primary)

Create a JavaScript/TypeScript module that:
- Uses the HTML5 Geolocation API (navigator.geolocation.getCurrentPosition)
- Requests high-accuracy location with these options:
  - `enableHighAccuracy: true`
  - `timeout: 5000ms`
  - `maximumAge: 0`
- Captures latitude, longitude, and accuracy
- Implements proper error handling for:
  - `PERMISSION_DENIED`
  - `POSITION_UNAVAILABLE`
  - `TIMEOUT`
- Falls back to IP geolocation if user denies permission
- Sends coordinates to backend API endpoint `/api/find-therapists`
- Displays user-friendly status messages during location detection
- Integrates with existing frontend component structure

### METHOD 2: IP Geolocation (Backend - Fallback)

Implement using **MaxMind GeoLite2** (free, open-source):

**Requirements:**
- Install appropriate library for your backend language:
  - Python: `geoip2` library
  - Node.js: `maxmind` library
  - PHP: `geoip2/geoip2` library
  - Java: `maxmind-geoip2` library
- Download MaxMind GeoLite2-City.mmdb database
  - Instructions: Sign up at https://www.maxmind.com/en/geolite2/signup
  - Free account required (no credit card)
- Store database file in appropriate data directory (e.g., `/data/GeoLite2-City.mmdb`)
- Create API endpoint `/api/ip-location` that:
  - Extracts user IP from request headers
  - Queries GeoLite2 database with user IP
  - Returns JSON with:
    ```json
    {
      "success": true,
      "location": {
        "country": "United States",
        "country_code": "US",
        "region": "California",
        "city": "San Francisco",
        "postal_code": "94102",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "timezone": "America/Los_Angeles"
      }
    }
    ```
  - Handles `AddressNotFoundError` gracefully
  - Returns 404 if IP not found in database
  - Includes proper error logging

**ALTERNATIVE OPTION: IP2Location LITE Database**

If you prefer a MySQL/PostgreSQL-based approach instead of MaxMind:
- Download IP2LOCATION-LITE-DB9.CSV from https://lite.ip2location.com
- Create database table with schema:
  ```sql
  ip_from INT/BIGINT UNSIGNED
  ip_to INT/BIGINT UNSIGNED
  country_code CHAR(2)
  country_name VARCHAR(64)
  region_name VARCHAR(128)
  city_name VARCHAR(128)
  latitude DECIMAL(10, 8)
  longitude DECIMAL(11, 8)
  zip_code VARCHAR(30)
  ```
- Load CSV data into database
- Create IP-to-integer conversion function
- Query using: `WHERE ip_from <= user_ip_int AND ip_to >= user_ip_int`
- Add index on `ip_to` for performance

### METHOD 3: Hybrid Implementation (Critical)

Create a unified location detection flow:

1. **On page load:** Automatically attempt IP geolocation (no permission required)
2. **Display:** Show therapists based on city-level IP location
3. **User action:** Show prominent button "Find Therapists Near Me (More Accurate)"
4. **On click:** Request Browser Geolocation API permission with privacy explanation
5. **If granted:** Update results with precise GPS coordinates (accurate to street level)
6. **If denied:** Keep showing IP-based results (city-level accuracy)
7. **Persistent:** Remember user's location preference in session/local storage

## API ENDPOINTS TO CREATE

### POST /api/find-therapists

**Input:**
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "accuracy": 20,
  "radius_miles": 25,
  "specialties": ["anxiety", "depression"],
  "insurance": ["Blue Cross", "Aetna"]
}
```

**Output:**
```json
{
  "success": true,
  "therapists": [
    {
      "id": "123",
      "name": "Dr. Jane Smith",
      "specialty": ["anxiety", "PTSD"],
      "distance_miles": 2.3,
      "latitude": 37.7849,
      "longitude": -122.4094,
      "address": "123 Main St, San Francisco, CA",
      "rating": 4.8,
      "accepting_new_patients": true
    }
  ],
  "count": 15,
  "radius": 25,
  "search_method": "gps"
}
```

**Logic:**
- Query therapist database using Haversine distance formula or PostGIS spatial functions
- Filter by specialties and insurance if provided
- Return therapists sorted by distance
- Include pagination (limit 20 per page)
- Cache results for 5 minutes per user session

### GET /api/ip-location

**Input:** Automatic from request IP address

**Output:**
```json
{
  "success": true,
  "method": "ip_geolocation",
  "location": {
    "country": "United States",
    "country_code": "US",
    "region": "California",
    "city": "San Francisco",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "timezone": "America/Los_Angeles",
    "accuracy": "city"
  }
}
```

**Logic:**
- Query GeoLite2 or IP2Location database
- Handle proxy/VPN detection
- Return approximate city-level coordinates

## DATABASE SCHEMA ADDITIONS

Add to `therapists` table (or create if doesn't exist):

```sql
-- Location fields
latitude DECIMAL(10, 8) NOT NULL
longitude DECIMAL(11, 8) NOT NULL
address VARCHAR(255)
city VARCHAR(100) NOT NULL
state_region VARCHAR(100) NOT NULL
country VARCHAR(100) DEFAULT 'United States'
postal_code VARCHAR(20)

-- Spatial index for fast distance queries
-- PostgreSQL: CREATE INDEX idx_therapist_location ON therapists USING GIST (ll_to_earth(latitude, longitude));
-- MySQL: CREATE SPATIAL INDEX idx_therapist_location ON therapists (latitude, longitude);
```

Add to `user_searches` table (optional - for analytics):

```sql
CREATE TABLE user_searches (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  search_latitude DECIMAL(10, 8),
  search_longitude DECIMAL(11, 8),
  location_method VARCHAR(20), -- 'gps' or 'ip'
  search_radius INT,
  results_count INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## DISTANCE CALCULATION

Implement **Haversine formula** for calculating distance between coordinates:

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1−a))
distance = Earth_radius × c
```

Constants:
- Earth radius = 3959 miles (6371 kilometers)

**For PostgreSQL:** Use built-in `earth_distance()` function with earthdistance extension

**For MySQL 8.0+:** Use `ST_Distance_Sphere()` function

**For other databases:** Implement Haversine in application code

## FRONTEND COMPONENTS TO BUILD

Integrate with existing component structure. Create/modify:

1. **LocationDetector** - Main geolocation module
   - Hook/Service/Utility based on frontend framework
   - Manages state for location data
   - Handles permission requests

2. **TherapistMap** (Optional but recommended)
   - Display therapists on interactive map
   - Use Leaflet.js (free) or Mapbox (free tier)
   - Show user location and therapist markers
   - Click marker to view therapist details

3. **LocationPermissionModal** - User consent UI
   - Explain why location is needed
   - Privacy assurance message
   - "Allow" and "Use City Instead" options
   - HIPAA compliance notice

4. **TherapistList** - Results display
   - Show distance from user
   - Sort by distance by default
   - Filter by specialty, insurance, availability
   - Pagination

5. **ManualLocationInput** - Fallback option
   - ZIP code or city/state entry
   - Geocode to coordinates using backend
   - Alternative if both auto methods fail

## PRIVACY & COMPLIANCE REQUIREMENTS

**Before requesting location, display:**
> "We use your location to find therapists near you. Your location is never stored permanently or shared with third parties. This helps us show you the most relevant providers in your area."

**Implementation requirements:**
- Store location data only in session storage, not database (unless user explicitly saves)
- Never share location with therapists until appointment is booked
- Log only aggregate location data (city-level) for analytics
- Include opt-out option for all location features
- Provide manual ZIP code entry as alternative
- HIPAA compliance: Location data is Protected Health Information (PHI) if linked to patient identity
- Implement audit logging for location access
- Add "Clear my location" button to delete stored data

**Privacy Policy additions needed:**
- Disclose use of IP geolocation and browser geolocation
- Explain MaxMind/IP2Location attribution requirement
- State data retention policy (session-only)
- Link to MaxMind privacy policy if using their service

## ERROR HANDLING

Implement comprehensive error handling:

**Browser Geolocation errors:**
- Timeout after 5 seconds → Fall back to IP geolocation
- Permission denied → Show privacy explanation, fall back to IP
- Position unavailable → Retry once, then fall back to IP
- Generic error → Log to error tracking, fall back to IP

**IP Geolocation errors:**
- IP not found in database → Request manual location entry
- Database file missing → Alert admin, show manual entry
- Corrupted database → Log error, show manual entry

**Backend API errors:**
- Database connection failure → Show maintenance message
- No therapists found in radius → Expand radius automatically (25 → 50 → 100 miles)
- Invalid coordinates → Validate and sanitize input

**Retry logic:**
- Max 3 attempts for IP lookups with exponential backoff
- Cache failed IPs for 1 hour to avoid repeated lookups
- Graceful degradation at each step

**User-facing messages:**
- "Detecting your location..." (loading)
- "Location access denied. Showing therapists in your city instead." (permission denied)
- "Unable to detect location. Please enter your ZIP code." (all methods failed)
- "Searching for therapists near you..." (processing)
- "Found 15 therapists within 25 miles" (success)

## TESTING REQUIREMENTS

Create test cases for:

**Location Detection:**
- [ ] Browser geolocation success (mock coordinates)
- [ ] Permission denial scenario
- [ ] Timeout scenario (>5 seconds)
- [ ] Position unavailable error
- [ ] IP geolocation with various IPs:
  - [ ] US IP (8.8.8.8)
  - [ ] International IP
  - [ ] Private IP (127.0.0.1)
  - [ ] Invalid IP format
- [ ] VPN/Proxy detection
- [ ] Mobile vs desktop browser differences

**API Endpoints:**
- [ ] POST /api/find-therapists with valid coordinates
- [ ] POST /api/find-therapists with invalid data
- [ ] GET /api/ip-location with known IP
- [ ] GET /api/ip-location with unknown IP
- [ ] Distance calculation accuracy (compare with Google Maps)
- [ ] Pagination functionality
- [ ] Filter by specialty and insurance

**Database:**
- [ ] Query performance with 1000+ therapists
- [ ] Spatial index effectiveness
- [ ] Distance sorting accuracy

**Integration:**
- [ ] Full user flow: page load → IP location → therapist list
- [ ] Full user flow: page load → request GPS → allow → updated results
- [ ] Full user flow: page load → request GPS → deny → IP fallback
- [ ] Session persistence across page refreshes

## FILE STRUCTURE TO CREATE

Adapt to existing project structure. Suggested organization:

```
/backend
  /api
    /routes
      - geolocation.{py|js|php}
      - therapists.{py|js|php}
    /services
      - geolocation_service.{py|js|php}
      - distance_calculator.{py|js|php}
    /models
      - therapist.{py|js|php}
  /data
    - GeoLite2-City.mmdb (download separately)
  /tests
    - test_geolocation.{py|js|php}
    - test_therapist_search.{py|js|php}
  - requirements.txt (Python) OR package.json (Node.js)

/frontend
  /src
    /components
      - LocationDetector.{jsx|vue|tsx}
      - TherapistList.{jsx|vue|tsx}
      - TherapistMap.{jsx|vue|tsx}
      - LocationPermissionModal.{jsx|vue|tsx}
      - ManualLocationInput.{jsx|vue|tsx}
    /hooks (React) OR /composables (Vue)
      - useGeolocation.{js|ts}
    /services
      - apiClient.{js|ts}
      - geolocationService.{js|ts}
    /utils
      - haversineDistance.{js|ts}
      - validators.{js|ts}
    /tests
      - LocationDetector.test.{js|ts}

/database
  /migrations
    - add_location_to_therapists.sql
    - create_user_searches_table.sql
    - add_spatial_indexes.sql

/docs
  - SETUP.md (GeoLite2 download instructions)
  - API.md (endpoint documentation)
  - PRIVACY.md (compliance notes)
```

## DELIVERABLES

Provide complete, production-ready code including:

1. ✅ Backend API with both endpoints (geolocation + therapist search)
2. ✅ Frontend components for hybrid location detection
3. ✅ Database migration scripts for therapist location columns and indexes
4. ✅ Distance calculation implementation (Haversine or PostGIS)
5. ✅ Comprehensive error handling and fallback logic
6. ✅ README.md with setup instructions including:
   - GeoLite2 account registration and download steps
   - Database setup commands
   - Environment variables needed
   - Running the application
7. ✅ .env.example file with all required variables:
   ```
   GEOIP_DATABASE_PATH=/path/to/GeoLite2-City.mmdb
   DATABASE_URL=postgresql://user:pass@localhost/dbname
   SESSION_SECRET=your_secret_key
   ```
8. ✅ Test cases for location detection and therapist search
9. ✅ Privacy policy template additions
10. ✅ Code comments explaining complex logic
11. ✅ API documentation (Swagger/OpenAPI optional but recommended)

## IMPORTANT CONSTRAINTS

- ✅ Use ONLY free and open-source solutions (no paid APIs)
- ✅ MaxMind GeoLite2 requires free account registration - include this in setup docs
- ✅ Database updates: GeoLite2 should be updated monthly
  - Include cron job example: `0 0 1 * * /scripts/update_geoip.sh`
- ✅ Attribution required: Add to footer or about page:
  - "IP geolocation by MaxMind" (if using GeoLite2)
  - "IP geolocation by IP2Location" (if using IP2Location)
- ✅ HIPAA compliance: Document PHI handling for healthcare context
- ✅ Performance: API response time < 500ms for location queries
- ✅ Scalability: Design to handle 10,000+ concurrent users
- ✅ Security: Validate and sanitize all user inputs
- ✅ Accessibility: Ensure location features work with screen readers

## IMPLEMENTATION STEPS

**Step 1: Analyze existing codebase**
- Identify current tech stack, architecture, and patterns
- Review existing API structure and authentication
- Check database schema and ORM/query builder in use

**Step 2: Backend - IP Geolocation**
- Set up GeoLite2 database download and storage
- Implement /api/ip-location endpoint
- Add IP extraction and validation logic
- Test with various IP addresses

**Step 3: Backend - Therapist Search**
- Add location columns to therapists table
- Implement distance calculation (Haversine or PostGIS)
- Create /api/find-therapists endpoint
- Add filtering and pagination

**Step 4: Frontend - Browser Geolocation**
- Create LocationDetector component/hook
- Implement permission request flow
- Add error handling and user feedback
- Test across browsers and devices

**Step 5: Frontend - Integration**
- Connect location detection to therapist search
- Build TherapistList component with distance display
- Add LocationPermissionModal for user consent
- Implement fallback to manual location entry

**Step 6: Testing & Optimization**
- Run all test cases
- Optimize database queries and add indexes
- Test performance under load
- Fix any bugs or edge cases

**Step 7: Documentation & Deployment**
- Complete all documentation
- Add privacy policy updates
- Create deployment guide
- Set up monitoring and error tracking

## GETTING STARTED

Begin by analyzing the existing codebase to understand the current tech stack. Then implement in this order:

1. Backend IP geolocation (Method 2)
2. Frontend browser geolocation (Method 1)  
3. Hybrid integration (Method 3)
4. Testing and refinement

Provide complete, production-ready code with detailed comments explaining each section. Use best practices for the identified tech stack.

---

## ADDITIONAL NOTES

- If existing codebase uses TypeScript, write all code in TypeScript with proper type definitions
- If existing codebase has authentication, integrate with current auth system
- If existing codebase has state management (Redux, Vuex, etc.), use that pattern
- Follow existing code style, linting rules, and naming conventions
- Reuse existing utilities and helper functions where applicable
- Integrate with existing error tracking (Sentry, Bugsnag, etc.) if present

---

## QUESTIONS TO ASK BEFORE STARTING

1. What is the current tech stack (backend framework, frontend framework, database)?
2. Is there existing authentication? How are sessions managed?
3. Are there existing API patterns I should follow (REST, GraphQL)?
4. What is the deployment environment (AWS, Heroku, Docker, etc.)?
5. Are there existing therapist records in the database I can work with?
6. What is the expected scale (users per day, therapist count)?

**If you cannot analyze existing code, choose a modern, production-ready stack and document your choices.**
