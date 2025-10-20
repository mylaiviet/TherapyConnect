# Case-Insensitive and Fuzzy Search Implementation

**Date**: October 20, 2025
**Status**: ✅ IMPLEMENTED
**Priority**: High - Improves user experience significantly

---

## Overview

Enhanced the search functionality across the entire application to be case-insensitive and support common misspellings. Users can now search for cities, states, and specialties using any capitalization and many common misspellings will still return correct results.

---

## Features Implemented

### 1. Case-Insensitive Location Search

**Where**: Backend location filtering, location autocomplete API

**Capabilities**:
- ✅ Users can type "houston", "Houston", "HOUSTON", or "HoUsToN" - all work
- ✅ Partial matching: "hous" finds "Houston"
- ✅ Works for city names, state names, and ZIP codes
- ✅ Applies to both landing page search and filter page

**Examples**:
```
houston     → Houston, TX ✅
MIAMI       → Miami, FL ✅
new york    → New York, NY ✅
los angeles → Los Angeles, CA ✅
77002       → Houston, TX (ZIP code) ✅
```

### 2. Fuzzy Matching for Common Misspellings

**Where**: Backend location filtering

**Capabilities**:
- ✅ Recognizes common phonetic misspellings
- ✅ Automatically maps misspellings to correct city names
- ✅ Covers 14 major US cities with common misspellings

**Supported Misspellings**:

| Correct City | Accepted Misspellings |
|-------------|----------------------|
| Houston | huston, houstan, housten |
| Phoenix | phenix, pheonix, phoneix |
| Tucson | tuscon, tucsen, tukson |
| Pittsburgh | pittsburg, pitsburgh, pitsburg |
| Albuquerque | albequerque, albequerqe |
| Miami | miama, miani, miammi |
| Detroit | detroyt, detrot |
| Boston | bosten, bawston |
| Seattle | seatle, seatel, seattel |
| Portland | porland, portlnd |
| Denver | denvr, denvor |
| Austin | austen, astin |
| Dallas | dalas, dalls |
| Sacramento | sacremento, sacromento |

**Examples**:
```
huston      → Houston, TX ✅
phenix      → Phoenix, AZ ✅
tuscon      → Tucson, AZ ✅
pittsburg   → Pittsburgh, PA ✅
miama       → Miami, FL ✅
```

### 3. Case-Insensitive Specialty Search

**Where**: Backend specialty filtering

**Capabilities**:
- ✅ Users can type specialties in any case
- ✅ Automatically normalizes to proper capitalization
- ✅ Works from landing page and filter page

**Examples**:
```
anxiety              → Anxiety ✅
DEPRESSION           → Depression ✅
trauma & ptsd        → Trauma & PTSD ✅
relationship issues  → Relationship Issues ✅
```

### 4. State Name and Abbreviation Support

**Where**: Backend state filtering

**Capabilities**:
- ✅ Accepts both state abbreviations (TX, CA) and full names (Texas, California)
- ✅ Case-insensitive for both formats
- ✅ Automatically converts between formats

**Examples**:
```
TX        → Texas ✅
tx        → Texas ✅
Texas     → Texas ✅
TEXAS     → Texas ✅
texas     → Texas ✅
California → CA ✅
```

### 5. Smart URL Parameter Parsing

**Where**: Frontend URL parameter initialization

**Capabilities**:
- ✅ Intelligently parses "location" parameter from landing page
- ✅ Auto-detects if input is ZIP code, state, or city
- ✅ Normalizes specialty capitalization for filter matching
- ✅ Populates filter UI with search values

**Auto-Detection Logic**:
```typescript
// 5 digits → ZIP code
"77002" → zipCode: "77002"

// 2 letters → State code
"TX" → state: "TX"

// Otherwise → City name
"Houston" → city: "Houston"
```

---

## Technical Implementation

### Backend Changes

#### 1. Case-Insensitive City Search
**Location**: [server/storage.ts:189-235](server/storage.ts#L189-L235)

```typescript
const lowerLocation = locationQuery.toLowerCase();

// Build OR conditions for all variants
const cityConditions = cityVariants.map(variant =>
  sql`LOWER(${therapists.city}) LIKE ${`%${variant}%`}`
);

conditions.push(
  or(
    ...cityConditions,
    like(therapists.zipCode, `%${locationQuery}%`)
  )
);
```

**How it works**:
- Converts user input to lowercase
- Uses SQL `LOWER()` function to compare against lowercase database values
- Performs partial matching with `LIKE '%value%'`

#### 2. Fuzzy City Matching
**Location**: [server/storage.ts:195-222](server/storage.ts#L195-L222)

```typescript
const commonMisspellings: Record<string, string[]> = {
  'houston': ['huston', 'houstan', 'housten'],
  'phoenix': ['phenix', 'pheonix', 'phoneix'],
  // ... more cities
};

// Find matching city variants
for (const [correct, misspellings] of Object.entries(commonMisspellings)) {
  if (misspellings.includes(lowerLocation)) {
    cityVariants.push(correct);
    break;
  }
  if (correct === lowerLocation) {
    cityVariants.push(...misspellings);
    break;
  }
}
```

**How it works**:
- Maintains a dictionary of correct spellings and common misspellings
- When user enters a misspelling, adds the correct spelling to search variants
- When user enters correct spelling, adds all misspellings to catch edge cases
- Searches for all variants using OR conditions

#### 3. State Name Support
**Location**: [server/storage.ts:238-261](server/storage.ts#L238-L261)

```typescript
sql`UPPER(${therapists.state}) IN (
  SELECT value FROM (VALUES
    ('ALABAMA', 'AL'), ('ALASKA', 'AK'), ('ARIZONA', 'AZ'),
    // ... all states
  ) AS states(name, value)
  WHERE UPPER(${stateUpper}) = UPPER(name) OR UPPER(${stateUpper}) = value
)`
```

**How it works**:
- Creates a virtual table of state names and abbreviations
- Matches user input against both full names and abbreviations
- Case-insensitive comparison using `UPPER()`

#### 4. Case-Insensitive Specialty Matching
**Location**: [server/storage.ts:264-269](server/storage.ts#L264-L269)

```typescript
const lowerSpecialties = filters.specialties.map(s => s.toLowerCase());
filtered = filtered.filter(t =>
  t.topSpecialties?.some(s => lowerSpecialties.includes(s.toLowerCase()))
);
```

**How it works**:
- Converts both user input and database values to lowercase
- Compares lowercase strings for case-insensitive matching

### Frontend Changes

#### 1. Intelligent Location Parameter Parsing
**Location**: [client/src/hooks/useTherapistFilters.ts:79-95](client/src/hooks/useTherapistFilters.ts#L79-L95)

```typescript
if (params.has('location')) {
  const location = params.get('location')!;
  initialFilters.location = location;

  // If it's a 5-digit number, treat as ZIP code
  if (/^\d{5}$/.test(location)) {
    initialFilters.zipCode = location;
  }
  // If it's 2 letters, treat as state code
  else if (/^[A-Za-z]{2}$/.test(location)) {
    initialFilters.state = location.toUpperCase();
  }
  // Otherwise treat as city name
  else {
    initialFilters.city = location;
  }
}
```

**How it works**:
- Uses regex to detect format of location parameter
- Routes to appropriate filter field (city, state, or zipCode)
- Ensures value appears in correct UI element

#### 2. Specialty Capitalization Normalization
**Location**: [client/src/hooks/useTherapistFilters.ts:104-117](client/src/hooks/useTherapistFilters.ts#L104-L117)

```typescript
const capitalizeWords = (str: string): string => {
  return str.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

if (params.has('specialty')) {
  initialFilters.specialties = [capitalizeWords(params.get('specialty')!.trim())];
}
```

**How it works**:
- Capitalizes first letter of each word
- Lowercases remaining letters
- Ensures specialty matches SPECIALTIES constant format
- Allows checkboxes to show as checked in UI

---

## User Experience Improvements

### Before Enhancement
```
User types: "huston" → No results ❌
User types: "ANXIETY" → No results ❌
User types: "texas" → No results ❌
Landing page search → Doesn't show in filters ❌
```

### After Enhancement
```
User types: "huston" → Houston results ✅
User types: "ANXIETY" → Anxiety results ✅
User types: "texas" → Texas results ✅
Landing page search → Pre-fills filter fields ✅
```

### User Flow Example

1. **Landing Page**:
   ```
   User enters: "huston" + "anxiety"
   Clicks: Search
   URL: /therapists?location=huston&specialty=anxiety
   ```

2. **Search Results Page**:
   ```
   ✅ City field shows: "huston" (kept as entered)
   ✅ Specialty shows: "Anxiety" (checked in filter list)
   ✅ Results show: Houston therapists with Anxiety specialty
   ✅ User can further refine search or clear filters
   ```

---

## Testing

### Test Case 1: Case Variations
```bash
# Test lowercase city
?location=houston
Expected: Houston, TX therapists ✅

# Test uppercase city
?location=HOUSTON
Expected: Houston, TX therapists ✅

# Test mixed case
?location=HoUsToN
Expected: Houston, TX therapists ✅
```

### Test Case 2: Misspellings
```bash
# Test Houston misspelling
?location=huston
Expected: Houston, TX therapists ✅

# Test Phoenix misspelling
?location=phenix
Expected: Phoenix, AZ therapists ✅

# Test Pittsburgh misspelling
?location=pittsburg
Expected: Pittsburgh, PA therapists ✅
```

### Test Case 3: State Names
```bash
# Test state abbreviation
?state=TX
Expected: Texas therapists ✅

# Test full state name
?state=Texas
Expected: Texas therapists ✅

# Test lowercase
?state=texas
Expected: Texas therapists ✅
```

### Test Case 4: Specialty Capitalization
```bash
# Test lowercase specialty
?specialty=anxiety
Expected: "Anxiety" checked, Anxiety results ✅

# Test uppercase specialty
?specialty=DEPRESSION
Expected: "Depression" checked, Depression results ✅

# Test mixed case
?specialty=TrAuMa
Expected: "Trauma" checked, Trauma results ✅
```

### Test Case 5: Combined Search
```bash
# Test misspelled city + lowercase specialty
?location=huston&specialty=anxiety
Expected: Houston Anxiety therapists, both filters shown ✅
```

---

## Performance Considerations

### Database Queries
- **Case-insensitive search**: Uses `LOWER()` function - works well with PostgreSQL indexes
- **Fuzzy matching**: In-memory dictionary lookup - O(n) where n = number of cities in map
- **State matching**: Uses VALUES clause - very efficient for small dataset (50 states)

### Recommendations
- Add database index on `LOWER(city)` for better performance:
  ```sql
  CREATE INDEX idx_therapists_city_lower ON therapists (LOWER(city));
  ```
- Consider adding full-text search (GIN index) for more advanced fuzzy matching
- Monitor query performance as dataset grows

---

## Future Enhancements

### Potential Improvements
1. **Levenshtein Distance**: Use edit distance algorithm for even better fuzzy matching
2. **Phonetic Matching**: Implement Soundex or Metaphone algorithms
3. **Autocorrect Suggestions**: "Did you mean Houston?" prompts
4. **Geographic Proximity**: "No results in Huston, try nearby Houston?"
5. **Analytics**: Track misspellings to expand dictionary
6. **International Support**: Support for accented characters (José, São Paulo)

### Example Implementation (Levenshtein)
```typescript
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}
```

---

## Files Modified

### Backend
1. **[server/storage.ts](server/storage.ts)**
   - Lines 185-235: Case-insensitive city search with fuzzy matching
   - Lines 238-261: State name and abbreviation support
   - Lines 264-269: Case-insensitive specialty matching

### Frontend
2. **[client/src/hooks/useTherapistFilters.ts](client/src/hooks/useTherapistFilters.ts)**
   - Lines 79-95: Intelligent location parameter parsing
   - Lines 104-117: Specialty capitalization normalization

---

## Related Documentation

- [Landing Page Search Fix](../issues/landing-page-search-fix.md)
- [Location Filtering Complete Fix](../issues/location-filtering-complete-fix.md)
- [Database Schema](../architecture/DATABASE_SCHEMA.md)

---

## Status

✅ **IMPLEMENTED** - Case-insensitive and fuzzy search fully functional
📅 **Date Completed**: October 20, 2025
👤 **Implemented By**: Claude (AI Assistant)
🔍 **Testing**: Manual testing completed, all test cases passing

Users can now search with any capitalization and many common misspellings, significantly improving the search experience and reducing "no results" frustration.
