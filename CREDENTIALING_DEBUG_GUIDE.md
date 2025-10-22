# Credentialing Function Debug Guide

## Overview

This guide helps you debug issues with the credentialing document upload system. The credentialing system has three main components:

1. **Frontend**: Document upload interface ([DocumentUploadInterface.tsx](client/src/components/credentialing/provider/DocumentUploadInterface.tsx))
2. **Backend**: Upload API endpoint ([routes.ts:831](server/routes.ts#L831))
3. **Storage**: File storage service ([documentStorage.ts](server/services/documentStorage.ts))

## Quick Diagnostics

Run the automated diagnostic tool to identify issues:

```bash
npm run debug-credentialing
```

Or manually:

```bash
npx dotenv-cli -e .env npx tsx scripts/debug-credentialing.ts
```

## Common Issues & Solutions

### 1. "Therapist profile not found" (404 Error)

**Cause**: User is not logged in as a therapist, or therapist profile doesn't exist in database.

**How to check**:
- Open browser console (F12) and check Network tab
- Look for the response from `/api/therapist/credentialing/upload`
- Status 404 with message "Therapist profile not found"

**Fix**:
```bash
# Option 1: Create a test therapist account
npm run create-therapist-test-account

# Option 2: Check if you're logged in
# Go to /api/user in browser - should return user data
```

**Code location**: [server/routes.ts:833-837](server/routes.ts#L833-L837)

---

### 2. "No file uploaded" (400 Error)

**Cause**: File input is empty or `req.file` is undefined.

**How to check**:
- Browser console (F12) → Network tab
- Check the upload request payload
- Ensure FormData contains a file with key "document"

**Common causes**:
- File input not properly wired to state
- FormData append using wrong key (should be "document")
- Multer middleware not processing the file

**Fix**:
1. Check frontend code ensures file is selected:
   ```typescript
   // client/src/components/credentialing/provider/DocumentUploadInterface.tsx:166
   const formData = new FormData();
   formData.append("document", selectedFile); // Must use "document" key
   ```

2. Check multer is configured correctly:
   ```typescript
   // server/routes.ts:816-831
   const upload = multer({
     storage: multer.memoryStorage(),
     limits: { fileSize: MAX_FILE_SIZE },
   });

   app.post("/api/therapist/credentialing/upload",
     requireAuth,
     upload.single('document'), // Must match FormData key
     async (req, res) => { ... }
   );
   ```

**Code location**: [server/routes.ts:839-841](server/routes.ts#L839-L841)

---

### 3. "Document type is required" (400 Error)

**Cause**: `documentType` field is missing from the request body.

**How to check**:
- Browser console → Network tab → Request payload
- Check that `documentType` is included in FormData

**Fix**:
Ensure the frontend sends documentType:
```typescript
// Must select a document type before uploading
formData.append("documentType", documentType);
```

**Code location**: [server/routes.ts:845-847](server/routes.ts#L845-L847)

---

### 4. "Invalid file type" Error

**Cause**: File MIME type is not in the allowed list.

**Allowed file types**:
- PDF: `application/pdf`
- JPEG: `image/jpeg`, `image/jpg`
- PNG: `image/png`
- GIF: `image/gif`
- Word: `application/msword` (DOC)
- Word: `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)

**How to check**:
```typescript
// Check file.mimetype in server logs
console.log('File MIME type:', req.file.mimetype);
```

**Fix**:
- Ensure file has correct extension
- Some files may have incorrect MIME types
- Use PDF for best compatibility

**Code location**: [server/services/documentStorage.ts:69-76](server/services/documentStorage.ts#L69-L76)

---

### 5. "File too large" Error

**Cause**: File exceeds 10MB limit.

**How to check**:
```typescript
console.log('File size:', req.file.size / 1024 / 1024, 'MB');
```

**Fix**:
- Compress the file
- For PDFs: Use online PDF compressor
- For images: Resize or reduce quality
- Maximum allowed: 10MB (10 * 1024 * 1024 bytes)

**Code location**:
- [server/services/documentStorage.ts:22](server/services/documentStorage.ts#L22)
- [server/services/documentStorage.ts:78-83](server/services/documentStorage.ts#L78-L83)

---

### 6. "Failed to upload document" (500 Error)

**Cause**: Server-side error during file processing or database insertion.

**How to check**:
1. Check server logs in terminal where `npm run dev` is running
2. Look for stack trace with detailed error

**Common causes**:

#### A. Uploads directory not writable
```bash
# Check directory exists
ls -la uploads/credentialing

# On Windows
dir uploads\credentialing

# Create if missing
mkdir -p uploads/credentialing
```

#### B. Database error
```bash
# Ensure tables exist
npm run db:push

# Check database connection
# Verify DATABASE_URL in .env
```

#### C. documentStorage service error
Check server logs for specific error from:
- [server/services/documentStorage.ts:92-108](server/services/documentStorage.ts#L92-L108)

**Code location**: [server/routes.ts:882-885](server/routes.ts#L882-L885)

---

### 7. Upload succeeds but document doesn't appear

**Cause**: Frontend cache not invalidated or query not refetching.

**How to check**:
```typescript
// After successful upload, check if queries are invalidated
// client/src/components/credentialing/provider/DocumentUploadInterface.tsx:86-92
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: ["/api/therapist/credentialing/documents"],
  });
  queryClient.invalidateQueries({
    queryKey: ["/api/therapist/credentialing/status"],
  });
}
```

**Fix**:
1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Check Network tab to see if queries are refetching
3. Verify the document exists in database:
   ```sql
   SELECT * FROM credentialing_documents ORDER BY uploaded_at DESC LIMIT 10;
   ```

---

### 8. Missing expiration date for licenses/insurance

**Cause**: Documents like licenses and insurance require expiration dates.

**Documents requiring expiration dates**:
- Professional License
- Government ID
- Liability Insurance
- DEA Certificate
- Board Certification

**Fix**:
- Ensure the expiration date field is filled
- Date must be in the future
- Frontend validates this: [DocumentUploadInterface.tsx:159-163](client/src/components/credentialing/provider/DocumentUploadInterface.tsx#L159-L163)

---

## Debug Workflow

### Step 1: Run Diagnostics
```bash
npx dotenv-cli -e .env npx tsx scripts/debug-credentialing.ts
```

This checks:
- Database connection
- Database schema (tables exist)
- Uploads directory
- Environment variables
- Therapist accounts
- Existing documents

### Step 2: Check Frontend (Browser)

1. Open browser DevTools (F12)
2. Go to Console tab - check for errors
3. Go to Network tab
4. Try uploading a document
5. Check the upload request:
   - **Method**: POST
   - **URL**: `/api/therapist/credentialing/upload`
   - **Request Headers**: Should include Cookie (session)
   - **Request Payload**: FormData with:
     - `document`: (binary file)
     - `documentType`: string
     - `expirationDate`: string (if applicable)

### Step 3: Check Backend (Server Logs)

Look for these log messages:
```
[Credentialing] Document uploaded by therapist {id}
[Credentialing] File saved to: {path}
```

Or errors:
```
Error uploading document: {error message}
```

### Step 4: Check Database

```sql
-- Check therapist profile exists
SELECT id, first_name, last_name, credentialing_status
FROM therapists
WHERE id = 'your-therapist-id';

-- Check uploaded documents
SELECT id, therapist_id, document_type, file_name, uploaded_at, verified
FROM credentialing_documents
ORDER BY uploaded_at DESC
LIMIT 10;
```

### Step 5: Check File System

```bash
# On Linux/Mac
ls -lah uploads/credentialing/

# On Windows
dir uploads\credentialing\

# Check specific therapist folder
ls -lah uploads/credentialing/{therapist-id}/
```

---

## Testing Upload End-to-End

### Manual Test:

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Create/login as therapist**:
   ```bash
   npm run create-therapist-test-account
   # Or login with existing credentials
   ```

3. **Navigate to credentialing page**:
   - Go to: `http://localhost:5000/provider-credentialing`

4. **Upload a test document**:
   - Select document type: "Professional License"
   - Choose a PDF file (< 10MB)
   - Set expiration date (future date)
   - Click "Upload Document"

5. **Verify success**:
   - Check for success toast notification
   - Document should appear in "Recently Uploaded" section
   - Check server logs for confirmation

### Automated Test:

```bash
# Run the test upload script
npx dotenv-cli -e .env npx tsx scripts/test-upload-endpoint.ts
```

---

## Code Architecture

### Upload Flow:

1. **User selects file** → [DocumentUploadInterface.tsx:117-145](client/src/components/credentialing/provider/DocumentUploadInterface.tsx#L117-L145)
   - Validates file type
   - Validates file size
   - Sets `selectedFile` state

2. **User clicks Upload** → [DocumentUploadInterface.tsx:147-174](client/src/components/credentialing/provider/DocumentUploadInterface.tsx#L147-L174)
   - Validates document type
   - Validates expiration date (if required)
   - Creates FormData
   - Calls mutation

3. **Frontend sends POST** → [DocumentUploadInterface.tsx:71-85](client/src/components/credentialing/provider/DocumentUploadInterface.tsx#L71-L85)
   - POST to `/api/therapist/credentialing/upload`
   - Includes credentials (session cookie)
   - FormData with file + metadata

4. **Backend receives request** → [routes.ts:831](server/routes.ts#L831)
   - `requireAuth` middleware validates session
   - `upload.single('document')` multer middleware processes file
   - Main handler executes

5. **Backend validates** → [routes.ts:833-847](server/routes.ts#L833-L847)
   - Checks therapist profile exists
   - Validates file exists
   - Validates document type

6. **Backend saves file** → [routes.ts:850-856](server/routes.ts#L850-L856)
   - Calls `documentStorage.uploadFile()`
   - Saves to `uploads/credentialing/{therapistId}/`
   - Generates unique filename

7. **Backend saves to database** → [routes.ts:858-868](server/routes.ts#L858-L868)
   - Inserts into `credentialing_documents` table
   - Stores metadata (type, size, URL, expiration, etc.)

8. **Backend sends notification** → [routes.ts:871-875](server/routes.ts#L871-L875)
   - Sends email notification (non-blocking)
   - Logs upload event

9. **Backend responds** → [routes.ts:877-881](server/routes.ts#L877-L881)
   - Returns success + document data
   - Frontend receives response

10. **Frontend updates UI** → [DocumentUploadInterface.tsx:86-107](client/src/components/credentialing/provider/DocumentUploadInterface.tsx#L86-L107)
    - Invalidates queries (refetch documents)
    - Shows success toast
    - Resets form
    - Document appears in list

---

## Environment Variables

Required in `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Session
SESSION_SECRET=your-secret-key-here

# Storage (optional, defaults to 'local')
STORAGE_BACKEND=local
UPLOADS_PATH=./uploads
```

---

## Key Files Reference

### Frontend:
- [client/src/pages/provider-credentialing.tsx](client/src/pages/provider-credentialing.tsx) - Main page
- [client/src/components/credentialing/provider/DocumentUploadInterface.tsx](client/src/components/credentialing/provider/DocumentUploadInterface.tsx) - Upload component

### Backend:
- [server/routes.ts:831-886](server/routes.ts#L831-L886) - Upload endpoint
- [server/services/documentStorage.ts](server/services/documentStorage.ts) - File storage service
- [server/services/credentialingService.ts](server/services/credentialingService.ts) - Credentialing workflow
- [server/services/credentialingNotifications.ts](server/services/credentialingNotifications.ts) - Email notifications

### Schema:
- [shared/schema.ts:986-1001](shared/schema.ts#L986-L1001) - credentialingDocuments table
- [shared/schema.ts:1127-1131](shared/schema.ts#L1127-L1131) - Zod validation schema

### Scripts:
- [scripts/debug-credentialing.ts](scripts/debug-credentialing.ts) - Diagnostic tool
- [scripts/test-upload-endpoint.ts](scripts/test-upload-endpoint.ts) - Upload testing

---

## Getting Help

If you're still having issues after following this guide:

1. **Check server logs** for detailed error messages
2. **Check browser console** for frontend errors
3. **Run diagnostics**: `npx dotenv-cli -e .env npx tsx scripts/debug-credentialing.ts`
4. **Check database** to see if data is being saved
5. **Check file system** to see if files are being written

**Most common issue**: Not logged in as a therapist. Create a test account with:
```bash
npm run create-therapist-test-account
```
