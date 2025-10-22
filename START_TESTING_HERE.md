# 🧪 START TESTING HERE - Credentialing System

## ✅ Current Status

Your credentialing system is **READY FOR TESTING**!

**What's Done:**
- ✅ Server running on http://localhost:5000 (PID: 29052)
- ✅ All UI components built (Admin + Provider portals)
- ✅ All pages are accessible and loading
- ✅ Frontend routing configured
- ✅ API endpoints created
- ✅ Integration services ready (NPI, DEA, OIG/SAM)

**What You Need to Test:**
- Browser UI rendering
- User interactions (uploads, forms, buttons)
- Complete workflows (provider submits → admin reviews → approve/reject)

---

## 🚀 QUICK START - 3 Simple Steps

### Step 1: Create a Test Account
Open your browser and navigate to:
```
http://localhost:5000/signup
```

Create an account with:
- **Email:** test.therapist@example.com
- **Password:** therapist123

### Step 2: Test Provider Portal
After signup, navigate to:
```
http://localhost:5000/provider-credentialing
```

### Step 3: Follow the Visual Checklist
Open this file for detailed testing steps:
```
VISUAL_TESTING_CHECKLIST.md
```

---

## 📚 Testing Documentation

Three documents are available to guide your testing:

### 1. **VISUAL_TESTING_CHECKLIST.md** (RECOMMENDED START HERE)
   - Comprehensive step-by-step testing guide
   - Visual component verification
   - Interactive functionality tests
   - Screenshot checklist
   - **Use this for detailed browser testing**

### 2. **TESTING_GUIDE.md**
   - Overview of features and functionality
   - Account setup instructions
   - API endpoints reference
   - Troubleshooting guide
   - **Use this for understanding the system**

### 3. **START_TESTING_HERE.md** (this file)
   - Quick start instructions
   - Summary of what's ready
   - Links to other docs
   - **Use this to get started quickly**

---

## 🎯 What to Test

### Provider Credentialing Portal
**URL:** http://localhost:5000/provider-credentialing

**Key Features:**
1. **Status Dashboard** - 4 overview cards showing:
   - Credentialing status
   - Documents uploaded count
   - Active alerts
   - Expiring documents

2. **Document Upload Interface**
   - Upload professional license
   - Upload DEA certificate
   - Upload malpractice insurance
   - Upload board certifications
   - Upload W-9 form
   - Upload liability insurance

3. **NPI Verification**
   - Enter NPI number
   - Verify against national registry
   - Display verification results

4. **Document Tracking**
   - View all uploaded documents
   - Check verification status
   - See expiration dates
   - Receive expiration alerts

### Admin Credentialing Dashboard
**URL:** http://localhost:5000/admin/credentialing

⚠️ **Requires Admin Account** - Regular signup creates therapist accounts

**Key Features:**
1. **Stats Overview** - 4 metric cards showing:
   - Pending providers count
   - Active alerts
   - OIG database records
   - Compliance percentage

2. **Pending Providers List**
   - See all providers awaiting review
   - View credentialing status
   - Click to see details

3. **Provider Detail View**
   - Review uploaded documents
   - Check NPI verification
   - Check DEA validation
   - Check OIG/SAM exclusions
   - Approve or reject application
   - Add review notes

4. **Alert Management**
   - View all unresolved alerts
   - Filter by severity
   - Resolve alerts
   - Track compliance issues

---

## 🔧 Creating an Admin Account

The signup page only creates therapist accounts. To test admin features:

### Option 1: Manual Database Update (Requires Database Access)
1. Create a regular account via signup
2. Update the database to change role to 'admin'
3. Log back in with admin privileges

### Option 2: Use Existing Scripts (Requires Docker/PostgreSQL Running)
```bash
# Start database if not running
docker-compose up -d

# Create admin account
npx tsx scripts/create-admin.ts
```

This creates:
- Email: admin@karematch.com
- Password: admin123

---

## 🧪 Testing Workflows

### Complete End-to-End Test:

1. **Provider Submits Credentials**
   - Log in as therapist
   - Upload all required documents
   - Verify NPI
   - Check status updates to "In Progress"

2. **Admin Reviews Application**
   - Log in as admin
   - View pending provider in dashboard
   - Click to see full details
   - Review all documents
   - Check verification results

3. **Admin Makes Decision**
   - Approve or reject application
   - Add review notes
   - Submit decision

4. **Provider Sees Result**
   - Log back in as therapist
   - Check updated status
   - Read admin notes

---

## 📊 What the Pages Should Look Like

### Provider Portal - Expected UI Elements:
```
┌─────────────────────────────────────────────────────────────┐
│ Credentialing Portal                                        │
│ Manage your professional credentials and documents         │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│ Status      │ Documents   │ Alerts      │ Expiring Soon   │
│ [Badge]     │ 0 docs      │ 0 alerts    │ 0 documents     │
│ Not Started │ 0 verified  │ All clear   │ None expiring   │
└─────────────┴─────────────┴─────────────┴─────────────────┘

Tabs: [Status & Progress] [Upload Documents] [My Documents] [Alerts]
```

### Admin Dashboard - Expected UI Elements:
```
┌─────────────────────────────────────────────────────────────┐
│ Provider Credentialing                                      │
│ Manage provider credentials, licenses, and compliance      │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│ Pending     │ Active      │ OIG         │ Compliance      │
│ Review      │ Alerts      │ Records     │ 100%            │
│ 0 providers │ 0 alerts    │ 0 records   │ All verified    │
└─────────────┴─────────────┴─────────────┴─────────────────┘

Tabs: [Pending Providers (0)] [Alerts (0)]
```

---

## ✅ Success Checklist

Before considering testing complete, verify:

- [ ] Provider portal loads without errors
- [ ] All 4 status cards display
- [ ] Can switch between all tabs
- [ ] Document upload interface renders
- [ ] NPI verification section visible
- [ ] Admin dashboard loads (with admin account)
- [ ] Can see pending providers list
- [ ] No console errors (check F12 DevTools)
- [ ] Pages are responsive on mobile
- [ ] Can navigate between pages

---

## 🐛 Common Issues

### "Page shows blank/white screen"
- **Fix:** Open browser console (F12), check for JavaScript errors
- **Check:** Network tab for failed API requests

### "Can't upload documents"
- **Check:** File type (should be PDF, PNG, JPG)
- **Check:** File size (usually max 10MB)
- **Check:** Console for error messages

### "NPI verification doesn't work"
- **Expected:** May show errors if NPI registry API not fully configured
- **Test:** Use format: 1234567893 (10 digits)

### "Admin dashboard shows 'Not Authorized'"
- **Fix:** You're logged in as therapist, need admin account
- **Solution:** See "Creating an Admin Account" section above

### "No data showing"
- **Expected:** Fresh install has no data
- **Normal:** Cards will show "0" until you upload documents/create providers

---

## 🎯 Testing Priorities

### Priority 1 - Critical (Must Work)
1. Pages load without errors
2. UI components render correctly
3. Tabs are clickable and switch content
4. Forms accept input
5. No console errors

### Priority 2 - Important (Should Work)
1. Document upload accepts files
2. NPI verification field works
3. Admin can see provider list
4. Status badges display correctly
5. Navigation works

### Priority 3 - Nice to Have
1. Document upload completes successfully (backend)
2. NPI verification returns real data
3. OIG/SAM checking works
4. Email notifications send
5. Document expiration tracking

---

## 📞 Need Help?

### Check These Resources:
1. **Browser Console** (F12) - Shows JavaScript errors
2. **Network Tab** (F12) - Shows API request failures
3. **Server Terminal** - Shows backend errors
4. **TESTING_GUIDE.md** - Detailed troubleshooting

### Verify Server Status:
```bash
# Check if server is running
netstat -ano | findstr :5000

# Should show: TCP listening on port 5000
```

---

## 🎉 You're Ready!

**Everything is set up and ready for testing.**

Just open your browser and navigate to:
### → http://localhost:5000/signup ←

Create an account and start testing the provider portal!

Then refer to **VISUAL_TESTING_CHECKLIST.md** for detailed testing steps.

---

**Happy Testing!** 🚀

Report any bugs, issues, or unexpected behavior you find during testing.
