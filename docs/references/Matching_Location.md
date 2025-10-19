Here's a concise development prompt for implementing ZIP code database with fuzzy city name matching:

---

**Development Prompt: ZIP Code Database with Fuzzy City Name Matching**

Implement a location input system that supports both ZIP codes and city names with misspelling tolerance:

**Database Setup:**
1. Download a US ZIP code CSV from GitHub (search "simplemaps US zip codes" or "unitedstates/zipcodes")
2. Create database table:
```sql
CREATE TABLE zip_codes (
  zip VARCHAR(5) PRIMARY KEY,
  city VARCHAR(100),
  state VARCHAR(2),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  county VARCHAR(100),
  INDEX idx_city (city),
  INDEX idx_state (state)
);
```
3. Import CSV data using bulk import tool

**Location Input Feature:**
Create a single search field that accepts EITHER:
- ZIP code (exact match - fast lookup)
- City name (with fuzzy matching for misspellings)

**Fuzzy Matching Implementation:**
Use Levenshtein distance algorithm for city name matching with these parameters:
- Match threshold: 80% similarity (adjustable based on testing)
- Return top 3-5 closest matches if no exact match found
- Present user with dropdown: "Did you mean: [Boston, Easton, Weston]?"

**Recommended Libraries:**
- **Python backend**: Use `fuzzywuzzy` or `rapidfuzz` library
  ```python
  from fuzzywuzzy import process
  user_input = "Bostn"
  matches = process.extract(user_input, city_list, limit=5)
  ```
- **JavaScript frontend**: Use `fuse.js` for client-side fuzzy search
- **SQL approach**: Use SOUNDEX() or LEVENSHTEIN() functions if your database supports them

**User Experience Flow:**
1. User types "Bostn" (misspelling)
2. System performs fuzzy match against city names in database
3. Show dropdown with suggestions: "Did you mean: Boston, MA?"
4. User selects correct city
5. System returns all ZIP codes for that city
6. Store selected ZIP code for therapist proximity matching

**Performance Optimization:**
- Cache common city names and their fuzzy variants
- Use indexed lookups for exact ZIP code matches (instant)
- Only trigger fuzzy matching after 3+ characters typed
- Limit fuzzy search to cities within detected/selected state (reduces search space)

**Error Handling:**
- If confidence score < 60%, show message: "City not found. Please check spelling or try entering your ZIP code instead."
- Always provide ZIP code as fallback option

**Output:**
Return standardized location object:
```json
{
  "zip": "02101",
  "city": "Boston",
  "state": "MA",
  "latitude": 42.3601,
  "longitude": -71.0589
}
```

This approach provides a lightweight, user-friendly location input that handles both precise ZIP codes and misspelled city names without external API dependencies.
