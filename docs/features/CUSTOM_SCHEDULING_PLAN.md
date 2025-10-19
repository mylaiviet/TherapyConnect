# Custom Appointment Scheduling System - Implementation Plan

## 🎯 Goal
Build a fully custom, in-house appointment scheduling system for TherapyConnect with:
- ✅ **No third-party dependencies** (except free open-source libraries)
- ✅ **No recurring costs**
- ✅ **Full control and customization**
- ✅ **HIPAA-compliant** (we control all data)
- ✅ **Two booking modes:** Instant confirmation OR request/approval
- ✅ **Optional:** Google/Outlook calendar sync (free APIs)

---

## 📊 System Architecture

### Core Components

```
TherapyConnect Scheduling System
├── 1. Availability Management (Therapist sets available times)
├── 2. Booking Calendar (Patients view & book slots)
├── 3. Appointment Management (CRUD operations)
├── 4. Confirmation/Request System (Approval workflow)
├── 5. Email Notifications (Booking confirmations)
└── 6. Calendar Sync [Optional] (Google/Outlook integration)
```

---

## 🗄️ Database Schema Design

### New Tables to Add

```typescript
// shared/schema.ts - Add these tables

// 1. Therapist Availability Schedule
export const therapistAvailability = pgTable("therapist_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  therapistId: text("therapist_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "17:00"
  slotDuration: integer("slot_duration").default(60), // minutes per appointment
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. Appointments
export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  therapistId: text("therapist_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  patientName: text("patient_name").notNull(),
  patientEmail: text("patient_email").notNull(),
  patientPhone: text("patient_phone"),
  appointmentDate: date("appointment_date").notNull(),
  startTime: text("start_time").notNull(), // "14:00"
  endTime: text("end_time").notNull(), // "15:00"
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled, completed
  notes: text("notes"),
  bookingType: text("booking_type").notNull(), // "instant" or "request"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3. Therapist Booking Settings
export const therapistBookingSettings = pgTable("therapist_booking_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  therapistId: text("therapist_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  bookingMode: text("booking_mode").notNull().default("instant"), // "instant" or "request"
  bufferTime: integer("buffer_time").default(0), // minutes between appointments
  advanceBookingDays: integer("advance_booking_days").default(30), // how far in advance can patients book
  minNoticeHours: integer("min_notice_hours").default(24), // minimum notice for booking
  allowCancellation: boolean("allow_cancellation").default(true),
  cancellationHours: integer("cancellation_hours").default(24), // hours before appointment
  googleCalendarConnected: boolean("google_calendar_connected").default(false),
  googleCalendarId: text("google_calendar_id"),
  outlookCalendarConnected: boolean("outlook_calendar_connected").default(false),
  outlookCalendarId: text("outlook_calendar_id"),
  emailNotifications: boolean("email_notifications").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 4. Blocked Time Slots (for vacations, breaks, etc.)
export const blockedTimeSlots = pgTable("blocked_time_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  therapistId: text("therapist_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  startTime: text("start_time"), // optional - if not set, blocks entire day
  endTime: text("end_time"), // optional
  reason: text("reason"), // "vacation", "sick", "personal", etc.
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## 🎨 UI Components to Build

### 1. Therapist Dashboard Components

#### A. Availability Manager
```typescript
// client/src/components/scheduling/AvailabilityManager.tsx
// Allows therapists to:
// - Set weekly schedule (Mon-Sun, start/end times)
// - Set appointment duration (30, 45, 60 min)
// - Block specific dates/times
// - Set buffer time between appointments
```

#### B. Booking Settings
```typescript
// client/src/components/scheduling/BookingSettings.tsx
// Allows therapists to:
// - Choose booking mode (instant vs request)
// - Set advance booking window (how far ahead)
// - Set minimum notice period
// - Enable/disable cancellations
// - Configure email notifications
```

#### C. Appointments List
```typescript
// client/src/components/scheduling/AppointmentsList.tsx
// Shows therapist's appointments:
// - Upcoming appointments
// - Past appointments
// - Pending requests (if using request mode)
// - Cancelled appointments
// - Actions: Approve, Reject, Cancel, View details
```

### 2. Patient-Facing Components

#### D. Booking Calendar
```typescript
// client/src/components/scheduling/BookingCalendar.tsx
// Shows available time slots:
// - Month/week view with available dates highlighted
// - Click date to see available time slots
// - Real-time availability checking
// - Books appointment with patient details
```

#### E. Appointment Confirmation
```typescript
// client/src/components/scheduling/AppointmentConfirmation.tsx
// After booking:
// - Shows booking details
// - Confirmation message (instant mode)
// - OR "Request sent, waiting for approval" (request mode)
// - Add to calendar button (.ics file download)
```

---

## 🛠️ Implementation Steps

### Phase 1: Database & Backend (Days 1-3)

**Step 1: Create Database Migration**
```bash
# Create new migration file
npm run db:push
```

**Step 2: Update Storage Layer**
```typescript
// server/storage.ts - Add these methods

// Availability Management
async createAvailability(therapistId: string, availability: NewAvailability): Promise<Availability>
async getAvailability(therapistId: string): Promise<Availability[]>
async updateAvailability(id: string, availability: UpdateAvailability): Promise<Availability>
async deleteAvailability(id: string): Promise<void>

// Booking Settings
async getBookingSettings(therapistId: string): Promise<BookingSettings>
async updateBookingSettings(therapistId: string, settings: UpdateBookingSettings): Promise<BookingSettings>

// Appointments
async createAppointment(appointment: NewAppointment): Promise<Appointment>
async getAppointments(therapistId: string, filters?: AppointmentFilters): Promise<Appointment[]>
async getAppointment(id: string): Promise<Appointment>
async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment>
async cancelAppointment(id: string, reason?: string): Promise<Appointment>

// Available Slots Calculation
async getAvailableSlots(therapistId: string, date: Date): Promise<TimeSlot[]>
async isSlotAvailable(therapistId: string, date: Date, startTime: string): Promise<boolean>

// Blocked Time
async createBlockedTime(therapistId: string, blocked: NewBlockedTime): Promise<BlockedTime>
async getBlockedTimes(therapistId: string): Promise<BlockedTime[]>
async deleteBlockedTime(id: string): Promise<void>
```

**Step 3: Create API Endpoints**
```typescript
// server/routes.ts - Add these endpoints

// Therapist routes (authenticated)
app.get("/api/therapist/availability", getAvailability);
app.post("/api/therapist/availability", createAvailability);
app.put("/api/therapist/availability/:id", updateAvailability);
app.delete("/api/therapist/availability/:id", deleteAvailability);

app.get("/api/therapist/booking-settings", getBookingSettings);
app.put("/api/therapist/booking-settings", updateBookingSettings);

app.get("/api/therapist/appointments", getAppointments);
app.put("/api/therapist/appointments/:id/approve", approveAppointment);
app.put("/api/therapist/appointments/:id/reject", rejectAppointment);
app.put("/api/therapist/appointments/:id/cancel", cancelAppointment);

app.post("/api/therapist/blocked-time", createBlockedTime);
app.get("/api/therapist/blocked-time", getBlockedTimes);
app.delete("/api/therapist/blocked-time/:id", deleteBlockedTime);

// Public routes (for patients)
app.get("/api/therapists/:id/available-slots", getAvailableSlots); // Get slots for specific date
app.post("/api/therapists/:id/book", bookAppointment); // Book appointment
app.get("/api/appointments/:id", getAppointmentDetails); // View confirmation
```

---

### Phase 2: Therapist Dashboard UI (Days 4-7)

**Step 4: Build Availability Manager**
```typescript
// Weekly schedule editor with time pickers
// Visual representation of therapist's schedule
// Drag-and-drop support for easy scheduling
// Quick templates (9-5, evenings, weekends)
```

**Step 5: Build Booking Settings Panel**
```typescript
// Simple form with radio buttons, toggles, number inputs
// Preview of how booking flow works
// Save/update settings
```

**Step 6: Build Appointments Dashboard**
```typescript
// Table/cards showing all appointments
// Filter by status, date range
// Search by patient name/email
// Quick actions (approve, reject, cancel)
// Calendar view option
```

---

### Phase 3: Patient Booking UI (Days 8-10)

**Step 7: Build Booking Calendar Component**
```typescript
// Use react-calendar (free, open-source)
npm install react-calendar

// Features:
// - Highlight available dates
// - Show "No availability" for unavailable dates
// - Click to see time slots
// - Select slot and proceed to booking form
```

**Step 8: Build Booking Form**
```typescript
// Patient information form:
// - Name, Email, Phone
// - Reason for appointment (optional)
// - Special requests/notes
// - Review selected date/time
// - Submit booking
```

**Step 9: Build Confirmation Screen**
```typescript
// Success message
// Appointment details
// Add to calendar button (generate .ics file)
// Email confirmation sent notice
```

---

### Phase 4: Email Notifications (Day 11)

**Step 10: Email Templates**
```typescript
// Use nodemailer (free) or Resend API (free tier: 100 emails/day)

// Templates needed:
// 1. Patient: Instant confirmation
// 2. Patient: Request submitted (pending)
// 3. Patient: Request approved
// 4. Patient: Request rejected
// 5. Patient: Appointment reminder (24hrs before)
// 6. Therapist: New appointment request
// 7. Therapist: Appointment cancelled by patient
```

**Step 11: Email Service Setup**
```typescript
// Option A: Nodemailer with SMTP (free Gmail SMTP)
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD // Gmail app password
  }
});

// Option B: Resend (100 free emails/day)
npm install resend

import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'TherapyConnect <noreply@therapyconnect.com>',
  to: patient.email,
  subject: 'Appointment Confirmed',
  html: confirmationEmailTemplate
});
```

---

### Phase 5: Advanced Features [OPTIONAL] (Days 12-15)

**Step 12: Google Calendar Sync**
```typescript
// Free Google Calendar API
// OAuth flow to connect therapist's calendar
// Sync appointments both ways:
// - New appointment in TherapyConnect → Add to Google Calendar
// - Busy time in Google Calendar → Block slots in TherapyConnect

// Implementation:
npm install googleapis

// Set up OAuth in Google Cloud Console (free)
// Add calendar sync button to settings
// Implement sync logic
```

**Step 13: Outlook Calendar Sync**
```typescript
// Free Microsoft Graph API
// Similar to Google Calendar
npm install @microsoft/microsoft-graph-client

// OAuth flow with Microsoft
// Bi-directional sync
```

**Step 14: SMS Notifications (Optional)**
```typescript
// Twilio (pay-as-you-go: ~$0.01 per SMS)
// Only if budget allows
// Send appointment reminders via SMS
```

---

## 💰 Cost Analysis

### 100% Free Option:
- ✅ **Database:** Supabase (already have)
- ✅ **Email:** Gmail SMTP (free, 100 emails/day)
- ✅ **Frontend:** React components (free, open-source)
- ✅ **Calendar UI:** react-calendar (free, MIT license)
- ✅ **Backend:** Express (already have)

**Total Monthly Cost: $0**

### Low-Cost Option (Better reliability):
- ✅ **Database:** Supabase (already have) - $0
- ✅ **Email:** Resend (100/day free, $20/month for 50k emails) - $0-20
- ✅ **SMS [Optional]:** Twilio (~$0.01/SMS) - ~$10-50/month
- ✅ **Everything else:** Free

**Total Monthly Cost: $0-70**

---

## 📦 Open-Source Libraries We'll Use (All Free)

```json
{
  "dependencies": {
    "react-calendar": "^5.0.0",           // Calendar UI (MIT license)
    "date-fns": "^3.6.0",                 // Date utilities (already have)
    "nodemailer": "^6.9.0",               // Email sending (MIT license)
    "ical-generator": "^7.0.0",           // Generate .ics files (MIT license)
    "react-hook-form": "^7.55.0",         // Forms (already have)
    "zod": "^3.24.2"                      // Validation (already have)
  },
  "devDependencies": {
    // Optional for calendar sync:
    "googleapis": "^140.0.0",             // Google Calendar API (free)
    "@microsoft/microsoft-graph-client": "^3.0.7" // Outlook API (free)
  }
}
```

---

## 🚀 Development Timeline

### Total Time: 10-15 days

- **Days 1-3:** Database schema + Backend APIs
- **Days 4-7:** Therapist dashboard UI (availability, settings, appointments)
- **Days 8-10:** Patient booking UI (calendar, form, confirmation)
- **Day 11:** Email notifications
- **Days 12-15:** [Optional] Calendar sync with Google/Outlook

### Can be broken into phases:
- **MVP (Days 1-11):** Core booking system - **FULLY FUNCTIONAL**
- **Enhancement (Days 12-15):** Calendar sync - **NICE TO HAVE**

---

## ✅ Features Comparison

| Feature | Custom Build | Cal.com (paid) |
|---------|-------------|----------------|
| **Cost** | **$0/month** | $29/month |
| **Control** | **100%** | Limited |
| **Customization** | **Unlimited** | Limited |
| **HIPAA** | **Full control** | Requires BAA |
| **Booking modes** | ✅ Both | ✅ Both |
| **Calendar sync** | ✅ DIY | ✅ Built-in |
| **Email notifications** | ✅ Free | ✅ Included |
| **SMS notifications** | 💰 ~$10-50/mo | ✅ Included |
| **Data ownership** | **✅ 100% yours** | Shared |
| **No dependencies** | **✅ Yes** | ❌ Third-party |
| **Development time** | 10-15 days | 1-2 days |

---

## 🎯 Recommendation

**Build the custom system!**

### Why:
1. **Zero recurring costs** - Save $29-348/year
2. **Full control** - No third-party dependencies
3. **Perfect fit** - Customized exactly for TherapyConnect
4. **Data ownership** - All patient data stays with you
5. **HIPAA compliance** - Easier when you control everything
6. **Scalable** - Works for 10 or 10,000 therapists
7. **Learning** - You understand the system completely

### Trade-offs:
- ⏱️ Takes 10-15 days vs 1-2 days with Cal.com
- 🔧 You maintain the code (but it's not complex)
- 📱 SMS costs extra if you want it (~$10-50/month)

---

## 🚦 Next Steps

**Option 1: Start Immediately (Recommended)**
I can start building this right now, beginning with:
1. Database schema (Day 1)
2. Backend APIs (Days 1-3)
3. Then move to UI components

**Option 2: Review First**
You review this plan, suggest changes, then I start

**Option 3: Build MVP First**
Build core booking system (Days 1-11) first, then decide on calendar sync later

---

## 💬 Questions to Decide

1. **Email provider:** Gmail SMTP (free, 100/day) or Resend (free 100/day, better for scaling)?
2. **SMS notifications:** Include from start or add later if budget allows?
3. **Calendar sync:** Build from start or add as Phase 2?
4. **Start date:** Begin immediately or after Render deployment is resolved?

---

**Ready to build when you are! This will be a solid, custom solution that gives you complete control.** 🚀

Let me know if you want me to start with Phase 1 (Database & Backend) right now!

---

*Last Updated: 2025-10-18*
*Estimated Development Time: 10-15 days*
*Estimated Cost: $0/month (email only) or $10-70/month (with SMS)*
