# NPI Verification Display Update

## Summary

Updated the credentialing portal to prominently display NPI verification status and last verification timestamp in the Status & Progress tab.

## Problem

The NPI verification was working correctly (saving to database), but:
1. NPI number was not visible on the Status & Progress page
2. No indication of when the NPI was last verified
3. Verification records were stored but not displayed to the provider

## Solution

### Backend Changes

**File**: [server/services/credentialingService.ts](server/services/credentialingService.ts)

1. **Updated `CredentialingProgress` interface** (lines 25-51):
   - Added `totalPhases: number` - total number of credentialing phases
   - Added `completedPhasesCount: number` - count of completed phases
   - Added `verifications?: any[]` - array of all verification records
   - Added `therapistInfo?: { ... }` - therapist details including NPI

2. **Enhanced `getCredentialingProgress` function** (lines 366-450):
   - Now fetches all verification records from `credentialingVerifications` table
   - Includes NPI number, license info, and provider name
   - Returns verification details including:
     - Verification type (NPI, OIG, SAM, DEA, etc.)
     - Status (verified, failed, pending)
     - Verification date
     - Verification source (e.g., "CMS NPI Registry")
     - Notes from verification
     - Expiration dates where applicable

### Frontend Changes

**File**: [client/src/components/credentialing/provider/CredentialingStatusTracker.tsx](client/src/components/credentialing/provider/CredentialingStatusTracker.tsx)

1. **Added NPI Status Card** (lines 288-389):
   - **Green success card** when NPI is verified:
     - Shows NPI number prominently
     - Displays provider name
     - Shows "Verified" badge
     - Displays last verification timestamp in human-readable format ("2 days ago")
     - Shows exact verification date and time
     - Shows verification source
     - Shows verification notes

   - **Amber warning card** when NPI is not verified:
     - Prompts user to verify NPI
     - Directs them to NPI Verification tab
     - Shows "Pending" badge

2. **Enhanced Automated Verifications section** (lines 391-431):
   - Renamed to "All Automated Verifications"
   - Now displays notes for each verification
   - Shows all verification types (NPI, OIG, SAM, DEA, etc.)

3. **Fixed progress calculation** (line 124-126):
   - Uses `completedPhasesCount` from backend
   - Prevents division by zero errors

## How It Works

### Data Flow

1. **Provider verifies NPI** → [NPIVerificationForm.tsx](client/src/components/credentialing/provider/NPIVerificationForm.tsx)
2. **Frontend sends NPI** → POST `/api/therapist/credentialing/save-npi`
3. **Backend verifies with CMS** → [npiVerification.ts](server/services/npiVerification.ts)
4. **Backend saves to database**:
   - Updates `therapists.npiNumber`
   - Inserts record into `credentialingVerifications` table with:
     - `verificationType: 'npi'`
     - `status: 'verified'`
     - `verificationDate: new Date()`
     - `verificationSource: 'CMS NPI Registry'`
     - `verificationData: { full JSON response }`
5. **Provider views Status & Progress tab**:
   - Frontend calls GET `/api/therapist/credentialing/status`
   - Backend calls `getCredentialingProgress(therapistId)`
   - Returns therapist info + all verifications
6. **NPI card displays**:
   - Shows NPI number from `therapistInfo.npiNumber`
   - Shows verification timestamp from `verifications[{verificationType:'npi'}].verificationDate`
   - Formats timestamp using `date-fns` library

## Visual Result

### When NPI is Verified:

```
┌─────────────────────────────────────────────────────┐
│ 🛡️ National Provider Identifier (NPI)              │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✓  NPI: 1548556871                   [Verified] │ │
│ │    TRICIA HUONG THI NGUYEN MD                   │ │
│ │                                                  │ │
│ │    ✓ Last verified: 2 hours ago                 │ │
│ │    📅 December 21, 2025, 02:30 PM               │ │
│ │    🛡️ Source: CMS NPI Registry                  │ │
│ │    Verified: TRICIA HUONG THI NGUYEN MD         │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### When NPI is Not Verified:

```
┌─────────────────────────────────────────────────────┐
│ 🛡️ National Provider Identifier (NPI)              │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ ⚠️  NPI Not Verified            [Pending]       │ │
│ │    Please verify your NPI in the                │ │
│ │    NPI Verification tab                         │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Database Schema

### Tables Used:

**therapists table**:
```sql
npi_number TEXT  -- Stores the NPI number
```

**credentialing_verifications table**:
```sql
id VARCHAR PRIMARY KEY
therapist_id VARCHAR NOT NULL
verification_type TEXT NOT NULL  -- 'npi', 'oig', 'sam', 'dea', etc.
status VARCHAR NOT NULL  -- 'verified', 'failed', 'pending'
verification_date TIMESTAMP  -- When verification occurred
verified_by VARCHAR  -- 'automated' or admin user ID
verification_source TEXT  -- 'CMS NPI Registry', 'OIG LEIE', etc.
verification_data TEXT  -- JSON string with full API response
notes TEXT  -- Human-readable verification notes
expiration_date TIMESTAMP  -- For credentials that expire
next_check_date TIMESTAMP  -- When to re-verify
```

## API Response Example

```json
GET /api/therapist/credentialing/status
{
  "therapistId": "abc123",
  "currentPhase": "npi_verification",
  "overallStatus": "in_progress",
  "completedPhases": ["document_review", "npi_verification"],
  "pendingPhases": ["license_verification", "education_verification", ...],
  "failedPhases": [],
  "startDate": "2025-12-20T10:00:00Z",
  "daysInProcess": 1,
  "totalPhases": 8,
  "completedPhasesCount": 2,
  "phases": [
    {
      "phase": "document_review",
      "status": "completed",
      "completedAt": "2025-12-20T11:00:00Z"
    },
    {
      "phase": "npi_verification",
      "status": "completed",
      "completedAt": "2025-12-21T14:30:00Z"
    },
    ...
  ],
  "verifications": [
    {
      "id": "ver123",
      "verificationType": "npi",
      "status": "verified",
      "verificationDate": "2025-12-21T14:30:00Z",
      "verifiedBy": "automated",
      "verificationSource": "CMS NPI Registry",
      "notes": "Verified: TRICIA HUONG THI NGUYEN MD",
      "expirationDate": null,
      "nextCheckDate": null
    },
    {
      "verificationType": "oig",
      "status": "verified",
      "verificationDate": "2025-12-21T14:31:00Z",
      "verifiedBy": "automated",
      "verificationSource": "OIG LEIE Database",
      "notes": "No match found in OIG exclusion list",
      "nextCheckDate": "2026-01-20T14:31:00Z"
    }
  ],
  "therapistInfo": {
    "npiNumber": "1548556871",
    "firstName": "Tricia",
    "lastName": "Nguyen",
    "licenseNumber": "MD12345",
    "licenseState": "MO"
  }
}
```

## Benefits

1. **Transparency**: Providers can see exactly when their NPI was verified
2. **Trust**: Showing verification source (CMS) builds confidence
3. **Compliance**: Clear audit trail of when verifications occurred
4. **User Experience**: No confusion about whether NPI is saved/verified
5. **Debugging**: Easy to see if NPI verification is working

## Testing

To test the changes:

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Login as a therapist** who has verified their NPI

3. **Navigate to Provider Credentialing** → **Status & Progress tab**

4. **Verify you see**:
   - NPI Status Card showing your NPI number
   - "Verified" badge
   - "Last verified: X ago" timestamp
   - Full verification date and time
   - Verification source

5. **Test without NPI**:
   - Create a new therapist account
   - Don't verify NPI
   - Should see amber warning card

## Files Modified

1. [server/services/credentialingService.ts](server/services/credentialingService.ts)
   - Lines 25-51: Updated `CredentialingProgress` interface
   - Lines 366-450: Enhanced `getCredentialingProgress` function

2. [client/src/components/credentialing/provider/CredentialingStatusTracker.tsx](client/src/components/credentialing/provider/CredentialingStatusTracker.tsx)
   - Lines 124-126: Fixed progress calculation
   - Lines 288-389: Added NPI Status Card
   - Lines 391-431: Enhanced verifications display

## Related Files

- [server/routes.ts:639-733](server/routes.ts#L639-L733) - Save NPI endpoint
- [server/routes.ts:775-789](server/routes.ts#L775-L789) - Get status endpoint
- [server/services/npiVerification.ts](server/services/npiVerification.ts) - NPI API integration
- [client/src/components/credentialing/provider/NPIVerificationForm.tsx](client/src/components/credentialing/provider/NPIVerificationForm.tsx) - NPI verification form
- [client/src/pages/provider-credentialing.tsx](client/src/pages/provider-credentialing.tsx) - Main portal page

## Future Enhancements

Potential improvements:

1. **Re-verification button** - Allow providers to manually re-verify their NPI
2. **Expiration warnings** - Alert when verifications are old (e.g., > 6 months)
3. **Change tracking** - Show if NPI number was updated
4. **Verification history** - Show all past verifications, not just latest
5. **Other credentials** - Similar display for DEA, licenses, etc.
