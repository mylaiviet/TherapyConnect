# TherapyConnect Database Schema

## Database Information
- **Type**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **Schema File**: `shared/schema.ts`
- **Database Location**: Neon cloud (connection string in `.env`)

---

## Table of Contents
1. [Core Tables](#core-tables)
2. [Appointment Scheduling Tables](#appointment-scheduling-tables)
3. [Chatbot Tables (HIPAA-Compliant)](#chatbot-tables-hipaa-compliant)
4. [Geographic Data Tables](#geographic-data-tables)
5. [Session Management](#session-management)
6. [Enums](#enums)
7. [Relationships](#relationships)

---

## Core Tables

### `therapists`
**Purpose**: Stores therapist profiles and practice information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default uuid | Unique therapist profile ID |
| `userId` | varchar | NOT NULL, UNIQUE | Foreign key to users.id |
| `createdAt` | timestamp | NOT NULL, default now() | Profile creation date |
| `updatedAt` | timestamp | NOT NULL, default now() | Last update timestamp |
| `profileStatus` | profile_status | NOT NULL, default 'pending' | Approval status: pending/approved/rejected/inactive |
| **Personal Info** | | | |
| `firstName` | text | NOT NULL | Therapist first name |
| `lastName` | text | NOT NULL | Therapist last name |
| `credentials` | text | | License credentials (LCSW, PhD, etc.) |
| `photoUrl` | text | | Profile photo URL |
| `pronouns` | text | | Preferred pronouns |
| `languagesSpoken` | text[] | default [] | Languages spoken |
| **Contact & Location** | | | |
| `email` | text | NOT NULL | Contact email |
| `phone` | text | | Phone number |
| `website` | text | | Personal/practice website |
| `practiceName` | text | | Practice or clinic name |
| `streetAddress` | text | | Street address |
| `city` | text | NOT NULL | City |
| `state` | text | NOT NULL | State (2-letter code) |
| `zipCode` | text | NOT NULL | ZIP code |
| `country` | text | default 'USA' | Country |
| `latitude` | decimal | | Geocoded latitude |
| `longitude` | decimal | | Geocoded longitude |
| **Licensing & Verification** | | | |
| `licenseType` | text | | Type of license (LCSW, LMFT, etc.) |
| `licenseNumber` | text | NOT NULL | State license number |
| `licenseState` | text | NOT NULL | State where licensed |
| `npiNumber` | text | | National Provider Identifier |
| `yearsInPractice` | integer | | Years of practice experience |
| `graduateSchool` | text | | Graduate school attended |
| `graduationYear` | integer | | Year of graduation |
| **Practice Details** | | | |
| `bio` | text | | Therapist bio/description |
| `therapeuticApproach` | text | | Overall therapeutic approach |
| `sessionTypes` | text[] | default [] | individual/couples/family/group |
| `modalities` | text[] | default [] | in-person/telehealth/phone |
| `acceptingNewClients` | boolean | default true | Accepting new clients flag |
| **Specializations** | | | |
| `topSpecialties` | text[] | default [] | Top 3-5 specialties |
| `issuesTreated` | text[] | default [] | Issues/conditions treated |
| `communitiesServed` | text[] | default [] | Communities served (LGBTQ+, BIPOC, etc.) |
| `ageGroups` | text[] | default [] | Age groups served |
| `therapyTypes` | text[] | default [] | Therapy modalities used (CBT, DBT, etc.) |
| `treatmentOrientation` | text | | Overall treatment orientation |
| **Fees & Insurance** | | | |
| `individualSessionFee` | integer | | Fee for individual session ($) |
| `couplesSessionFee` | integer | | Fee for couples session ($) |
| `offersSlidingScale` | boolean | default false | Offers sliding scale pricing |
| `slidingScaleMin` | integer | | Minimum sliding scale fee |
| `insuranceAccepted` | text[] | default [] | Insurance providers accepted |
| `paymentMethods` | text[] | default [] | Payment methods accepted |
| **Availability** | | | |
| `availableDays` | text[] | default [] | Days available |
| `availableTimes` | text[] | default [] | Time slots available |
| `waitlistStatus` | boolean | default false | Currently on waitlist |
| **Media & Metrics** | | | |
| `videoIntroUrl` | text | | Video introduction URL |
| `profileViews` | integer | default 0 | Profile view count |
| `lastLogin` | timestamp | | Last login timestamp |

**Foreign Keys**:
- `userId` → `users.id` (cascade delete)

**Indexes**: Should add indexes on `city`, `zipCode`, `acceptingNewClients`, `profileStatus`

---

### `users`
**Purpose**: Authentication credentials for all users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default uuid | User ID |
| `email` | text | NOT NULL, UNIQUE | Login email |
| `password` | text | NOT NULL | Bcrypt hashed password |
| `role` | text | NOT NULL, default 'therapist' | User role: therapist/admin |
| `createdAt` | timestamp | NOT NULL, default now() | Account creation date |

**Note**: This is the authentication table. Therapist details are in `therapists` table.

---

### `adminUsers`
**Purpose**: Admin role assignments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default uuid | Admin record ID |
| `userId` | varchar | NOT NULL, UNIQUE | Foreign key to users.id |
| `role` | admin_role | NOT NULL, default 'admin' | admin/super_admin |
| `createdAt` | timestamp | NOT NULL, default now() | Admin assignment date |

**Foreign Keys**:
- `userId` → `users.id`

---

## Appointment Scheduling Tables

### `therapistAvailability`
**Purpose**: Defines therapist weekly availability schedule

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default uuid | Availability rule ID |
| `therapistId` | varchar | NOT NULL, FK | References users.id |
| `dayOfWeek` | integer | NOT NULL | 0=Sunday, 1=Monday, ..., 6=Saturday |
| `startTime` | text | NOT NULL | Start time (e.g., "09:00") |
| `endTime` | text | NOT NULL | End time (e.g., "17:00") |
| `slotDuration` | integer | default 60 | Appointment duration in minutes |
| `isActive` | boolean | default true | Whether this rule is active |
| `createdAt` | timestamp | NOT NULL, default now() | Creation timestamp |

**Foreign Keys**:
- `therapistId` → `users.id` (cascade delete)

**Example**:
```
dayOfWeek=1, startTime="09:00", endTime="17:00", slotDuration=60
→ Monday 9 AM - 5 PM with 60-minute appointment slots
```

---

### `appointments`
**Purpose**: Booked appointments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default uuid | Appointment ID |
| `therapistId` | varchar | NOT NULL, FK | References users.id |
| `patientName` | text | NOT NULL | Patient name |
| `patientEmail` | text | NOT NULL | Patient email |
| `patientPhone` | text | | Patient phone number |
| `appointmentDate` | text | NOT NULL | Date (e.g., "2025-10-20") |
| `startTime` | text | NOT NULL | Start time (e.g., "14:00") |
| `endTime` | text | NOT NULL | End time (e.g., "15:00") |
| `status` | appointment_status | NOT NULL, default 'pending' | pending/confirmed/cancelled/completed/no_show |
| `notes` | text | | Appointment notes |
| `bookingType` | booking_mode | NOT NULL | instant/request |
| `createdAt` | timestamp | NOT NULL, default now() | Booking timestamp |
| `updatedAt` | timestamp | NOT NULL, default now() | Last update |

**Foreign Keys**:
- `therapistId` → `users.id` (cascade delete)

---

### `therapistBookingSettings`
**Purpose**: Therapist booking preferences and calendar integration

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default uuid | Settings ID |
| `therapistId` | varchar | NOT NULL, UNIQUE, FK | References users.id |
| `bookingMode` | booking_mode | NOT NULL, default 'instant' | instant/request |
| `bufferTime` | integer | default 0 | Minutes between appointments |
| `advanceBookingDays` | integer | default 30 | How far ahead patients can book |
| `minNoticeHours` | integer | default 24 | Minimum booking notice hours |
| `allowCancellation` | boolean | default true | Allow patient cancellations |
| `cancellationHours` | integer | default 24 | Cancellation deadline hours |
| `googleCalendarConnected` | boolean | default false | Google Calendar integration |
| `googleCalendarId` | text | | Google Calendar ID |
| `outlookCalendarConnected` | boolean | default false | Outlook Calendar integration |
| `outlookCalendarId` | text | | Outlook Calendar ID |
| `emailNotifications` | boolean | default true | Send email notifications |
| `createdAt` | timestamp | NOT NULL, default now() | Settings creation |
| `updatedAt` | timestamp | NOT NULL, default now() | Last update |

**Foreign Keys**:
- `therapistId` → `users.id` (cascade delete)

---

### `blockedTimeSlots`
**Purpose**: Therapist vacations, breaks, and unavailable time

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default uuid | Block ID |
| `therapistId` | varchar | NOT NULL, FK | References users.id |
| `startDate` | text | NOT NULL | Start date (e.g., "2025-10-20") |
| `endDate` | text | NOT NULL | End date (e.g., "2025-10-25") |
| `startTime` | text | | Start time (null = all day) |
| `endTime` | text | | End time (null = all day) |
| `reason` | text | | Reason (vacation/sick/personal) |
| `createdAt` | timestamp | NOT NULL, default now() | Block creation |

**Foreign Keys**:
- `therapistId` → `users.id` (cascade delete)

---

## Chatbot Tables (HIPAA-Compliant)

### `chatConversations`
**Purpose**: Tracks chatbot conversation sessions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default uuid | Conversation ID |
| `sessionId` | text | | Anonymous session ID (for logged-out users) |
| `userId` | varchar | FK, nullable | Linked user if logged in |
| `stage` | conversation_stage | NOT NULL, default 'welcome' | Current conversation stage |
| `isActive` | boolean | default true | Conversation active status |
| `crisisDetected` | boolean | default false | Crisis keywords detected |
| `escalationRequested` | boolean | default false | User requested human help |
| `completedAt` | timestamp | | Conversation completion time |
| `createdAt` | timestamp | NOT NULL, default now() | Start time |
| `updatedAt` | timestamp | NOT NULL, default now() | Last message time |
| `expiresAt` | timestamp | NOT NULL | Auto-delete after 30 days (HIPAA) |

**Conversation Stages**:
1. `welcome` - Initial greeting
2. `demographics` - Location, age, language
3. `preferences` - Session type, therapist preferences
4. `goals` - Treatment goals
5. `insurance` - Payment/insurance information
6. `matching` - Displaying therapist matches

**Foreign Keys**:
- `userId` → `users.id` (set null on delete)

---

### `chatMessages`
**Purpose**: Individual chat messages (PHI is tokenized)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default uuid | Message ID |
| `conversationId` | varchar | NOT NULL, FK | References chatConversations.id |
| `sender` | message_sender | NOT NULL | bot/user/system |
| `content` | text | NOT NULL | Message text (PHI replaced with tokens) |
| `hasButtonOptions` | boolean | default false | Message has button options |
| `selectedOption` | text | | User's selected option |
| `isDisclaimer` | boolean | default false | Is a disclaimer message |
| `isCrisisAlert` | boolean | default false | Crisis resource message |
| `createdAt` | timestamp | NOT NULL, default now() | Message timestamp |

**PHI Tokenization Example**:
```
Original: "I live in Minneapolis at 123 Main St"
Stored:   "I live in TOKEN_LOCATION_001 at TOKEN_ADDRESS_002"
```

**Foreign Keys**:
- `conversationId` → `chatConversations.id` (cascade delete)

---

### `chatTokens`
**Purpose**: Encrypted PHI storage (HIPAA-compliant)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default uuid | Token ID |
| `conversationId` | varchar | NOT NULL, FK | References chatConversations.id |
| `tokenKey` | text | NOT NULL, UNIQUE | Token identifier (e.g., TOKEN_NAME_001) |
| `encryptedValue` | text | NOT NULL | AES-256-GCM encrypted PHI |
| `fieldType` | text | NOT NULL | name/location/phone/email |
| `createdAt` | timestamp | NOT NULL, default now() | Creation timestamp |

**Security**:
- Encryption: AES-256-GCM
- Key storage: Environment variable (not in database)
- Auto-deletion: 30 days after conversation expiration

**Foreign Keys**:
- `conversationId` → `chatConversations.id` (cascade delete)

---

### `chatPreferences`
**Purpose**: User preferences collected during conversation (non-PHI)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default uuid | Preferences ID |
| `conversationId` | varchar | NOT NULL, UNIQUE, FK | References chatConversations.id |
| **Demographics** | | | |
| `ageRange` | text | | Age range (e.g., "25-34") |
| `pronouns` | text | | Preferred pronouns |
| `language` | text | | Preferred language |
| `locationZip` | text | | ZIP code only (not full address) |
| **Preferences** | | | |
| `sessionFormat` | text | | in-person/virtual/either |
| `availability` | text[] | default [] | weekday-evening/weekend/etc. |
| `therapistGenderPreference` | text | | Preferred therapist gender |
| `therapistAgePreference` | text | | Preferred therapist age |
| `culturalBackgroundMatch` | boolean | default false | Want cultural background match |
| `therapyApproach` | text[] | default [] | Preferred approaches (CBT/DBT/etc.) |
| `hasPreviousTherapyExperience` | boolean | | Had therapy before |
| `previousTherapyFeedback` | text | | What worked/didn't work |
| **Goals** | | | |
| `treatmentGoals` | text | | What they want to work on |
| `treatmentDuration` | text | | short-term/long-term |
| **Insurance** | | | |
| `paymentMethod` | text | | insurance/out-of-pocket |
| `insuranceProvider` | text | | Insurance company |
| `budgetRange` | text | | Budget range |
| `createdAt` | timestamp | NOT NULL, default now() | Creation time |
| `updatedAt` | timestamp | NOT NULL, default now() | Last update |

**Note**: This table contains NO PHI - all sensitive data is tokenized in `chatTokens`

**Foreign Keys**:
- `conversationId` → `chatConversations.id` (cascade delete)

---

### `chatEscalations`
**Purpose**: Logs crisis detection and human escalation requests

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default uuid | Escalation ID |
| `conversationId` | varchar | NOT NULL, FK | References chatConversations.id |
| `escalationType` | escalation_type | NOT NULL | crisis/abuse_report/human_request/general |
| `triggerMessage` | text | | Message that triggered escalation |
| `crisisKeywords` | text[] | | Keywords detected (suicide/harm/etc.) |
| `actionTaken` | text | | Action taken (displayed_resources/notified_staff) |
| `staffNotified` | boolean | default false | Staff was notified |
| `staffNotifiedAt` | timestamp | | When staff was notified |
| `resolved` | boolean | default false | Issue resolved |
| `resolvedAt` | timestamp | | Resolution timestamp |
| `notes` | text | | Staff notes |
| `createdAt` | timestamp | NOT NULL, default now() | Escalation time |

**Crisis Keywords Monitored**:
- suicide, kill myself, end my life
- hurt myself, self-harm, cutting
- abuse, assault, violence
- hopeless, no point, can't go on

**Foreign Keys**:
- `conversationId` → `chatConversations.id` (cascade delete)

---

### `chatTherapistMatches`
**Purpose**: Links conversations to recommended therapists

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar | PK, default uuid | Match ID |
| `conversationId` | varchar | NOT NULL, FK | References chatConversations.id |
| `therapistId` | varchar | NOT NULL, FK | References therapists.id |
| `matchScore` | integer | | Compatibility score (0-100) |
| `matchReasons` | text[] | | Reasons for match (stored in server memory, not DB currently) |
| `displayOrder` | integer | | Order shown to user (1, 2, 3...) |
| `clicked` | boolean | default false | User clicked profile link |
| `clickedAt` | timestamp | | When profile was clicked |
| `booked` | boolean | default false | User booked appointment |
| `bookedAt` | timestamp | | When appointment was booked |
| `createdAt` | timestamp | NOT NULL, default now() | Match creation |

**Matching Algorithm** (in `server/services/therapistMatcher.ts`):
- Location match: 30 points (REQUIRED)
- Accepting new clients: 20 points
- Session format match: 15 points
- Therapy approach match: 20 points
- Insurance accepted: 15 points
- Specialties match: 15 points
- Experience bonus: 5 points
- **Total**: 0-100 score

**Foreign Keys**:
- `conversationId` → `chatConversations.id` (cascade delete)
- `therapistId` → `therapists.id` (cascade delete)

---

## Geographic Data Tables

### `zipCodes`
**Purpose**: US ZIP code database for location matching and proximity calculations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `zip` | varchar(5) | PK | 5-digit ZIP code |
| `city` | text | NOT NULL | City name |
| `state` | varchar(2) | NOT NULL | State code (e.g., "MN") |
| `latitude` | decimal(10,8) | | Latitude coordinate |
| `longitude` | decimal(11,8) | | Longitude coordinate |
| `county` | text | | County name |
| `timezone` | text | | Timezone (e.g., "America/Chicago") |

**Data Source**: US Census Bureau / OpenDataSoft
**Total Records**: 42,555 US ZIP codes

**Usage**:
- Location matching for chatbot
- Proximity calculations (currently disabled due to SQL errors)
- City name → ZIP code lookups

**Example**:
```
zip="55401", city="Minneapolis", state="MN",
latitude=44.9778, longitude=-93.2650
```

---

## Session Management

### `session`
**Purpose**: Express session storage (managed by `connect-pg-simple`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `sid` | varchar | PK | Session ID |
| `sess` | text | NOT NULL | JSON session data |
| `expire` | timestamp | NOT NULL | Session expiration time |

**Note**: This table is automatically created and managed by `express-session` middleware. You should NOT directly modify it.

**Session Data Includes**:
- User ID (if logged in)
- CSRF tokens
- Flash messages
- Passport.js authentication state

---

## Enums

### `profile_status`
**Values**: `pending`, `approved`, `rejected`, `inactive`
**Used in**: `therapists.profileStatus`

### `admin_role`
**Values**: `admin`, `super_admin`
**Used in**: `adminUsers.role`

### `appointment_status`
**Values**: `pending`, `confirmed`, `cancelled`, `completed`, `no_show`
**Used in**: `appointments.status`

### `booking_mode`
**Values**: `instant`, `request`
**Used in**: `appointments.bookingType`, `therapistBookingSettings.bookingMode`

### `conversation_stage`
**Values**: `welcome`, `demographics`, `preferences`, `goals`, `insurance`, `matching`
**Used in**: `chatConversations.stage`

### `message_sender`
**Values**: `bot`, `user`, `system`
**Used in**: `chatMessages.sender`

### `escalation_type`
**Values**: `crisis`, `abuse_report`, `human_request`, `general`
**Used in**: `chatEscalations.escalationType`

---

## Relationships

### User → Therapist (1:1)
```
users.id (1) ←→ (1) therapists.userId
```
Each user can have ONE therapist profile.

### User → AdminUser (1:1, optional)
```
users.id (1) ←→ (0..1) adminUsers.userId
```
A user may be an admin.

### Therapist → Availability (1:Many)
```
users.id (1) ←→ (0..N) therapistAvailability.therapistId
```
A therapist can have multiple availability rules (e.g., Mon 9-5, Wed 1-8).

### Therapist → Appointments (1:Many)
```
users.id (1) ←→ (0..N) appointments.therapistId
```
A therapist can have many appointments.

### Therapist → BookingSettings (1:1)
```
users.id (1) ←→ (0..1) therapistBookingSettings.therapistId
```
Each therapist has one set of booking settings.

### Therapist → BlockedTimeSlots (1:Many)
```
users.id (1) ←→ (0..N) blockedTimeSlots.therapistId
```
A therapist can block multiple time periods.

### Conversation → Messages (1:Many)
```
chatConversations.id (1) ←→ (0..N) chatMessages.conversationId
```
Each conversation has many messages.

### Conversation → Tokens (1:Many)
```
chatConversations.id (1) ←→ (0..N) chatTokens.conversationId
```
Each conversation can have multiple encrypted PHI tokens.

### Conversation → Preferences (1:1)
```
chatConversations.id (1) ←→ (0..1) chatPreferences.conversationId
```
Each conversation has ONE set of preferences.

### Conversation → Escalations (1:Many)
```
chatConversations.id (1) ←→ (0..N) chatEscalations.conversationId
```
A conversation can have multiple escalation events.

### Conversation → TherapistMatches (1:Many)
```
chatConversations.id (1) ←→ (0..N) chatTherapistMatches.conversationId
```
Each conversation generates multiple therapist matches.

### Therapist → TherapistMatches (1:Many)
```
therapists.id (1) ←→ (0..N) chatTherapistMatches.therapistId
```
Each therapist can be matched to many conversations.

---

## Database Diagram (ASCII)

```
┌─────────────┐
│   users     │
│  (auth)     │
└──────┬──────┘
       │
       ├─────────────────────────────────┐
       │                                 │
       ▼                                 ▼
┌─────────────┐                   ┌──────────────┐
│ therapists  │                   │  adminUsers  │
└──────┬──────┘                   └──────────────┘
       │
       ├──────┬────────┬──────────┬──────────────┐
       │      │        │          │              │
       ▼      ▼        ▼          ▼              ▼
   ┌─────┐ ┌────┐ ┌────────┐ ┌────────┐  ┌──────────┐
   │avail│ │appt│ │booking │ │blocked │  │  matches │
   │     │ │    │ │settings│ │  time  │  │          │
   └─────┘ └────┘ └────────┘ └────────┘  └─────┬────┘
                                                 │
   ┌──────────────────────────────────────────┘
   │
   ▼
┌─────────────┐
│conversation │
│  (chatbot)  │
└──────┬──────┘
       │
       ├──────┬────────┬──────────┬────────┐
       │      │        │          │        │
       ▼      ▼        ▼          ▼        ▼
   ┌────┐ ┌─────┐ ┌──────┐ ┌──────┐ ┌──────┐
   │msg │ │token│ │ pref │ │escal │ │matches│
   └────┘ └─────┘ └──────┘ └──────┘ └──────┘

   ┌──────────┐
   │ zipCodes │ (standalone reference table)
   └──────────┘

   ┌─────────┐
   │ session │ (express-session managed)
   └─────────┘
```

---

## Database Statistics (Current)

| Table | Estimated Rows | Notes |
|-------|----------------|-------|
| `users` | ~100 | Therapist accounts |
| `therapists` | ~100 | Active therapist profiles |
| `therapistAvailability` | ~500 | ~5 rules per therapist |
| `appointments` | ~1,000 | Grows over time |
| `chatConversations` | ~500 | Auto-deleted after 30 days |
| `chatMessages` | ~5,000 | ~10 messages per conversation |
| `chatTokens` | ~1,000 | ~2 PHI fields per conversation |
| `chatPreferences` | ~500 | 1 per conversation |
| `chatTherapistMatches` | ~2,500 | ~5 matches per conversation |
| `zipCodes` | 42,555 | Static reference data |

---

## Indexes (Recommended)

### Current Indexes (Auto-created)
- Primary keys on all tables
- Unique constraints: `users.email`, `therapists.userId`, `adminUsers.userId`

### Recommended Additional Indexes

```sql
-- Therapist search performance
CREATE INDEX idx_therapist_location ON therapists(city, state, zip_code);
CREATE INDEX idx_therapist_status ON therapists(profile_status, accepting_new_clients);
CREATE INDEX idx_therapist_specialties ON therapists USING GIN(top_specialties);

-- Appointment queries
CREATE INDEX idx_appointment_therapist_date ON appointments(therapist_id, appointment_date);
CREATE INDEX idx_appointment_status ON appointments(status);

-- Chatbot queries
CREATE INDEX idx_conversation_active ON chat_conversations(is_active, expires_at);
CREATE INDEX idx_message_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX idx_preferences_location ON chat_preferences(location_zip);

-- Geographic search
CREATE INDEX idx_zipcode_city ON zip_codes(city);
CREATE INDEX idx_zipcode_state ON zip_codes(state);
```

---

## HIPAA Compliance Features

### PHI Tokenization
- **What**: Replace sensitive data with tokens before storing
- **Example**: "John Doe" → "TOKEN_NAME_001"
- **Encryption**: AES-256-GCM
- **Key Management**: Environment variable, not in database

### Auto-Deletion
- **Retention**: 30 days from conversation creation
- **Implementation**: `expiresAt` timestamp on `chatConversations`
- **Cleanup Job**: Scheduled task to delete expired conversations (and cascades to all related tables)

### Access Controls
- **Row-Level Security**: Not implemented (future consideration)
- **Application-Level**: Session-based authentication
- **Audit Logs**: Not implemented (future consideration)

### Data Minimization
- **ZIP Code Only**: Store ZIP, not full address
- **Age Ranges**: Store "25-34", not exact age
- **Non-PHI Storage**: `chatPreferences` table contains no PHI

---

## Migration History

### Initial Schema (v1)
- Core tables: users, therapists, adminUsers
- Session management

### Scheduling Feature (v2)
- Added: therapistAvailability, appointments, therapistBookingSettings, blockedTimeSlots

### Chatbot Feature (v3)
- Added: chatConversations, chatMessages, chatTokens, chatPreferences, chatEscalations, chatTherapistMatches

### ZIP Codes (v4)
- Added: zipCodes table with 42,555 US ZIP codes

---

## Database File Location

**Schema Definition**: `C:\TherapyConnect\shared\schema.ts`

**Database Connection**: Configured in `.env`:
```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

**Migrations**: Managed by Drizzle Kit
```bash
# Push schema changes to database
npm run db:push

# Generate migrations
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate
```

**Seed Data**: `C:\TherapyConnect\server\seed.ts`
```bash
npm run db:seed
```

---

## Future Schema Enhancements

### Recommended Additions

1. **Audit Logs Table**
   ```sql
   CREATE TABLE audit_logs (
     id UUID PRIMARY KEY,
     table_name TEXT,
     record_id UUID,
     action TEXT, -- insert/update/delete
     user_id UUID,
     changes JSONB,
     created_at TIMESTAMP
   );
   ```

2. **Therapist Reviews Table**
   ```sql
   CREATE TABLE therapist_reviews (
     id UUID PRIMARY KEY,
     therapist_id UUID REFERENCES therapists(id),
     patient_id UUID,
     rating INTEGER CHECK (rating >= 1 AND rating <= 5),
     review_text TEXT,
     verified_booking BOOLEAN,
     created_at TIMESTAMP
   );
   ```

3. **Favorites/Saved Therapists**
   ```sql
   CREATE TABLE saved_therapists (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     therapist_id UUID REFERENCES therapists(id),
     created_at TIMESTAMP
   );
   ```

4. **Email Notifications Queue**
   ```sql
   CREATE TABLE email_queue (
     id UUID PRIMARY KEY,
     to_email TEXT,
     subject TEXT,
     template TEXT,
     data JSONB,
     status TEXT, -- pending/sent/failed
     sent_at TIMESTAMP,
     created_at TIMESTAMP
   );
   ```

---

## Backup & Recovery

### Backup Strategy (Recommended)
- **Neon Automated Backups**: Daily automatic backups
- **Point-in-Time Recovery**: Up to 7 days
- **Export Command**:
  ```bash
  pg_dump $DATABASE_URL > backup.sql
  ```

### Disaster Recovery
1. Restore from Neon automatic backup
2. OR: Import from manual backup:
   ```bash
   psql $DATABASE_URL < backup.sql
   ```

---

## Performance Monitoring

### Query Performance
- **Neon Dashboard**: Built-in query analytics
- **Slow Query Log**: Enable in Neon settings
- **Connection Pooling**: Neon serverless driver handles this

### Optimization Tips
1. Add indexes (see Indexes section above)
2. Use `EXPLAIN ANALYZE` for slow queries
3. Limit array column usage (use separate tables for large arrays)
4. Consider materialized views for complex chatbot analytics

---

## Contact & Maintenance

**Schema Owner**: Development Team
**Last Updated**: 2025-10-19
**Version**: 4.0 (with chatbot + ZIP codes)

For schema changes, update:
1. `shared/schema.ts`
2. Run `npm run db:push`
3. Update this documentation
4. Test with `npm run db:seed`
