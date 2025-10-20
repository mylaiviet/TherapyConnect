# Comprehensive Database Seeding Instructions

## Overview
The comprehensive seed script creates **2,000 therapist profiles** with complete data for all schema fields, including professional cartoon avatars.

## Features

### Data Distribution
- **2,000 total therapists**
- **600 therapists in Texas** (30%)
- **1,400 therapists across other US states** (70%)
- **~600 virtual providers** with multi-state licenses (30%)

### Complete Data for All Fields

#### Core Information
- ✅ Full names, credentials, contact info
- ✅ Professional cartoon avatars (via DiceBear API)
- ✅ Street addresses, city, state, ZIP
- ✅ License types and numbers, NPI numbers
- ✅ Years in practice (2-35 years range)

#### Clinical Details
- ✅ 3-6 specialties per therapist from full list
- ✅ Session types (individual, couples, family, group)
- ✅ Modalities (in-person, virtual, phone)
- ✅ Age groups served
- ✅ Insurance providers accepted (2-6 per therapist)
- ✅ Session fees ($80-250 range)

#### NEW Schema Fields - All Populated!

**Phase 1: Core Matching**
- ✅ Gender identity
- ✅ Date of birth
- ✅ Race/ethnicity (1-2 selections)
- ✅ Religious orientation
- ✅ Certifications (1-4 from official list)
- ✅ Theoretical orientation (CBT, DBT, Psychodynamic, etc.)
- ✅ Years since graduation
- ✅ Session length options (2-4 options: 30, 45, 60, 90 min)
- ✅ Current waitlist (60% available immediately, others 1-8 weeks)

**Phase 2: Accessibility**
- ✅ Wheelchair accessible (40% yes)
- ✅ Parking available (70% yes)
- ✅ Public transit nearby (60% yes)
- ✅ Elevators available (50% yes)
- ✅ ASL capable (15% yes)
- ✅ Closed captioning (30% yes)
- ✅ Service animal friendly (80% yes)
- ✅ Gender-neutral restrooms (30% yes)
- ✅ Virtual platforms (Zoom, Doxy.me, etc. for virtual providers)

**Phase 3: Financial**
- ✅ Sliding scale fees (50% offer)
- ✅ Free consultation offered (60% yes)
- ✅ Superbill provided (70% yes)
- ✅ FSA/HSA accepted (80% yes)
- ✅ Credit cards accepted (95% yes)
- ✅ Online payment options

**Phase 4: Professional Development**
- ✅ Board certifications
- ✅ Clinical supervisor status (30% yes)
- ✅ Accepts interns (25% yes)
- ✅ Additional states licensed (for virtual providers)
- ✅ Professional memberships
- ✅ Publications count
- ✅ Conference presentations
- ✅ Awards

#### Multi-State Licenses
Virtual providers have licenses in 2-3 states, common combinations:
- TX, CA, NY
- TX, FL, GA
- CA, NY, IL
- TX, CO, WA
- FL, NC, VA
- TX, AZ, NM

## Running the Seed

### Prerequisites
1. Database must be running (Docker PostgreSQL)
2. Migrations must be applied (`npm run db:push`)

### Execute Comprehensive Seed

```bash
npm run db:seed:full
```

### What Happens
1. **Cleans existing data** - Removes all existing therapists and their user accounts
2. **Creates 2,000 profiles** - In batches of 50 for performance
3. **Progress updates** - Shows progress every 50 therapists
4. **Avatar generation** - Creates unique cartoon avatar for each therapist
5. **Complete in ~2-3 minutes**

### Expected Output

```
🌱 Starting comprehensive database seeding...

🧹 Cleaning existing therapist data...
✅ Existing data cleaned

📊 Creating 2000 therapists:
   - 600 in Texas (30%)
   - 1400 in other states (70%)

   ✓ Created 50/2000 therapists...
   ✓ Created 100/2000 therapists...
   ✓ Created 150/2000 therapists...
   ...
   ✓ Created 2000/2000 therapists...

✅ Successfully created 2000 therapist profiles!
   📸 All profiles have professional cartoon avatars
   🌐 600 virtual providers with multi-state licenses
   🏥 600 therapists in Texas
   ✨ All new schema fields populated

🎉 Comprehensive seeding complete!
```

## Verifying the Data

### Check Total Count
```sql
SELECT COUNT(*) FROM therapists WHERE profile_status = 'approved';
-- Should return: 2000
```

### Check Texas Therapists
```sql
SELECT COUNT(*) FROM therapists WHERE state = 'TX';
-- Should return: ~600
```

### Check Virtual Providers with Multi-State
```sql
SELECT COUNT(*) FROM therapists
WHERE array_length(additional_states_licensed, 1) > 1;
-- Should return: ~420 (70% of 600 virtual providers)
```

### Check New Fields Populated
```sql
SELECT
  COUNT(*) FILTER (WHERE gender IS NOT NULL) as has_gender,
  COUNT(*) FILTER (WHERE certifications IS NOT NULL) as has_certifications,
  COUNT(*) FILTER (WHERE session_length_options IS NOT NULL) as has_session_lengths,
  COUNT(*) FILTER (WHERE wheelchair_accessible = true) as wheelchair_count,
  COUNT(*) FILTER (WHERE consultation_offered = true) as consultation_count
FROM therapists;
```

### Sample Therapist Profile
```sql
SELECT
  first_name, last_name, city, state,
  gender, certifications, session_length_options,
  wheelchair_accessible, consultation_offered,
  additional_states_licensed,
  photo_url
FROM therapists
LIMIT 1;
```

## Avatar URLs
All therapist avatars use the DiceBear Avataaars style:
- **Format**: `https://api.dicebear.com/7.x/avataaars/svg?seed={FullName}&backgroundColor=b6e3f4`
- **Style**: Professional cartoon characters
- **Unique**: Each therapist gets a unique avatar based on their name
- **Consistent**: Same name always generates same avatar

## Testing the UI

After seeding, test the search:

1. **Search by Location**
   - Try "Houston, TX" - Should show ~80-100 therapists
   - Try "Denver, CO" - Should show ~30-40 therapists

2. **Test New Filters**
   - Gender filter
   - Certifications
   - Session lengths
   - Accessibility features
   - Financial options

3. **Virtual Providers**
   - Filter by "Virtual" session type
   - Check multi-state licenses in profiles

4. **Profile Viewing**
   - Click any therapist
   - Verify cartoon avatar loads
   - Check all new fields display correctly

## Troubleshooting

### "Database connection refused"
- Make sure Docker PostgreSQL is running
- Check DATABASE_URL in .env file

### "Table does not exist"
- Run migrations first: `npm run db:push`

### "Seeding takes too long"
- Normal for 2,000 records (2-3 minutes)
- Runs in batches of 50 for better performance

### "Some fields are null"
- Some fields intentionally null based on probabilities
- Example: Only 15% have ASL capability
- Check the seed script for probability values

## Quick Seed (Original)
For faster testing with fewer therapists:
```bash
npm run db:seed
```
Creates ~30 therapists without all the new features.

---

**Note**: This seed creates realistic, diverse data for comprehensive testing of all platform features including the new matching algorithm enhancements.
