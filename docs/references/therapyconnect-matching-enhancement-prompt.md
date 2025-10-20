# TherapyConnect: Add Missing Therapist Matching Data Fields

## TASK: Enhance the therapist profile system to collect and display critical matching data currently missing from the application.

## CONTEXT
The TherapyConnect application currently collects therapist data through a multi-step questionnaire but is missing critical fields needed for effective patient-therapist matching. The application uses:
- PostgreSQL database with Drizzle ORM
- React frontend with TypeScript
- Express backend
- Schema defined in `shared/schema.ts`

## CURRENT STATE ANALYSIS
All currently displayed therapist information has corresponding questionnaire fields. However, the following critical matching factors are missing entirely from the system.

## REQUIRED CHANGES

### 1. DATABASE SCHEMA UPDATES (`shared/schema.ts`)

Add these columns to the `therapists` table:

```typescript
// Demographics & Identity
gender: text().notNull().default(''), // Options: Male, Female, Non-binary, Other, Prefer not to say
dateOfBirth: date(), // For calculating age
raceEthnicity: text().array().default(sql`ARRAY[]::text[]`), // Multiple selections allowed
religiousOrientation: text(), // For faith-based counseling matching

// Photo (already has photoUrl field but needs implementation)
// photoUrl: text() - ALREADY EXISTS, needs upload functionality

// Pronouns - ALREADY EXISTS but not displayed
// pronouns: text() - ALREADY EXISTS, add to profile display

// Clinical Expertise
certifications: text().array().default(sql`ARRAY[]::text[]`), // EMDR, DBT, CBT, etc.
supervisesInterns: boolean().default(false),
crisisAvailability: boolean().default(false), // Available for emergency sessions

// Accessibility
wheelchairAccessible: boolean().default(false),
aslCapable: boolean().default(false),
virtualPlatforms: text().array().default(sql`ARRAY[]::text[]`), // Zoom, Google Meet, etc.
interstateLicenses: text().array().default(sql`ARRAY[]::text[]`), // States where licensed for teletherapy

// Client Preferences (what therapist prefers)
preferredClientAges: text().array().default(sql`ARRAY[]::text[]`),
conditionsNotTreated: text().array().default(sql`ARRAY[]::text[]`), // Exclusions
severityLevelsAccepted: text().array().default(sql`ARRAY[]::text[]`), // mild, moderate, severe

// Financial Details
consultationOffered: boolean().default(false),
consultationFee: integer().default(0), // 0 if free
superbillProvided: boolean().default(false),
fsaHsaAccepted: boolean().default(false),
paymentPlanAvailable: boolean().default(false),

// Scheduling Specifics
sessionLengthOptions: text().array().default(sql`ARRAY[]::text[]`), // 30, 45, 60, 90 minutes
averageResponseTime: text(), // "Within 24 hours", "Within 48 hours", etc.
currentWaitlistWeeks: integer().default(0),

// Quality Metrics (for matching algorithm)
yearsSinceGraduation: integer(),
clientRetentionRate: decimal({ precision: 5, scale: 2 }), // Percentage
primaryTheoreticalOrientation: text(), // Main approach vs. multiple approaches
```

### 2. QUESTIONNAIRE UPDATES

Add new fields to the appropriate questionnaire steps:

**Step 1 (Basic Information) - ADD:**
- Gender (dropdown)
- Date of Birth (date picker)
- Photo Upload (file upload)
- Display Pronouns field (already collected)

**Step 2 (Practice Details) - ADD:**
- Race/Ethnicity (multi-select checkboxes)
- Religious/Spiritual Orientation (optional text)
- Primary Theoretical Orientation (dropdown)
- Certifications (multi-select or tag input)
- Conditions NOT Treated (multi-select)
- Preferred Client Ages (multi-select)
- Severity Levels Accepted (checkboxes: mild, moderate, severe)

**Step 3 (Credentials) - ADD:**
- Interstate Licenses (multi-select states)
- Supervises Interns (yes/no)
- Years Since Graduation (calculate from graduation year)

**Step 4 (Availability & Fees) - ADD:**
- Session Length Options (checkboxes: 30, 45, 60, 90 min)
- Free Consultation Offered (yes/no)
- Consultation Fee (if not free)
- Crisis/Emergency Availability (yes/no)
- Average Response Time (dropdown)
- Current Waitlist Length (number input in weeks)
- Superbill Provided (yes/no)
- FSA/HSA Accepted (yes/no)
- Payment Plans Available (yes/no)

**New Step 5 (Accessibility & Virtual) - CREATE:**
- Office Wheelchair Accessible (yes/no)
- ASL/Sign Language Capable (yes/no)
- Virtual Platform(s) Used (multi-select)
- Neurodiversity Accommodations (text)
- Service Animal Friendly (yes/no)

### 3. PROFILE DISPLAY UPDATES

Add to public therapist profile display:
- Gender
- Age (calculated from DOB, not showing actual DOB)
- Pronouns (currently hidden)
- Race/Ethnicity
- Certifications
- Session Length Options
- Consultation Availability & Fee
- Waitlist Status
- Virtual Platforms
- Interstate Coverage
- Accessibility Features

### 4. MATCHING ALGORITHM ENHANCEMENTS (`server/services/therapistMatcher.ts`)

Update the `calculateMatchScore` function to include:

```typescript
// Add to scoring algorithm:

// Gender preference match (if user specified)
if (userPrefs.therapistGenderPreference && therapist.gender) {
  if (therapist.gender === userPrefs.therapistGenderPreference) {
    score += 15;
    reasons.push('Gender preference match');
  }
}

// Cultural/ethnic match (if user requested)
if (userPrefs.culturalMatchRequested && therapist.raceEthnicity) {
  const hasMatch = therapist.raceEthnicity.some(ethnicity => 
    userPrefs.userEthnicity?.includes(ethnicity)
  );
  if (hasMatch) {
    score += 20;
    reasons.push('Cultural background match');
  }
}

// Certification match for specific issues
if (userPrefs.specificIssue && therapist.certifications) {
  const relevantCerts = mapIssueToCertifications(userPrefs.specificIssue);
  const hasCert = therapist.certifications.some(cert => 
    relevantCerts.includes(cert)
  );
  if (hasCert) {
    score += 25;
    reasons.push('Specialized certification for your needs');
  }
}

// Availability match
if (userPrefs.needsImmediate && therapist.currentWaitlistWeeks === 0) {
  score += 10;
  reasons.push('Available immediately');
}

// Session length preference
if (userPrefs.preferredSessionLength && therapist.sessionLengthOptions?.includes(userPrefs.preferredSessionLength)) {
  score += 5;
  reasons.push('Offers your preferred session length');
}
```

### 5. CHATBOT UPDATES (`server/services/stateMachine.ts`)

Update the chatbot conversation flow to collect:

**Demographics stage - ADD:**
```typescript
{
  content: 'Do you have a preference for your therapist\'s gender?',
  hasButtonOptions: true,
  buttonOptions: [
    { id: '1', label: 'Male', value: 'Male' },
    { id: '2', label: 'Female', value: 'Female' },
    { id: '3', label: 'Non-binary', value: 'Non-binary' },
    { id: '4', label: 'No preference', value: 'any' },
  ],
  fieldName: 'therapistGenderPreference',
},
{
  content: 'Would you like a therapist who shares your cultural or ethnic background?',
  hasButtonOptions: true,
  buttonOptions: [
    { id: '1', label: 'Yes, strongly prefer', value: 'required' },
    { id: '2', label: 'Would be nice', value: 'preferred' },
    { id: '3', label: 'No preference', value: 'none' },
  ],
  fieldName: 'culturalMatchPreference',
}
```

**Preferences stage - ADD:**
```typescript
{
  content: 'How long would you prefer your sessions to be?',
  hasButtonOptions: true,
  buttonOptions: [
    { id: '1', label: '30 minutes', value: '30' },
    { id: '2', label: '45 minutes', value: '45' },
    { id: '3', label: '60 minutes', value: '60' },
    { id: '4', label: 'No preference', value: 'any' },
  ],
  fieldName: 'sessionLengthPreference',
}
```

### 6. SEARCH FILTERS UPDATE

Add to the therapist search page filters:
- Gender filter
- Age range filter
- Certifications filter
- Availability filter (immediate vs. waitlist)
- Session length filter
- Accessibility filters

### 7. DOCUMENT & FILE UPLOAD SYSTEM

#### A. Database Schema for Documents

Add new table for document storage:

```typescript
// In shared/schema.ts - Add new table
export const therapistDocuments = pgTable("therapist_documents", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(), // 'license', 'certification', 'insurance', 'diploma', 'other'
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  mimeType: text("mime_type").notNull(),
  isVerified: boolean("is_verified").default(false), // Admin verification
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  expirationDate: date("expiration_date"), // For licenses/certifications
  metadata: jsonb("metadata"), // Additional document info
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Add to therapists table
professionalDocuments: text().array().default(sql`ARRAY[]::text[]`), // Array of document IDs
profilePhotos: text().array().default(sql`ARRAY[]::text[]`), // Multiple photos
officePhotos: text().array().default(sql`ARRAY[]::text[]`), // Office environment photos
```

#### B. Photo Upload Implementation

```typescript
// Multiple photo types support
const handlePhotoUpload = async (file: File, photoType: 'profile' | 'office' | 'certificate') => {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('type', photoType);
  
  const response = await fetch('/api/therapist/upload-photo', {
    method: 'POST',
    body: formData,
  });
  
  const { photoUrl, photoId } = await response.json();
  
  // Update appropriate field based on type
  if (photoType === 'profile') {
    setFormData({ ...formData, photoUrl });
  } else if (photoType === 'office') {
    setFormData({ 
      ...formData, 
      officePhotos: [...(formData.officePhotos || []), photoUrl] 
    });
  }
};
```

#### C. Document Upload Implementation

```typescript
// Frontend component for document upload
const DocumentUpload = ({ therapistId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  
  const handleDocumentUpload = async (file: File, documentType: string) => {
    setUploading(true);
    
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    formData.append('therapistId', therapistId);
    
    try {
      const response = await fetch('/api/therapist/upload-document', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      onUploadComplete(result);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="document-upload">
      <h3>Upload Professional Documents</h3>
      
      {/* License Upload */}
      <div className="upload-section">
        <label>Professional License</label>
        <input 
          type="file" 
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => e.target.files?.[0] && 
            handleDocumentUpload(e.target.files[0], 'license')}
        />
      </div>
      
      {/* Certification Upload */}
      <div className="upload-section">
        <label>Certifications (EMDR, DBT, etc.)</label>
        <input 
          type="file" 
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          onChange={(e) => {
            Array.from(e.target.files || []).forEach(file => 
              handleDocumentUpload(file, 'certification')
            );
          }}
        />
      </div>
      
      {/* Insurance Documentation */}
      <div className="upload-section">
        <label>Insurance/Liability Documentation</label>
        <input 
          type="file" 
          accept=".pdf"
          onChange={(e) => e.target.files?.[0] && 
            handleDocumentUpload(e.target.files[0], 'insurance')}
        />
      </div>
      
      {/* Diploma/Degree */}
      <div className="upload-section">
        <label>Graduate Degree/Diploma</label>
        <input 
          type="file" 
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => e.target.files?.[0] && 
            handleDocumentUpload(e.target.files[0], 'diploma')}
        />
      </div>
    </div>
  );
};
```

#### D. Backend Upload Endpoints

```typescript
// In routes.ts - Add multer configuration
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Photo upload endpoint
app.post("/api/therapist/upload-photo", requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const file = req.file;
    const photoType = req.body.type; // 'profile', 'office', 'certificate'
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    // Generate unique filename
    const fileKey = `therapists/${req.session.userId}/${photoType}/${crypto.randomBytes(16).toString('hex')}-${file.originalname}`;
    
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        therapistId: req.session.userId,
        photoType: photoType,
      }
    });
    
    await s3Client.send(command);
    
    const photoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
    
    // Update therapist profile based on photo type
    if (photoType === 'profile') {
      await storage.updateTherapist(req.session.userId, { photoUrl });
    } else if (photoType === 'office') {
      const therapist = await storage.getTherapistByUserId(req.session.userId);
      const officePhotos = [...(therapist.officePhotos || []), photoUrl];
      await storage.updateTherapist(req.session.userId, { officePhotos });
    }
    
    res.json({ photoUrl, success: true });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Document upload endpoint
app.post("/api/therapist/upload-document", requireAuth, upload.single('document'), async (req, res) => {
  try {
    const file = req.file;
    const { documentType } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    // Generate unique filename
    const fileKey = `therapists/${req.session.userId}/documents/${crypto.randomBytes(16).toString('hex')}-${file.originalname}`;
    
    // Upload to S3 with encryption
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ServerSideEncryption: 'AES256', // Enable encryption for sensitive documents
      Metadata: {
        therapistId: req.session.userId,
        documentType: documentType,
        originalName: file.originalname,
      }
    });
    
    await s3Client.send(command);
    
    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
    
    // Save document record to database
    const [document] = await db.insert(therapistDocuments).values({
      therapistId: req.session.userId,
      documentType,
      fileName: file.originalname,
      fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
      metadata: {
        uploadedAt: new Date().toISOString(),
        ipAddress: req.ip,
      }
    }).returning();
    
    res.json({ 
      documentId: document.id,
      fileUrl,
      fileName: file.originalname,
      success: true 
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get therapist documents
app.get("/api/therapist/documents", requireAuth, async (req, res) => {
  try {
    const documents = await db
      .select()
      .from(therapistDocuments)
      .where(eq(therapistDocuments.therapistId, req.session.userId))
      .orderBy(desc(therapistDocuments.createdAt));
    
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Delete document
app.delete("/api/therapist/documents/:id", requireAuth, async (req, res) => {
  try {
    // Verify ownership
    const [document] = await db
      .select()
      .from(therapistDocuments)
      .where(and(
        eq(therapistDocuments.id, req.params.id),
        eq(therapistDocuments.therapistId, req.session.userId)
      ));
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Delete from database
    await db
      .delete(therapistDocuments)
      .where(eq(therapistDocuments.id, req.params.id));
    
    // TODO: Also delete from S3
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Admin verify document
app.post("/api/admin/documents/:id/verify", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [document] = await db
      .update(therapistDocuments)
      .set({
        isVerified: true,
        verifiedBy: req.session.userId,
        verifiedAt: new Date(),
      })
      .where(eq(therapistDocuments.id, req.params.id))
      .returning();
    
    res.json(document);
  } catch (error) {
    console.error('Error verifying document:', error);
    res.status(500).json({ error: 'Failed to verify document' });
  }
});
```

#### E. Environment Variables Required

Add to `.env`:
```bash
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=therapyconnect-uploads

# File Upload Limits
MAX_FILE_SIZE=10485760  # 10MB in bytes
MAX_PHOTO_SIZE=5242880   # 5MB in bytes
```

#### F. File Types and Limits

| Document Type | Accepted Formats | Max Size | Purpose |
|--------------|------------------|----------|---------|
| Profile Photo | .jpg, .jpeg, .png | 5MB | Main profile picture |
| Office Photos | .jpg, .jpeg, .png | 5MB each | Show therapy environment |
| License | .pdf, .jpg, .png | 10MB | Professional license verification |
| Certifications | .pdf, .jpg, .png | 10MB each | EMDR, DBT, etc. |
| Diploma | .pdf, .jpg, .png | 10MB | Educational verification |
| Insurance | .pdf | 10MB | Liability/malpractice insurance |
| Other Documents | .pdf, .doc, .docx | 10MB | Any other relevant documents |

## IMPLEMENTATION PRIORITY

1. **IMMEDIATE (Phase 1):**
   - Add gender field and display
   - Display existing pronouns field
   - Add photo upload functionality
   - Add certifications field

2. **HIGH PRIORITY (Phase 2):**
   - Add race/ethnicity for cultural matching
   - Add specific scheduling availability (time slots)
   - Add session length options
   - Add waitlist status

3. **MEDIUM PRIORITY (Phase 3):**
   - Add accessibility features
   - Add virtual platform details
   - Add interstate licensing
   - Add financial details (FSA/HSA, superbill)

4. **LOWER PRIORITY (Phase 4):**
   - Add quality metrics
   - Add client preference fields
   - Add conditions not treated

## VALIDATION REQUIREMENTS

- All multi-select fields should allow multiple selections
- Photo uploads should be limited to 5MB and common image formats
- Age should be calculated from DOB, never show actual birthdate publicly
- Sensitive demographic data should be optional but encouraged
- Add privacy controls for what demographic info is shown publicly

#### G. Security & HIPAA Compliance for Documents

1. **Encryption Requirements:**
   - All documents encrypted at rest in S3 (AES-256)
   - SSL/TLS for all uploads
   - Encrypted URLs with expiring signatures for sensitive documents

2. **Access Control:**
   - Only therapist can view their own documents
   - Admin can view for verification purposes
   - Public cannot access documents directly
   - Generate signed URLs for authorized viewing

3. **Document Retention:**
   - Keep documents for 7 years (HIPAA requirement)
   - Auto-delete expired licenses/certifications after retention period
   - Audit trail for all document access

4. **Virus Scanning:**
   ```typescript
   // Add virus scanning before storage
   import { scanFile } from './lib/virusScanner';
   
   const scanResult = await scanFile(file.buffer);
   if (scanResult.infected) {
     return res.status(400).json({ error: 'File contains malware' });
   }
   ```

#### H. Admin Document Management Panel

```typescript
// Admin component to review uploaded documents
const AdminDocumentReview = () => {
  const [pendingDocuments, setPendingDocuments] = useState([]);
  
  useEffect(() => {
    // Fetch unverified documents
    fetch('/api/admin/documents/pending')
      .then(res => res.json())
      .then(setPendingDocuments);
  }, []);
  
  return (
    <div>
      <h2>Pending Document Verification</h2>
      {pendingDocuments.map(doc => (
        <div key={doc.id}>
          <h3>{doc.therapistName} - {doc.documentType}</h3>
          <img src={generateSignedUrl(doc.fileUrl)} alt={doc.fileName} />
          <button onClick={() => verifyDocument(doc.id)}>Verify</button>
          <button onClick={() => rejectDocument(doc.id)}>Reject</button>
        </div>
      ))}
    </div>
  );
};
```

## TESTING CHECKLIST

- [ ] Schema migration runs without errors
- [ ] All new fields save correctly to database
- [ ] Questionnaire flow includes all new fields
- [ ] Profile display shows new fields appropriately
- [ ] Search filters work with new fields
- [ ] Matching algorithm uses new fields for scoring
- [ ] Chatbot collects new preference data
- [ ] Photo upload works and displays correctly
- [ ] Privacy settings hide sensitive fields as configured
- [ ] **Document Upload Tests:**
  - [ ] Profile photo uploads and displays correctly
  - [ ] Multiple office photos can be uploaded
  - [ ] License PDF uploads successfully
  - [ ] Certification documents upload with correct metadata
  - [ ] File size limits are enforced (5MB photos, 10MB documents)
  - [ ] Invalid file types are rejected
  - [ ] Documents are encrypted in S3
  - [ ] Signed URLs expire after set time
  - [ ] Admin can view and verify documents
  - [ ] Therapist can delete their own documents
  - [ ] Document list displays correctly
  - [ ] Virus scanning blocks infected files
  - [ ] Upload progress indicator works
  - [ ] Error messages display appropriately

## NOTES
- The pronouns field already exists in the database but is not displayed - this just needs to be added to the profile display component
- The photoUrl field exists but needs upload functionality implemented
- Consider HIPAA compliance for storing demographic data
- Ensure all demographic fields are optional to avoid discrimination concerns
