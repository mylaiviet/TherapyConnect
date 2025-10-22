# Visual Testing Checklist - Credentialing System

**Server Status:** ✅ Running on http://localhost:5000
**All Pages:** ✅ Accessible and loading successfully

---

## 🎯 Quick Start

1. Open your browser
2. Navigate to: **http://localhost:5000/signup**
3. Create a test therapist account
4. Then navigate to: **http://localhost:5000/provider-credentialing**

---

## 📋 PROVIDER CREDENTIALING PORTAL TESTING

### URL: http://localhost:5000/provider-credentialing

### Visual Components to Verify:

#### 1. Page Header & Layout
- [ ] Page title "Credentialing Portal" is visible
- [ ] Subtitle explaining the purpose is displayed
- [ ] Page is responsive and centered properly

#### 2. Status Overview Cards (4 cards across top)

**Card 1: Credentialing Status**
- [ ] Card displays with title "Credentialing Status"
- [ ] Status badge shows one of:
  - "Not Started" (gray with FileText icon)
  - "Pending" (yellow with AlertTriangle icon)
  - "In Progress" (blue with Clock icon)
  - "Approved" (green with CheckCircle icon)
  - "Needs Attention" (red with AlertTriangle icon)
- [ ] If in progress, shows "X days in process"

**Card 2: Documents Uploaded**
- [ ] Card displays with title "Documents Uploaded"
- [ ] Blue FileText icon is visible
- [ ] Shows count of total documents (starts at 0)
- [ ] Shows count of verified documents (starts at 0)

**Card 3: Active Alerts**
- [ ] Card displays with title "Active Alerts"
- [ ] Either shows:
  - Green CheckCircle with "0 - All clear" (if no alerts)
  - Red AlertTriangle with count (if alerts exist)

**Card 4: Expiring Soon**
- [ ] Card displays with title "Expiring Soon"
- [ ] Either shows:
  - Green CheckCircle with "0 - None expiring" (if none)
  - Orange Calendar with count "Within 60 days" (if documents expiring)

#### 3. Alert Banners (Conditional)
- [ ] If critical alerts exist: Red alert banner appears below cards
- [ ] If expiring documents exist: Orange warning banner appears

#### 4. Main Content Tabs

**Tab Navigation:**
- [ ] "Status & Progress" tab with Shield icon
- [ ] "Upload Documents" tab with Upload icon
- [ ] "My Documents" tab with FileText icon
- [ ] "Alerts & Reminders" tab (only if alerts/expiring docs exist)
  - [ ] Badge with alert count appears on tab

**Tab 1: Status & Progress**
- [ ] CredentialingStatusTracker component renders
- [ ] Shows current status and progress
- [ ] Loading spinner appears initially (if data loading)

**Tab 2: Upload Documents**
- [ ] DocumentUploadInterface component renders
- [ ] Shows sections for different document types:
  - Professional License
  - DEA Certificate
  - Malpractice Insurance
  - Board Certifications
  - W-9 Form
  - Liability Insurance
- [ ] Each section has an upload button
- [ ] NPI verification section is visible
- [ ] Can enter NPI number in input field
- [ ] "Verify NPI" button is clickable

**Tab 3: My Documents**
- [ ] RequiredDocumentsChecklist component renders
- [ ] Shows list of uploaded documents
- [ ] Shows which documents are required vs optional
- [ ] Document status indicators visible

**Tab 4: Alerts & Reminders** (if visible)
- [ ] ExpirationReminders component renders
- [ ] Shows active alerts list
- [ ] Shows expiring documents list
- [ ] Severity indicators visible (critical, warning, info)

---

## 🔧 INTERACTIVE FUNCTIONALITY TESTING

### Document Upload Testing:

1. **Click Upload Button**
   - [ ] File picker dialog opens
   - [ ] Can select a file (try PDF, PNG, JPG)
   - [ ] Selected file name appears in interface

2. **Upload Progress**
   - [ ] Progress indicator appears during upload
   - [ ] Success message appears when complete
   - [ ] Document appears in documents list

3. **File Validation**
   - [ ] Try uploading invalid file type (e.g., .txt, .exe)
   - [ ] Should show error message
   - [ ] Try uploading large file (>10MB)
   - [ ] Should show file size error

### NPI Verification Testing:

1. **Enter NPI Number**
   - [ ] Input field accepts 10 digits
   - [ ] Try entering: `1234567893` (test NPI format)
   - [ ] Click "Verify NPI" button

2. **Verification Response**
   - [ ] Loading indicator appears
   - [ ] Result message displays (success or error)
   - [ ] If successful, shows provider information
   - [ ] If failed, shows appropriate error message

### Navigation & Responsiveness:

1. **Tab Switching**
   - [ ] Can click between all tabs
   - [ ] Tab content changes appropriately
   - [ ] No console errors when switching

2. **Responsive Design**
   - [ ] Resize browser window to mobile size
   - [ ] Cards stack vertically
   - [ ] Tabs remain functional
   - [ ] All content remains readable

---

## 👨‍💼 ADMIN CREDENTIALING DASHBOARD TESTING

### URL: http://localhost:5000/admin/credentialing

⚠️ **Note:** Requires admin account. Regular therapist accounts will not have access.

### Visual Components to Verify:

#### 1. Page Header
- [ ] Title "Provider Credentialing" is visible
- [ ] Subtitle about managing credentials is displayed

#### 2. Stats Overview Cards (4 cards)

**Card 1: Pending Review**
- [ ] Shows count of pending providers
- [ ] Clock icon visible
- [ ] Text: "Providers awaiting credentialing"

**Card 2: Active Alerts**
- [ ] Shows total alert count
- [ ] Shows critical alert count
- [ ] AlertTriangle icon visible

**Card 3: OIG Records**
- [ ] Shows total OIG/SAM records count
- [ ] Shows last update date
- [ ] Shield icon visible

**Card 4: Compliance**
- [ ] Shows compliance percentage
- [ ] Text: "All active providers verified"
- [ ] FileCheck icon visible

#### 3. Main Content Tabs

**Tab 1: Pending Providers**
- [ ] Shows list of providers needing review
- [ ] Each provider card shows:
  - Name and credentials
  - Avatar/initials
  - Credentialing status badge
  - Days in process
  - "View Details" button
- [ ] Can click on provider to view full details
- [ ] Detailed view shows:
  - All uploaded documents
  - NPI verification status
  - DEA validation status
  - OIG/SAM check results
  - Review actions (Approve/Reject buttons)

**Tab 2: Alerts**
- [ ] AlertManagementPanel component renders
- [ ] Shows all unresolved alerts
- [ ] Can filter by severity
- [ ] Can mark alerts as resolved
- [ ] Alert cards show:
  - Severity badge (critical/warning/info)
  - Alert message
  - Created date
  - Related provider info
  - Action buttons

---

## 🧪 WORKFLOW TESTING

### Complete Provider Credentialing Workflow:

1. **Provider Uploads Documents** (as therapist)
   - [ ] Log in as therapist
   - [ ] Navigate to Provider Portal
   - [ ] Upload all required documents:
     - [ ] Professional License (PDF)
     - [ ] Malpractice Insurance (PDF)
     - [ ] W-9 Form (PDF)
   - [ ] Verify NPI number
   - [ ] Status changes from "Not Started" to "In Progress"

2. **Admin Reviews Application** (as admin)
   - [ ] Log in as admin
   - [ ] Navigate to Admin Dashboard
   - [ ] See therapist in "Pending Providers" list
   - [ ] Click to view details
   - [ ] Review all uploaded documents
   - [ ] Check NPI verification status
   - [ ] Check OIG/SAM exclusion results
   - [ ] Add review notes

3. **Admin Approves/Rejects**
   - [ ] Click "Approve" or "Reject" button
   - [ ] Confirmation dialog appears
   - [ ] Add approval/rejection notes
   - [ ] Submit decision
   - [ ] Provider status updates

4. **Provider Sees Updated Status**
   - [ ] Log back in as therapist
   - [ ] Navigate to Provider Portal
   - [ ] Status badge reflects new status
   - [ ] If rejected, see rejection notes
   - [ ] If approved, see approval confirmation

---

## 🔍 CONSOLE & NETWORK TESTING

### Browser DevTools Checks:

1. **Console Tab** (Press F12)
   - [ ] No red error messages
   - [ ] No warning messages (yellow)
   - [ ] No React hydration errors
   - [ ] No failed API calls

2. **Network Tab**
   - [ ] Check API calls being made:
     - [ ] `/api/therapist/credentialing/status` - Returns 200
     - [ ] `/api/therapist/credentialing/documents` - Returns 200
     - [ ] `/api/therapist/credentialing/alerts` - Returns 200
   - [ ] For admin dashboard:
     - [ ] `/api/admin/credentialing/pending` - Returns 200
     - [ ] `/api/admin/credentialing/alerts` - Returns 200
     - [ ] `/api/admin/credentialing/oig/stats` - Returns 200
   - [ ] Upload requests return success
   - [ ] No 500 server errors
   - [ ] No CORS errors

3. **Performance**
   - [ ] Page loads in < 3 seconds
   - [ ] Tab switching is instant
   - [ ] No lag when typing in inputs
   - [ ] Smooth scrolling

---

## 🐛 COMMON ISSUES TO CHECK

### Provider Portal Issues:
- [ ] If page shows "loading" forever → Check console for API errors
- [ ] If uploads fail → Check file size and type
- [ ] If NPI verification fails → Check NPI format (10 digits)
- [ ] If tabs don't switch → Check console for React errors

### Admin Dashboard Issues:
- [ ] If shows "Not Authorized" → Need admin account
- [ ] If no providers show → Need to create test data
- [ ] If OIG stats show 0 → OIG database may not be initialized
- [ ] If details won't open → Check console for errors

### General Issues:
- [ ] Blank page → Check console for JavaScript errors
- [ ] Styles broken → Check if CSS loaded properly
- [ ] Can't log in → Check credentials and session
- [ ] 404 errors → Check URL matches routes exactly

---

## ✅ ACCEPTANCE CRITERIA

### Minimum Requirements for "Working":
1. ✅ Provider portal loads without errors
2. ✅ All 4 status cards display correctly
3. ✅ All 3-4 tabs are visible and switchable
4. ✅ Document upload interface renders
5. ✅ NPI verification section is present
6. ✅ Admin dashboard loads (with admin account)
7. ✅ Admin can see pending providers list
8. ✅ No console errors on page load

### Nice-to-Have Features:
- File upload actually works (backend implemented)
- NPI verification returns real data
- OIG/SAM checking functional
- Email notifications work
- Document expiration tracking works

---

## 📸 SCREENSHOT CHECKLIST

Take screenshots of:
1. [ ] Provider portal - Overview (4 status cards)
2. [ ] Provider portal - Upload Documents tab
3. [ ] Provider portal - My Documents tab
4. [ ] Admin dashboard - Overview (4 stats cards)
5. [ ] Admin dashboard - Pending providers list
6. [ ] Admin dashboard - Provider detail view
7. [ ] Any errors or issues encountered

---

## 🎉 SUCCESS CRITERIA

**The UI is considered working if:**
- All pages load without errors
- All visual components render correctly
- Tabs switch properly
- Forms accept input
- Buttons are clickable
- API endpoints return data (or graceful error handling)
- Console has no critical errors
- Layout is responsive

---

**Ready to Test!** 🚀

Open http://localhost:5000/signup in your browser and start testing!
