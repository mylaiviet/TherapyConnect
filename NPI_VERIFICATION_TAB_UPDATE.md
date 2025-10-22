# NPI Verification Tab - Display Last Verified Timestamp

## Summary

Updated the NPI Verification tab to display existing verified NPI information with timestamp at the top of the page, so providers can see when their NPI was last verified.

## Problem

When a provider navigates to the **NPI Verification tab**, they only see:
- An empty input form to enter NPI
- No indication that their NPI is already verified
- No timestamp showing when verification occurred
- Must go to "Status & Progress" tab to see NPI status

**User Experience Issue**: Providers don't know if they've already verified their NPI or when it was verified.

## Solution

Added a **verified NPI status card** at the top of the NPI Verification tab that displays:
- ✅ NPI number
- ✅ Provider name
- ✅ Verification status badge
- ✅ "Last verified: X ago" (e.g., "2 hours ago")
- ✅ Full verification date and time
- ✅ Verification source (CMS NPI Registry)
- ✅ Verification notes

## Implementation

### File Modified

**[client/src/components/credentialing/provider/NPIVerificationForm.tsx](client/src/components/credentialing/provider/NPIVerificationForm.tsx)**

### Changes Made

#### 1. Added Imports (Lines 1-24)
```typescript
import { useQuery } from "@tanstack/react-query"; // Added
import { RefreshCw } from "lucide-react"; // Added
import { formatDistanceToNow } from "date-fns"; // Added
```

#### 2. Fetch Existing NPI Data (Lines 62-71)
```typescript
// Fetch credentialing status to check for existing NPI
const { data: credentialingStatus, isLoading: statusLoading } = useQuery<any>({
  queryKey: ["/api/therapist/credentialing/status"],
});

// Check if NPI is already verified
const existingNPI = credentialingStatus?.therapistInfo?.npiNumber;
const npiVerification = credentialingStatus?.verifications?.find(
  (v: any) => v.verificationType === "npi" && v.status === "verified"
);
```

**How it works**:
- Fetches `/api/therapist/credentialing/status` endpoint
- Extracts NPI number from `therapistInfo.npiNumber`
- Finds NPI verification record from `verifications[]` array
- Only shows verified NPIs (status === "verified")

#### 3. Added Verified NPI Status Card (Lines 180-281)

**Green success card** showing:
```
┌──────────────────────────────────────────────────┐
│ ✓ NPI Verified                                   │
├──────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────┐  │
│ │ 🛡️  NPI: 1548556871        [Verified]     │  │
│ │     TRICIA HUONG THI NGUYEN               │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ Verification Status: ✓ Active and Verified │  │
│ │ Last Verified: 2 hours ago                 │  │
│ │ Verification Date: Dec 21, 2025, 02:30 PM  │  │
│ │ Verified By: CMS NPI Registry              │  │
│ │ Notes: Verified: TRICIA NGUYEN MD         │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ℹ️ Your NPI is already verified and active.     │
│    If you need to update or re-verify,          │
│    use the form below.                          │
└──────────────────────────────────────────────────┘
```

**Layout**:
- **Header**: Green card with checkmark icon
- **Main section**: White box with NPI number, name, and badge
- **Details section**: Table-like layout with verification info
  - Verification Status: ✓ Active and Verified
  - Last Verified: **2 hours ago** (human-readable using `formatDistanceToNow`)
  - Verification Date: **December 21, 2025, 02:30 PM**
  - Verified By: **CMS NPI Registry**
  - Notes: Provider-specific verification message
- **Info alert**: Explains NPI is verified, can re-verify below

#### 4. Updated Form Title (Lines 286-298)

**Dynamic title based on NPI status**:
- **No NPI**: "NPI Verification" (Shield icon)
- **Has NPI**: "Update or Re-verify NPI" (RefreshCw icon)

#### 5. Updated Form Instructions (Lines 301-317)

**Dynamic instructions**:
- **No NPI**: "Enter your 10-digit NPI... This is required for credentialing approval."
- **Has NPI**: "To update or re-verify your NPI, enter a new 10-digit NPI number below. This will replace your current verified NPI."

## Visual Result

### Scenario 1: NPI Already Verified

When provider opens NPI Verification tab with existing NPI:

```
┌─────────────────────────────────────────────────────┐
│ ✓ NPI Verified (Green Card)                        │
├─────────────────────────────────────────────────────┤
│ NPI: 1548556871                      [Verified]    │
│ TRICIA HUONG THI NGUYEN                            │
│                                                     │
│ Last Verified: 2 hours ago                         │
│ Verification Date: December 21, 2025, 02:30 PM     │
│ Verified By: CMS NPI Registry                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🔄 Update or Re-verify NPI                         │
├─────────────────────────────────────────────────────┤
│ ℹ️ To update or re-verify your NPI, enter a new    │
│    10-digit NPI number below...                    │
│                                                     │
│ NPI Number: [__________] [Verify]                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ About NPI Verification                             │
│ ...help content...                                 │
└─────────────────────────────────────────────────────┘
```

### Scenario 2: No NPI Verified

When provider opens NPI Verification tab without NPI:

```
┌─────────────────────────────────────────────────────┐
│ 🛡️ NPI Verification                                 │
├─────────────────────────────────────────────────────┤
│ ℹ️ Enter your 10-digit NPI to verify your          │
│    credentials... This is required for approval.   │
│                                                     │
│ NPI Number: [__________] [Verify]                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ About NPI Verification                             │
│ ...help content...                                 │
└─────────────────────────────────────────────────────┘
```

## Data Flow

1. **Page loads** → NPIVerificationForm component mounts
2. **useQuery hook** → Fetches `/api/therapist/credentialing/status`
3. **Backend returns**:
   ```json
   {
     "therapistInfo": {
       "npiNumber": "1548556871",
       "firstName": "Tricia",
       "lastName": "Nguyen"
     },
     "verifications": [
       {
         "verificationType": "npi",
         "status": "verified",
         "verificationDate": "2025-12-21T14:30:00Z",
         "verificationSource": "CMS NPI Registry",
         "notes": "Verified: TRICIA NGUYEN MD"
       }
     ]
   }
   ```
4. **Component extracts**:
   - `existingNPI` = "1548556871"
   - `npiVerification` = NPI verification object
5. **Conditional rendering**:
   - If `existingNPI && npiVerification` → Show green verified card
   - Always show verification form below (for updates)

## Timestamp Display

### Human-Readable Format
Uses `date-fns` library's `formatDistanceToNow`:
- "2 hours ago"
- "3 days ago"
- "1 month ago"

### Full Date Format
```javascript
new Date(verificationDate).toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})
```

**Output**: "December 21, 2025, 02:30 PM"

## Benefits

1. **Transparency**: Provider immediately sees their verified NPI
2. **Confidence**: Clear indication that NPI is already verified
3. **Audit Trail**: Shows when verification occurred
4. **User Experience**: No confusion about verification status
5. **Re-verification**: Easy path to update/re-verify if needed

## Testing

### Test Case 1: Verified NPI

1. Log in as therapist who has verified NPI
2. Navigate to Credentialing → NPI Verification tab
3. **Expected**:
   - Green "NPI Verified" card at top
   - Shows NPI number
   - Shows "Last verified: X ago"
   - Shows full verification date
   - Form below titled "Update or Re-verify NPI"

### Test Case 2: No NPI

1. Log in as new therapist (no NPI verified)
2. Navigate to Credentialing → NPI Verification tab
3. **Expected**:
   - No green card
   - Only verification form
   - Form titled "NPI Verification"
   - Standard instructions

### Test Case 3: Re-verification

1. Provider with verified NPI
2. Enter different NPI in form
3. Click "Verify"
4. Click "Save to Profile"
5. **Expected**:
   - Green card updates with new NPI
   - Timestamp updates to current time
   - Old verification replaced

## Related Changes

This update works in conjunction with:

1. **[NPI_DISPLAY_UPDATE.md](NPI_DISPLAY_UPDATE.md)** - Added NPI display to Status & Progress tab
2. **[server/services/credentialingService.ts](server/services/credentialingService.ts)** - Enhanced `getCredentialingProgress()` to return verification data
3. **[server/routes.ts:639-733](server/routes.ts#L639-L733)** - Save NPI endpoint that creates verification records

## API Dependency

**Endpoint**: `GET /api/therapist/credentialing/status`

**Returns**:
```typescript
{
  therapistInfo: {
    npiNumber?: string;
    firstName: string;
    lastName: string;
    licenseNumber?: string;
    licenseState?: string;
  };
  verifications: Array<{
    id: string;
    verificationType: string; // 'npi', 'oig', 'sam', etc.
    status: string; // 'verified', 'failed', 'pending'
    verificationDate: Date;
    verificationSource: string;
    notes: string;
  }>;
  // ... other credentialing data
}
```

## Database Tables

**therapists table**:
- `npi_number` - Stores the NPI

**credentialing_verifications table**:
- `verification_type` = 'npi'
- `status` = 'verified'
- `verification_date` - Timestamp of verification
- `verification_source` - 'CMS NPI Registry'
- `notes` - Human-readable verification message

## Future Enhancements

1. **Re-verification Button**: Add quick "Re-verify Now" button on verified card
2. **Expiration Warning**: Alert if verification is > 6 months old
3. **Verification History**: Show list of past verifications
4. **Auto-refresh**: Periodic re-verification for active providers
5. **Export**: Download NPI verification certificate as PDF
