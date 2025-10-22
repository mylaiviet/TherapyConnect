# Document Upload Troubleshooting Guide

## Issue: "Upload failed" Error

You're seeing an "Upload failed" error when trying to upload documents in the Credentialing Portal.

## Quick Diagnosis Steps

### 1. Check Browser Console (Most Important!)
1. Open the credentialing page where you see the error
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Try uploading a document again
5. Look for error messages in red

**What to look for:**
- Network errors (500, 404, 401, etc.)
- JavaScript errors
- Failed fetch requests

### 2. Check Network Tab
1. In Developer Tools (F12), click the **Network** tab
2. Try uploading a document
3. Look for the request to `/api/therapist/credentialing/upload`
4. Click on it to see:
   - Status code (should be 200 for success)
   - Response body (will show the actual error message)
   - Request payload (verify file is being sent)

### 3. Check Server Logs
Look at your terminal where `npm run dev` is running. When you upload, you should see:
- `[Email] Email disabled - would have sent to...` (if emails are disabled)
- Any error messages starting with `Error uploading document:`

## Common Causes & Solutions

### ❌ Cause 1: Not Logged In
**Symptoms:** 401 Unauthorized error in console
**Solution:**
1. Log in to your account
2. Make sure you're logged in as a therapist

### ❌ Cause 2: No Therapist Profile
**Symptoms:** 404 error with message "Therapist profile not found"
**Solution:**
1. Complete therapist registration first
2. Check if your profile exists: Go to "My Profile" page

To check/create a therapist profile:
```bash
npm run create-test-accounts
```

### ❌ Cause 3: File Too Large
**Symptoms:** Error message "File size exceeds 10MB"
**Solution:**
- Use a smaller file (under 10MB)
- Compress the PDF or image

### ❌ Cause 4: Invalid File Type
**Symptoms:** Error message "Invalid file type"
**Solution:**
- Only use: PDF, JPG, PNG, GIF, DOC, or DOCX
- Check the file extension matches the actual file type

### ❌ Cause 5: Missing Required Fields
**Symptoms:** Error about missing document type or expiration date
**Solution:**
- Select a document type from the dropdown
- If the document type requires an expiration date (license, insurance, etc.), enter one

### ❌ Cause 6: Database Table Missing
**Symptoms:** Database error in server logs
**Solution:**
```bash
npm run db:push
```

### ❌ Cause 7: Uploads Directory Missing
**Symptoms:** File system error in server logs
**Solution:** Already fixed! The directory has been created.

## Step-by-Step Testing

### Option 1: Use Browser (Recommended)
1. Make sure server is running: `npm run dev`
2. Go to http://localhost:5000
3. Log in or create a therapist account
4. Navigate to Provider Credentialing
5. Try uploading a small PDF (under 1MB)
6. Check console (F12) for errors

### Option 2: Test with cURL (Advanced)
You need to be logged in first, then:
```bash
curl -X POST http://localhost:5000/api/therapist/credentialing/upload \\
  -H "Content-Type: multipart/form-data" \\
  -F "document=@/path/to/test.pdf" \\
  -F "documentType=license" \\
  --cookie "connect.sid=YOUR_SESSION_COOKIE"
```

## Debugging Checklist

- [ ] Server is running (`npm run dev`)
- [ ] Database schema is up to date (`npm run db:push`)
- [ ] Uploads directory exists (✅ Created)
- [ ] Logged in as a user
- [ ] User has a therapist profile
- [ ] File is under 10MB
- [ ] File type is allowed (PDF, JPG, PNG, GIF, DOC, DOCX)
- [ ] Document type is selected
- [ ] Expiration date is entered (if required)
- [ ] Browser console checked for errors
- [ ] Server logs checked for errors

## What I've Fixed So Far

✅ Created uploads directory structure
✅ Verified database schema exists
✅ Pushed latest schema to database
✅ Server is running and responding

## Next Steps for You

1. **Open your browser's Developer Tools (F12)**
2. **Go to the Console tab**
3. **Try uploading a document**
4. **Copy any error messages you see**

The error message will tell us exactly what's wrong. Common error messages:

- **"Therapist profile not found"** → Need to create/log in as therapist
- **"No file uploaded"** → File didn't attach properly
- **"Invalid file type"** → Wrong file format
- **401 Unauthorized** → Not logged in
- **500 Internal Server Error** → Check server logs

## Need More Help?

Share the error message from the browser console (F12), and I can help you fix it!
