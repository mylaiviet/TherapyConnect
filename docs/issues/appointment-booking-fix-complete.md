# Appointment Booking System - Complete Fix Documentation

**Date**: October 20, 2025
**Status**: ✅ RESOLVED
**Severity**: Critical - Core booking functionality was completely broken

---

## Issue Summary

The appointment booking calendar was not displaying available time slots for therapists, even when therapists had configured their availability. Users would select dates on the calendar and consistently see "No available appointments on this date. Please select another date."

### User Impact
- Patients unable to book appointments through the platform
- Booking calendar appeared functional but never showed available slots
- Complete failure of the appointment scheduling feature

---

## Root Cause Analysis

Two critical bugs were preventing the booking system from working:

### Bug #1: Timezone Issue in Day-of-Week Calculation
**Location**: [server/storage.ts:482-485](server/storage.ts#L482-L485)

**Problem**:
```typescript
// BROKEN CODE
const dateObj = new Date(date + 'T00:00:00');
const dayOfWeek = dateObj.getDay();
```

When parsing date strings like `"2025-10-24"` by appending `'T00:00:00'`, JavaScript interprets this timestamp in the **local timezone** rather than UTC. This caused the day-of-week calculation to be off by ±1 day depending on the server's timezone.

**Example**:
- Date string: `"2025-10-24"` (October 24, 2025 - a Friday)
- With `new Date(date + 'T00:00:00')`: Creates `2025-10-24T05:00:00.000Z` in EST (UTC-5)
- Calling `.getDay()`: Returns 5 (Friday) ❌ (but interprets in local timezone)
- Expected: Should consistently return day 5 for Friday across all timezones

In some timezones, this would shift the date by one day, causing Thursday to be interpreted as Friday, Wednesday as Thursday, etc., resulting in availability checks failing.

### Bug #2: Wrong Therapist ID Passed to Booking Component
**Location**: [client/src/pages/therapist-profile.tsx:401](client/src/pages/therapist-profile.tsx#L401)

**Problem**:
```typescript
// BROKEN CODE
<BookingCalendar
  therapistId={therapist.userId}  // Using user ID instead of therapist ID
  therapistName={`${therapist.firstName} ${therapist.lastName}`}
/>
```

The component was passing `therapist.userId` (the foreign key to the users table) instead of `therapist.id` (the primary key of the therapists table). The API endpoint `/api/therapists/:id/available-slots` expects the therapist's database ID, not the user ID.

**Impact**: The availability query was looking up the wrong therapist or no therapist at all, always returning empty results.

---

## Investigation Process

### Initial Diagnosis Steps
1. ✅ Verified database has therapist availability data populated
2. ✅ Confirmed therapist records have `availableDays` and `availableTimes` arrays
3. ✅ Tested API endpoint directly with curl
4. ✅ Examined date parsing and day-of-week calculation logic
5. ✅ Traced component props and data flow

### Key Diagnostic Commands Used
```bash
# Check therapist availability in database
docker exec karematch-db psql -U postgres -d karematch -c \
  "SELECT id, first_name, last_name, available_days, available_times
   FROM therapists WHERE first_name = 'Michelle' AND last_name = 'Morris';"

# Test API endpoint directly
curl "http://localhost:5000/api/therapists/9e0d5fa3-5b61-4d50-a078-530685f0ebbf/available-slots?date=2025-10-22"

# Debug date parsing
node -e "
const [year, month, day] = '2025-10-24'.split('-').map(Number);
const dateObj = new Date(Date.UTC(year, month - 1, day));
console.log('Day:', dateObj.getUTCDay());
"
```

---

## Attempted Fixes (That Did Not Work)

### Attempt #1: Server Restart
**Hypothesis**: Hot-reload wasn't picking up changes
**Result**: ❌ Did not fix the issue
**Reason**: The bugs were in the code logic, not runtime state

### Attempt #2: Checking for Existing Appointments Conflict
**Hypothesis**: Maybe existing appointments were blocking all slots
**Result**: ❌ Not the issue
**Reason**: Database had no conflicting appointments

### Attempt #3: Verifying Blocked Time Slots
**Hypothesis**: Maybe blocked time slots were preventing availability
**Result**: ❌ Not the issue
**Reason**: No blocked time entries in the database

### Attempt #4: Checking Data Population
**Hypothesis**: Maybe seed data wasn't populating availability correctly
**Result**: ❌ Data was correct in the database
**Reason**: Running database queries confirmed `availableDays` and `availableTimes` were properly populated

---

## The Solution (What Actually Worked)

### Fix #1: UTC-Based Date Parsing
**Location**: [server/storage.ts:482-485](server/storage.ts#L482-L485)

**Before**:
```typescript
// Get the day of week (0 = Sunday, 1 = Monday, etc.)
const dateObj = new Date(date + 'T00:00:00');
const dayOfWeek = dateObj.getDay();
```

**After**:
```typescript
// Get the day of week (0 = Sunday, 1 = Monday, etc.)
// Parse date as UTC to avoid timezone issues
const [year, month, day] = date.split('-').map(Number);
const dateObj = new Date(Date.UTC(year, month - 1, day));
const dayOfWeek = dateObj.getUTCDay();
```

**Why This Works**:
- Explicitly parses year, month, day components from the ISO date string
- Uses `Date.UTC()` to create a date in UTC timezone
- Uses `.getUTCDay()` instead of `.getDay()` for timezone-independent day calculation
- Ensures consistent behavior across all server timezones

### Fix #2: Correct Therapist ID
**Location**: [client/src/pages/therapist-profile.tsx:401](client/src/pages/therapist-profile.tsx#L401)

**Before**:
```typescript
<BookingCalendar
  therapistId={therapist.userId}
  therapistName={`${therapist.firstName} ${therapist.lastName}`}
/>
```

**After**:
```typescript
<BookingCalendar
  therapistId={therapist.id}
  therapistName={`${therapist.firstName} ${therapist.lastName}`}
/>
```

**Why This Works**:
- Passes the correct primary key `therapist.id` to the booking component
- API endpoint can now correctly look up the therapist's availability data
- Query returns actual availability slots instead of empty array

---

## Verification & Testing

### Test Case: Michelle Morris (Therapist ID: 9e0d5fa3-5b61-4d50-a078-530685f0ebbf)

**Availability Configuration**:
- **Days**: Saturday, Sunday, Wednesday
- **Times**: Morning (8 AM - 12 PM), Afternoon (12 PM - 5 PM), Evening (5 PM - 9 PM)
- **Location**: Brownsville, TX

**Test Results**:

| Date | Day of Week | Expected Behavior | Actual Result | Status |
|------|-------------|-------------------|---------------|--------|
| 2025-10-22 | Wednesday | Show 13 slots (8 AM - 9 PM) | ✅ Returns 13 slots | PASS |
| 2025-10-23 | Thursday | No slots (not available) | ✅ Returns empty array | PASS |
| 2025-10-24 | Friday | No slots (not available) | ✅ Returns empty array | PASS |
| 2025-10-25 | Saturday | Show 13 slots | ✅ Returns 13 slots | PASS |
| 2025-10-26 | Sunday | Show 13 slots | ✅ Returns 13 slots | PASS |

**Sample API Response** (October 22, 2025 - Wednesday):
```json
[
  {"time":"08:00","available":true,"duration":60},
  {"time":"09:00","available":true,"duration":60},
  {"time":"10:00","available":true,"duration":60},
  {"time":"11:00","available":true,"duration":60},
  {"time":"12:00","available":true,"duration":60},
  {"time":"13:00","available":true,"duration":60},
  {"time":"14:00","available":true,"duration":60},
  {"time":"15:00","available":true,"duration":60},
  {"time":"16:00","available":true,"duration":60},
  {"time":"17:00","available":true,"duration":60},
  {"time":"18:00","available":true,"duration":60},
  {"time":"19:00","available":true,"duration":60},
  {"time":"20:00","available":true,"duration":60}
]
```

---

## Files Modified

1. **[server/storage.ts](server/storage.ts)**
   - Function: `getAvailableSlots()`
   - Lines: 482-485
   - Change: Fixed timezone-dependent date parsing

2. **[client/src/pages/therapist-profile.tsx](client/src/pages/therapist-profile.tsx)**
   - Component: `TherapistProfile`
   - Line: 401
   - Change: Corrected therapist ID prop

---

## Lessons Learned

### 1. Always Use UTC for Date Calculations
When working with dates across different timezones, always:
- Parse dates explicitly using `Date.UTC()`
- Use UTC methods (`.getUTCDay()`, `.getUTCHours()`, etc.)
- Never rely on local timezone interpretation for business logic

### 2. Verify Data Types and IDs
When passing IDs between components:
- Ensure you're using the correct primary key, not foreign keys
- Add TypeScript type checking to catch these errors at compile time
- Use meaningful variable names (`therapistId` vs `userId`)

### 3. Test with Real Data
Database queries during debugging revealed:
- Actual data structure in the database
- Discrepancies between UI display and stored data
- Helped identify the wrong ID being used

### 4. Debug at Multiple Levels
The fix required debugging across:
- Database layer (verify data exists)
- API layer (test endpoints directly)
- Application logic (date parsing)
- Component props (correct ID passing)

---

## Related Documentation

- [Database Schema](../architecture/DATABASE_SCHEMA.md)
- [Custom Scheduling Plan](../features/CUSTOM_SCHEDULING_PLAN.md)
- [Scheduling Deployment Guide](../features/SCHEDULING_DEPLOYMENT_GUIDE.md)

---

## Status

✅ **RESOLVED** - Both fixes deployed and tested
📅 **Date Fixed**: October 20, 2025
👤 **Fixed By**: Claude (AI Assistant)
🔍 **Verified By**: API testing and manual verification

The appointment booking system is now fully functional and correctly displays available time slots based on therapist availability configuration.
