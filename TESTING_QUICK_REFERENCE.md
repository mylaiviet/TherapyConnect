# 🎯 Testing Quick Reference

## ⚡ Quick Start (30 seconds)

1. Open browser → http://localhost:5000/signup
2. Create account (any email/password)
3. Go to → http://localhost:5000/provider-credentialing
4. Start testing!

---

## 🔗 URLs to Test

| Page | URL | Requires Login? |
|------|-----|-----------------|
| **Signup** | http://localhost:5000/signup | No |
| **Login** | http://localhost:5000/login | No |
| **Provider Portal** | http://localhost:5000/provider-credentialing | Yes (Therapist) |
| **Admin Dashboard** | http://localhost:5000/admin/credentialing | Yes (Admin) |

---

## 📋 What Should You See?

### Provider Portal - First Load
```
✅ 4 status cards across the top
✅ "Credentialing Portal" title
✅ Tabs: Status & Progress | Upload Documents | My Documents
✅ No JavaScript errors in console (F12)
```

### Admin Dashboard - First Load
```
✅ 4 stats cards: Pending Review | Active Alerts | OIG Records | Compliance
✅ "Provider Credentialing" title
✅ Tabs: Pending Providers | Alerts
✅ Empty state (no providers yet)
```

---

## ✅ Quick Test Checklist

**5-Minute Basic Test:**
- [ ] Signup page loads and works
- [ ] Can create account
- [ ] Provider portal loads without errors
- [ ] Can see 4 status cards
- [ ] Tabs are clickable and switch content
- [ ] No console errors (F12)

**10-Minute Feature Test:**
- [ ] Upload Documents tab renders properly
- [ ] NPI verification section is visible
- [ ] My Documents tab shows document list
- [ ] Can click upload buttons
- [ ] Forms accept input
- [ ] Page is responsive (resize browser)

**30-Minute Full Test:**
- [ ] Complete all items from VISUAL_TESTING_CHECKLIST.md

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| **Blank page** | Check console (F12) for errors |
| **Can't log in** | Create new account via /signup |
| **"Not Authorized"** | Page requires admin, you're logged in as therapist |
| **Upload fails** | Check file type (PDF/PNG/JPG) and size (<10MB) |
| **No data shows** | Normal for fresh install, will show "0" |
| **Tabs don't work** | Check console for React errors |

---

## 📖 Documentation Files

| File | Use When |
|------|----------|
| **START_TESTING_HERE.md** | You want overview and quick start |
| **VISUAL_TESTING_CHECKLIST.md** | You're doing thorough browser testing |
| **TESTING_GUIDE.md** | You need feature details or troubleshooting |
| **TESTING_QUICK_REFERENCE.md** | You need quick answers (this file!) |

---

## 🎨 Expected Components

### Provider Portal Components:
- CredentialingStatusTracker
- DocumentUploadInterface
- RequiredDocumentsChecklist
- ExpirationReminders

### Admin Dashboard Components:
- PendingProvidersList
- CredentialingDetailView
- AlertManagementPanel

---

## 🔍 Console Commands for Testing

**Check server status:**
```bash
netstat -ano | findstr :5000
```

**View testing summary:**
```bash
npx tsx scripts/testing-summary.ts
```

**Test page accessibility:**
```bash
npx tsx scripts/test-ui-pages.ts
```

---

## 📊 Success Criteria

**✅ PASS:** Pages load, UI renders, tabs work, no console errors
**⚠️ PARTIAL:** Pages load but some features don't work
**❌ FAIL:** Pages don't load or have critical errors

---

## 🚀 Next Steps After Testing

1. Document any bugs found
2. Test on different browsers (Chrome, Firefox, Safari)
3. Test on mobile devices
4. Try different screen sizes
5. Report results

---

**Need more detail?** → See VISUAL_TESTING_CHECKLIST.md

**Ready to test?** → Open http://localhost:5000/signup
