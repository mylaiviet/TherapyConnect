# Fix Credentialing "Not Started" Issue

## Problem

Your NPI is verified and documents are uploaded, but the credentialing status shows **"Not Started"** instead of **"In Progress"**.

## Root Cause

The `initializeCredentialing()` function didn't run when you saved your NPI. This creates the timeline entries that track credentialing progress.

## Quick Fix

Run this command to manually initialize credentialing:

```bash
npx tsx scripts/fix-credentialing-init.ts
```

**What it does**:
1. Finds therapists with verified NPI but "Not Started" status
2. Initializes credentialing timeline (creates 8 phase entries)
3. Marks "NPI Verification" phase as completed
4. Updates status from "Not Started" → "In Progress"

## Expected Output

```
================================================================================
MANUAL CREDENTIALING INITIALIZATION FIX
================================================================================

Found 1 therapist(s) needing credentialing initialization

Processing: Tricia Nguyen (abc-123)
   NPI: 1548556871
   Current Status: not_started
   🔧 Initializing credentialing...
   ✅ Credentialing initialized
   🔧 Marking NPI verification phase as complete...
   ✅ NPI phase marked complete
   🔧 Updating credentialing status...
   ✅ Status updated to "in_progress"

================================================================================
FIX COMPLETE
================================================================================
```

## After Running the Fix

1. **Refresh the Credentialing Portal page** (Ctrl+R or F5)
2. **Check "Status & Progress" tab** - should now show:
   - Status: **In Progress** ✅
   - Progress: **1 of 8 phases completed** (12.5%)
   - NPI Verification: **Completed** ✅ with green checkmark
   - Other phases: **Pending**

## Why This Happened

The save-NPI endpoint **should** automatically:
1. Initialize credentialing
2. Mark NPI phase complete
3. Update status to "in_progress"

But this didn't happen, possibly due to:
- Database error during save
- Session timeout
- Page refresh before completion
- Server restart mid-process

## Prevention for Future

The issue is now fixed in the code, but if it happens again:
1. Check browser console for errors
2. Check server logs for initialization errors
3. Run this fix script

## Alternative: Re-verify NPI

If the script doesn't work, you can:
1. Go to **NPI Verification** tab
2. Re-enter your NPI number
3. Click **Verify**
4. Click **Save to Profile**
5. This will trigger initialization again

## Verify It Worked

After running the fix, your Status & Progress page should show:

```
Overall Credentialing Progress
1 of 8 phases completed                                    12%
[████░░░░░░░░░░░░░░░░]

Status: In Progress
Time in Process: 0 days (just started)

Credentialing Phases:
✅ NPI Verification - Completed
⏳ Document Review - Pending
⏳ License Verification - Pending
⏳ Education Verification - Pending
⏳ Background Check - Pending
⏳ Insurance Verification - Pending
⏳ OIG/SAM Exclusion - Pending
⏳ Final Review - Pending
```

## Need Help?

If the fix doesn't work:
1. Check DATABASE_URL is set in .env
2. Ensure dev server is NOT running (stop with Ctrl+C)
3. Try running with: `node --require dotenv/config node_modules/.bin/tsx scripts/fix-credentialing-init.ts`
4. Check for error messages
