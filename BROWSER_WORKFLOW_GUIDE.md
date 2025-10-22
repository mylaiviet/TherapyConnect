# 🌐 Browser Testing Workflow Guide

**Complete step-by-step guide for testing the credentialing system in your browser**

---

## 🎯 Overview

This guide walks you through testing the complete credentialing workflow from start to finish using real browser interactions.

**Time Required:** 30-45 minutes
**Prerequisites:** Server running on http://localhost:5000

---

## ✅ Pre-Test Checklist

Before starting, verify:
- [ ] Server is running (`npm run dev`)
- [ ] Database is connected
- [ ] Test accounts exist (run `npx tsx scripts/complete-setup.ts` if not)
- [ ] Browser dev tools ready (F12)

---

## 📋 PART 1: Therapist Workflow Testing

### Test 1.1: Login as Therapist

**Steps:**
1. Open browser to: http://localhost:5000/login
2. Enter credentials:
   - Email: `test.therapist1@example.com`
   - Password: `therapist123`
3. Click "Sign In"

**Expected Results:**
- ✅ Successful login
- ✅ Redirected to dashboard or homepage
- ✅ Header shows user is logged in
- ✅ No console errors

**Screenshot:** Save as `01-therapist-login.png`

---

### Test 1.2: Navigate to Provider Portal

**Steps:**
1. Navigate to: http://localhost:5000/provider-credentialing
2. Observe page load

**Expected Results:**
- ✅ Page loads without errors
- ✅ Page title: "Credentialing Portal"
- ✅ Subtitle: "Manage your professional credentials..."
- ✅ 4 status cards visible:
  - Credentialing Status (Not Started or In Progress)
  - Documents Uploaded (0)
  - Active Alerts (0)
  - Expiring Soon (0)
- ✅ 3 tabs visible: Status & Progress, Upload Documents, My Documents
- ✅ No JavaScript errors in console

**Screenshot:** Save as `02-provider-portal-overview.png`

---

### Test 1.3: Review Status & Progress Tab

**Steps:**
1. Ensure you're on "Status & Progress" tab
2. Review the content

**Expected Results:**
- ✅ Progress bar showing 0% (or current percentage)
- ✅ "0 of 8 phases completed" text
- ✅ List of credentialing phases:
  1. Document Review - Pending
  2. NPI Verification - Pending
  3. License Verification - Pending
  4. Education Verification - Pending
  5. Background Check - Pending
  6. Insurance Verification - Pending
  7. OIG/SAM Exclusion - Pending
  8. (One more phase)
- ✅ Each phase shows status badge
- ✅ Icons display for each phase

**Screenshot:** Save as `03-status-progress-tab.png`

---

### Test 1.4: Upload Documents Tab

**Steps:**
1. Click "Upload Documents" tab
2. Observe the interface

**Expected Results:**
- ✅ Tab switches smoothly
- ✅ "Upload Credentialing Documents" heading visible
- ✅ Blue info box with file format information:
  - Accepted formats: PDF, JPG, PNG, GIF, DOC, DOCX
  - Maximum file size: 10MB
- ✅ "Document Type" dropdown visible
- ✅ "Select File" or "Choose File" button visible
- ✅ "Upload Document" button visible
- ✅ "Document Guidelines" section with 5 items:
  - Quality
  - Current
  - Complete
  - Expiration
  - Verification
- ✅ All guidelines have green checkmarks

**Screenshot:** Save as `04-upload-documents-tab.png`

---

### Test 1.5: Test Document Type Dropdown

**Steps:**
1. Click the "Document Type" dropdown
2. Review available options

**Expected Results:**
- ✅ Dropdown opens
- ✅ Shows document types:
  - Professional License
  - Graduate Transcript
  - Diploma/Degree
  - Government ID
  - Liability Insurance
  - DEA Certificate
  - Board Certification
  - (Others as configured)
- ✅ Can select different options
- ✅ Selection persists

**Screenshot:** Save as `05-document-type-dropdown.png`

---

### Test 1.6: Test File Selection

**Steps:**
1. Select "Professional License" from dropdown
2. Click "Choose File" button
3. Select a test PDF or image file
4. Observe the result

**Expected Results:**
- ✅ File picker dialog opens
- ✅ Can select a file
- ✅ Selected filename appears in interface
- ✅ File size displayed
- ✅ Remove/clear button (X) appears
- ✅ Can remove file by clicking X

**Screenshot:** Save as `06-file-selected.png`

---

### Test 1.7: Attempt Document Upload

**Steps:**
1. With file selected, click "Upload Document"
2. Observe the result

**Expected Results:**
- ✅ Upload button is clickable
- ✅ Upload attempt is made (check Network tab)
- ✅ Either:
  - Success message and document appears in list, OR
  - Error message (expected if backend not fully configured)
- ✅ No page crash

**Note:** Upload may fail if document storage isn't configured - this is expected.

**Screenshot:** Save as `07-upload-attempt.png`

---

### Test 1.8: My Documents Tab

**Steps:**
1. Click "My Documents" tab
2. Review the content

**Expected Results:**
- ✅ Tab switches smoothly
- ✅ "Document Requirements" heading
- ✅ "0 / 5 Required Documents" badge (or updated count)
- ✅ Warning: "5 required documents missing" (if none uploaded)
- ✅ "Credentialing Documents" section
- ✅ List of document types:
  - Professional License - Required (red badge)
  - Graduate Transcript - Required (red badge)
  - Diploma/Degree - Required (red badge)
  - Government ID - Required (red badge)
  - Liability Insurance - Required (red badge)
  - DEA Certificate - Optional (gray badge)
  - Board Certification - Optional (gray badge)
- ✅ Each shows "No documents uploaded yet" or uploaded document info

**Screenshot:** Save as `08-my-documents-tab.png`

---

### Test 1.9: NPI Verification (if visible)

**Steps:**
1. Find NPI verification section (may be in Upload Documents tab)
2. Enter test NPI: `1234567893`
3. Click "Verify NPI"
4. Observe result

**Expected Results:**
- ✅ Input field accepts 10 digits
- ✅ Verify button is clickable
- ✅ Some response (success, error, or processing)
- ✅ No page crash

**Screenshot:** Save as `09-npi-verification.png`

---

### Test 1.10: Check Responsive Design

**Steps:**
1. Open browser dev tools (F12)
2. Toggle device toolbar (mobile view)
3. Test different screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)

**Expected Results:**
- ✅ 4 status cards stack vertically on mobile
- ✅ Tabs remain functional on mobile
- ✅ Forms are usable on mobile
- ✅ Text remains readable
- ✅ Buttons are tappable (not too small)
- ✅ No horizontal scrolling

**Screenshot:** Save as `10-mobile-view.png`

---

## 📋 PART 2: Admin Workflow Testing

### Test 2.1: Logout and Login as Admin

**Steps:**
1. Click logout (or navigate to /login)
2. Enter admin credentials:
   - Email: `admin@karematch.com`
   - Password: `admin123`
3. Click "Sign In"

**Expected Results:**
- ✅ Successful logout
- ✅ Successful admin login
- ✅ No errors

**Screenshot:** Save as `11-admin-login.png`

---

### Test 2.2: Navigate to Admin Dashboard

**Steps:**
1. Navigate to: http://localhost:5000/admin/credentialing
2. Observe page load

**Expected Results:**
- ✅ Page loads without errors
- ✅ Page title: "Provider Credentialing"
- ✅ Subtitle: "Manage provider credentials..."
- ✅ 4 stats cards visible:
  - Pending Review (count with clock icon)
  - Active Alerts (count with warning icon)
  - OIG Records (count with shield icon)
  - Compliance (percentage with check icon)
- ✅ 2 tabs visible: Pending Providers, Alerts
- ✅ No console errors

**Screenshot:** Save as `12-admin-dashboard-overview.png`

---

### Test 2.3: Review Stats Cards

**Steps:**
1. Examine each of the 4 stats cards
2. Note the values

**Expected Results:**

**Card 1: Pending Review**
- ✅ Shows number (likely 0 or 3 for test accounts)
- ✅ Clock icon visible
- ✅ Text: "Providers awaiting credentialing"

**Card 2: Active Alerts**
- ✅ Shows number
- ✅ Alert triangle icon visible
- ✅ Shows critical alert count

**Card 3: OIG Records**
- ✅ Shows number (likely 0)
- ✅ Shield icon visible
- ✅ Shows last update date

**Card 4: Compliance**
- ✅ Shows percentage (likely 100%)
- ✅ File check icon visible
- ✅ Text: "All active providers verified"

**Screenshot:** Save as `13-admin-stats-cards.png`

---

### Test 2.4: Pending Providers Tab

**Steps:**
1. Ensure you're on "Pending Providers" tab
2. Review the content

**Expected Results:**

**If providers are pending:**
- ✅ List of providers visible
- ✅ Each provider shows:
  - Name
  - Credentials
  - Avatar/initials
  - Status badge
  - Days in process
  - "View Details" button

**If no providers pending:**
- ✅ Empty state message
- ✅ Icon (info circle)
- ✅ "No pending credentialing requests"
- ✅ "All providers have been reviewed"

**Screenshot:** Save as `14-pending-providers-list.png`

---

### Test 2.5: Provider Detail View (if available)

**Steps:**
1. If providers are listed, click "View Details" on one
2. Review the detail view

**Expected Results:**
- ✅ Detail view opens/navigates
- ✅ Shows provider information
- ✅ Shows uploaded documents
- ✅ Shows verification status
- ✅ Shows action buttons (Approve/Reject)
- ✅ Can navigate back to list

**Screenshot:** Save as `15-provider-detail-view.png`

---

### Test 2.6: Alerts Tab

**Steps:**
1. Click "Alerts" tab
2. Review the content

**Expected Results:**
- ✅ Tab switches smoothly
- ✅ Alert management panel visible
- ✅ Either shows list of alerts or empty state
- ✅ Filter options available (severity, status)
- ✅ Can mark alerts as resolved (if any exist)

**Screenshot:** Save as `16-alerts-tab.png`

---

### Test 2.7: Test Navigation Between Pages

**Steps:**
1. Navigate to homepage
2. Navigate back to admin dashboard
3. Navigate to provider portal
4. Check if access is restricted

**Expected Results:**
- ✅ Navigation works smoothly
- ✅ Admin can access admin pages
- ✅ Admin cannot access provider-only pages (or sees appropriate message)
- ✅ URLs update correctly
- ✅ Back button works

**Screenshot:** Save as `17-navigation-test.png`

---

## 📋 PART 3: Console & Network Testing

### Test 3.1: Browser Console Check

**Steps:**
1. Open developer tools (F12)
2. Go to Console tab
3. Review for errors

**Expected Results:**
- ✅ No red errors (or only expected 401s from unauthenticated requests)
- ✅ No yellow warnings (or minor expected warnings)
- ✅ No React hydration errors
- ✅ No failed resource loads

**Document:** List any errors found

---

### Test 3.2: Network Tab Check

**Steps:**
1. Open developer tools (F12)
2. Go to Network tab
3. Reload provider portal page
4. Review network requests

**Expected Results:**

**HTML/Assets:**
- ✅ Main HTML loads (200 OK)
- ✅ CSS loads (200 OK)
- ✅ JavaScript bundles load (200 OK)

**API Calls:**
- ✅ `/api/auth/me` - Returns user info or 401
- ✅ `/api/therapist/credentialing/status` - Returns 200 (if logged in)
- ✅ `/api/therapist/credentialing/documents` - Returns 200 (if logged in)
- ✅ No 500 server errors
- ✅ No CORS errors

**Screenshot:** Save as `18-network-tab.png`

---

### Test 3.3: Performance Check

**Steps:**
1. Open developer tools (F12)
2. Go to Lighthouse or Performance tab
3. Run audit

**Expected Results:**
- ✅ Page loads in < 3 seconds
- ✅ First Contentful Paint < 2s
- ✅ Largest Contentful Paint < 4s
- ✅ No layout shifts
- ✅ Interactions are responsive

**Screenshot:** Save as `19-performance-audit.png`

---

## 📋 PART 4: Edge Cases & Error Handling

### Test 4.1: Invalid Login

**Steps:**
1. Logout
2. Try to login with wrong password
3. Try to login with non-existent email

**Expected Results:**
- ✅ Error message displayed
- ✅ "Invalid credentials" or similar
- ✅ No page crash
- ✅ Can try again

---

### Test 4.2: Unauthorized Access

**Steps:**
1. Logout completely
2. Try to access: http://localhost:5000/provider-credentialing
3. Try to access: http://localhost:5000/admin/credentialing

**Expected Results:**
- ✅ Redirected to login page, OR
- ✅ "Not authorized" message, OR
- ✅ Shows empty/loading state gracefully
- ✅ No page crash

---

### Test 4.3: Invalid File Upload

**Steps:**
1. Login as therapist
2. Go to Upload Documents tab
3. Try to upload:
   - Very large file (>10MB)
   - Wrong file type (.exe, .txt)
   - No file selected

**Expected Results:**
- ✅ Validation errors displayed
- ✅ "File too large" message
- ✅ "Invalid file type" message
- ✅ "Please select a file" message
- ✅ Upload blocked appropriately

---

### Test 4.4: Session Timeout

**Steps:**
1. Login
2. Leave browser open for extended period
3. Try to perform action

**Expected Results:**
- ✅ Either action works (session persists), OR
- ✅ Redirected to login (session expired)
- ✅ No confusing error
- ✅ Can re-login successfully

---

## ✅ Testing Checklist Summary

### Provider Portal Tests:
- [ ] Login works
- [ ] Page loads without errors
- [ ] 4 status cards display correctly
- [ ] 3 tabs are functional
- [ ] Status & Progress tab shows phases
- [ ] Upload Documents tab renders
- [ ] Can select document type
- [ ] Can select file
- [ ] Upload button is functional
- [ ] My Documents tab shows checklist
- [ ] Required/optional badges visible
- [ ] Responsive on mobile
- [ ] No console errors

### Admin Dashboard Tests:
- [ ] Admin login works
- [ ] Dashboard loads without errors
- [ ] 4 stats cards display
- [ ] Pending Providers tab works
- [ ] Alerts tab works
- [ ] Empty states are friendly
- [ ] Navigation works
- [ ] No console errors

### Technical Tests:
- [ ] Console has no critical errors
- [ ] Network requests succeed
- [ ] API endpoints return correct status codes
- [ ] No CORS errors
- [ ] Performance is acceptable
- [ ] Invalid login handled gracefully
- [ ] Unauthorized access protected
- [ ] File validation works
- [ ] Session management functional

---

## 📊 Test Results Template

```
=================================================
BROWSER TESTING RESULTS
=================================================

Date: _______________
Tester: _______________
Browser: _______________
Screen Size: _______________

Provider Portal:
- Page Load: PASS / FAIL
- Status Cards: PASS / FAIL
- Tab Navigation: PASS / FAIL
- Upload Interface: PASS / FAIL
- File Selection: PASS / FAIL
- Document List: PASS / FAIL
- Mobile View: PASS / FAIL

Admin Dashboard:
- Page Load: PASS / FAIL
- Stats Cards: PASS / FAIL
- Pending List: PASS / FAIL
- Alerts Tab: PASS / FAIL
- Navigation: PASS / FAIL

Technical:
- Console Clean: PASS / FAIL
- Network Requests: PASS / FAIL
- Performance: PASS / FAIL
- Error Handling: PASS / FAIL

Overall Status: ✅ PASS / ❌ FAIL

Notes:
_________________________________
_________________________________
_________________________________
```

---

## 🎯 Success Criteria

**Minimum to Pass:**
- ✅ All pages load without critical errors
- ✅ Authentication works (login/logout)
- ✅ UI components render correctly
- ✅ Tab navigation functional
- ✅ Forms accept input
- ✅ No console errors (except expected 401s)

**Nice to Have:**
- Document upload completes successfully
- NPI verification returns real data
- Admin can approve/reject
- Email notifications send
- Performance score > 80

---

## 📸 Screenshot Checklist

Save these screenshots during testing:
1. [ ] Therapist login page
2. [ ] Provider portal overview
3. [ ] Status & Progress tab
4. [ ] Upload Documents tab
5. [ ] Document type dropdown
6. [ ] File selected
7. [ ] Upload attempt
8. [ ] My Documents tab
9. [ ] NPI verification
10. [ ] Mobile view
11. [ ] Admin login
12. [ ] Admin dashboard overview
13. [ ] Admin stats cards
14. [ ] Pending providers list
15. [ ] Provider detail view
16. [ ] Alerts tab
17. [ ] Navigation test
18. [ ] Network tab
19. [ ] Performance audit
20. [ ] Any errors encountered

---

## 🐛 Issue Reporting Template

If you find bugs, report them like this:

```
BUG REPORT
==========

Title: [Short description]

Steps to Reproduce:
1.
2.
3.

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Screenshot: [Filename or attach]

Console Errors: [Copy/paste any errors]

Browser: [Chrome/Firefox/Safari/Edge]
Screen Size: [Desktop/Tablet/Mobile]
User Role: [Therapist/Admin]

Severity: [Critical/High/Medium/Low]
```

---

## ✅ Ready to Test!

**Before you start:**
1. Make sure server is running: `npm run dev`
2. Verify test accounts exist: `npx tsx scripts/complete-setup.ts`
3. Open browser to: http://localhost:5000
4. Have this guide open as reference
5. Keep developer tools (F12) open

**Happy Testing!** 🚀

**Estimated Time:** 30-45 minutes for complete walkthrough

**Questions?** Refer to:
- [TESTING_GUIDE.md](TESTING_GUIDE.md) for troubleshooting
- [SETUP_COMPLETE.md](SETUP_COMPLETE.md) for system overview
- [TESTING_QUICK_REFERENCE.md](TESTING_QUICK_REFERENCE.md) for quick help
