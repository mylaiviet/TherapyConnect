# Credentialing System Testing Guide

## Current Status
✅ Server is running on http://localhost:5000
✅ UI components built (Admin + Provider portals)
⏳ Ready for browser testing

---

## Test Accounts

### Option 1: Create New Therapist Account
1. Navigate to: http://localhost:5000/signup
2. Create account with:
   - Email: test.therapist@example.com
   - Password: therapist123
3. After signup, you'll be logged in as a therapist

### Option 2: Use Existing Account
If you have an existing therapist account, use that to log in at http://localhost:5000/login

---

## Testing Checklist

### 1. Provider Credentialing Portal (Therapist View)

**URL:** http://localhost:5000/provider-credentialing

**Tests to perform:**
- [ ] Page loads without errors
- [ ] Can see credentialing status banner
- [ ] Document upload sections are visible:
  - [ ] Professional License
  - [ ] DEA Certificate (if applicable)
  - [ ] Malpractice Insurance
  - [ ] Board Certifications
  - [ ] W-9 Form
  - [ ] Liability Insurance
- [ ] NPI verification section is present
- [ ] Can enter NPI number
- [ ] "Verify NPI" button works
- [ ] Document upload buttons are functional
- [ ] Progress indicator shows completion percentage

**Test NPI Verification:**
1. Try a test NPI number: `1234567893` (standard test NPI format)
2. Click "Verify NPI"
3. Check for verification result or error message

**Test Document Upload:**
1. Click "Upload Document" for any section
2. Select a test file (PDF, image, etc.)
3. Verify file appears in the interface
4. Check for upload progress indicator

---

### 2. Admin Credentialing Dashboard (Admin View)

**URL:** http://localhost:5000/admin/credentialing

**Important:** You need an admin account to access this page.

**Creating Admin Account:**
Since the signup page only creates therapist accounts, we need to manually promote a user to admin:

1. First, create a regular account at http://localhost:5000/signup
   - Email: admin@therapyconnect.com
   - Password: admin123

2. Then we'll need to update the database to change the role to 'admin'
   - This requires database access (see below)

**Tests to perform (once you have admin access):**
- [ ] Dashboard loads without errors
- [ ] Can see list of all therapists
- [ ] Therapist cards show credentialing status
- [ ] Can filter by status (pending, approved, rejected)
- [ ] Can click on a therapist to view details
- [ ] Can see uploaded documents
- [ ] Can approve/reject credentials
- [ ] Can add notes/comments
- [ ] Statistics/metrics are displayed

---

### 3. Component Functionality Tests

#### Document Upload Component
- [ ] File selection works
- [ ] File type validation (should accept PDF, images)
- [ ] File size validation (check max size limits)
- [ ] Upload progress indicator
- [ ] Success/error messages display
- [ ] Can remove uploaded documents

#### NPI Verification
- [ ] Input field accepts 10-digit NPI
- [ ] Validation for correct NPI format
- [ ] API call to NPI registry
- [ ] Display verification results
- [ ] Error handling for invalid NPI

#### Credentialing Status
- [ ] Status badges display correctly
- [ ] Color coding for different statuses:
  - Not Started (gray)
  - In Progress (yellow)
  - Under Review (blue)
  - Approved (green)
  - Rejected (red)

---

## Database Setup (Required for Full Testing)

To test the full workflow including admin features, we need the database running:

### Start Database
```bash
# If using Docker:
docker-compose up -d

# Or if you have a separate PostgreSQL setup:
# Ensure PostgreSQL is running on localhost:5432
```

### Create Admin Account (After Database is Running)
```bash
npm run create-admin
# Or:
npx tsx scripts/create-admin.ts
```

This will create an admin account with:
- Email: admin@karematch.com
- Password: admin123

---

## API Endpoints to Test

You can use browser DevTools Network tab to monitor these:

### Credentialing Endpoints
- `POST /api/credentialing/submit` - Submit credentialing application
- `GET /api/credentialing/status/:therapistId` - Get status
- `POST /api/credentialing/documents/upload` - Upload document
- `GET /api/credentialing/documents/:therapistId` - Get documents
- `POST /api/credentialing/npi/verify` - Verify NPI
- `POST /api/credentialing/dea/validate` - Validate DEA
- `GET /api/credentialing/oig-sam/check/:npi` - Check exclusions

### Admin Endpoints
- `GET /api/admin/credentialing/applications` - List all applications
- `GET /api/admin/credentialing/application/:id` - Get specific application
- `POST /api/admin/credentialing/review` - Review application
- `POST /api/admin/credentialing/approve/:id` - Approve
- `POST /api/admin/credentialing/reject/:id` - Reject

---

## Common Issues & Troubleshooting

### "Not Authorized" Error
- Make sure you're logged in
- Check if your account has the correct role (therapist vs admin)
- Clear browser cookies and log in again

### Upload Failing
- Check file size (max usually 10MB)
- Verify file type is allowed (PDF, PNG, JPG)
- Check browser console for errors
- Verify server has write permissions

### NPI Verification Not Working
- Ensure server can reach external NPI registry API
- Check for API rate limits
- Verify NPI format (10 digits)

### Page Not Loading
- Check browser console for errors
- Verify server is running (http://localhost:5000)
- Check network tab for failed requests
- Try refreshing the page

---

## Next Steps After Testing

Once you've tested the UI in browser:

1. **Document any bugs found**
   - Create list of issues
   - Note steps to reproduce
   - Include screenshots if possible

2. **Verify integration points**
   - NPI Registry API
   - DEA validation
   - OIG/SAM exclusion checking
   - Document storage

3. **Test the complete workflow**
   - Therapist submits credentials
   - Admin reviews submission
   - Admin approves/rejects
   - Status updates correctly

4. **Performance testing**
   - Test with multiple documents
   - Test with large file sizes
   - Check page load times

---

## Quick Start Command

Just want to start testing immediately?

1. Open browser to: http://localhost:5000/signup
2. Create account
3. Navigate to: http://localhost:5000/provider-credentialing
4. Start uploading test documents and verifying functionality

**Server is already running on http://localhost:5000 (PID: 29052)**

---

## Questions or Issues?

If you encounter any issues during testing:
1. Check browser console (F12) for errors
2. Check server logs in the terminal where you ran `npm run dev`
3. Verify all environment variables are set correctly
4. Make sure database is running if testing admin features

Happy Testing! 🧪
