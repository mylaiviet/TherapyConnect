# Calendar & Appointment Scheduling Research for TherapyConnect

## 📋 Project Requirements

Based on your needs, TherapyConnect requires:

1. **Patient Booking Features:**
   - View therapist availability
   - Book appointments based on available time slots
   - Receive confirmation or appointment request

2. **Therapist Settings:**
   - Option 1: Auto-confirm bookings (immediate confirmation)
   - Option 2: Request-based (therapist approves/rejects)
   - Set availability schedules

3. **Calendar Integration (API):**
   - EMR/EHR system integration
   - Microsoft Outlook calendar sync
   - Google Calendar/Gmail sync
   - Prevent double-booking across calendars

4. **Compliance:**
   - HIPAA-compliant (healthcare data)
   - Secure patient information handling

---

## 🏆 Recommended Solutions (Ranked)

### ⭐ TIER 1: Best Overall Solutions

#### 1. **Cal.com** (Recommended - Open Source)
**Why It's Perfect for TherapyConnect:**
- ✅ **Open source** - Full control and customization
- ✅ **HIPAA compliant** (with paid plan)
- ✅ **Free tier available** - Great for starting
- ✅ **API-first design** - Easy integration into your React app
- ✅ **Calendar sync:** Google Calendar, Outlook, iCloud
- ✅ **Booking modes:** Instant confirmation OR request/approval
- ✅ **Customizable booking pages**
- ✅ **Email & SMS reminders**
- ✅ **Time zone support**
- ✅ **React-friendly** - Can embed or use API

**Pricing:**
- **Free:** Basic scheduling, Google/Outlook sync, email reminders
- **Paid ($12-29/month):** HIPAA compliance, SMS, custom branding, webhooks

**Implementation:**
```javascript
// Embed Cal.com calendar in your app
<Cal
  calLink="therapist-username/30min"
  config={{
    theme: 'light',
    hideEventTypeDetails: false
  }}
/>
```

**API Example:**
```javascript
// Create booking via API
const booking = await fetch('https://api.cal.com/v1/bookings', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    eventTypeId: 123,
    start: '2025-10-20T14:00:00Z',
    responses: {
      name: 'Patient Name',
      email: 'patient@email.com'
    }
  })
});
```

**Documentation:** https://cal.com/docs

---

#### 2. **Nylas Scheduler**
**Why It's Great:**
- ✅ **Healthcare-focused** API
- ✅ **Pre-built React components**
- ✅ **Multi-calendar sync** (Google, Outlook, Exchange)
- ✅ **Time zone handling**
- ✅ **Availability checking** (prevents double-booking)
- ✅ **Webhooks** for confirmations
- ✅ **Professional support**

**Pricing:**
- **Free tier:** Up to 500 API calls/month
- **Paid:** Starting at $12/month

**Implementation:**
```javascript
import { NylasScheduler } from '@nylas/react';

<NylasScheduler
  configurationId="your-config-id"
  schedulerApiUrl="https://api.nylas.com/scheduler"
  onBookingConfirmed={(booking) => {
    // Handle confirmation
    console.log('Booked:', booking);
  }}
/>
```

**Documentation:** https://developer.nylas.com/docs/v3/scheduler/

---

#### 3. **OnSched API**
**Why It's Excellent:**
- ✅ **Healthcare-specific** - "trusted by healthcare"
- ✅ **HIPAA compliant**
- ✅ **Google & Outlook sync**
- ✅ **SMS notifications** built-in
- ✅ **Pricing based on bookings** (not users)
- ✅ **Complex scheduling support**
- ✅ **RESTful API**

**Pricing:**
- Based on number of appointments booked (pay-as-you-go)

**Use Case:**
Perfect for scaling - pay only for what you use

**Documentation:** https://www.onsched.com

---

### ⭐ TIER 2: Healthcare-Specific Platforms

#### 4. **Healthie**
**Why Consider:**
- ✅ **Built for digital health**
- ✅ **HIPAA-compliant** telehealth integration
- ✅ **Open-source widgets**
- ✅ **EMR/EHR features** built-in
- ✅ **Multiprovider calendars**
- ✅ **Powerful API**

**Pricing:**
- Custom pricing (tends to be higher)

**Best For:**
Full practice management (if you want more than just scheduling)

---

### ⭐ TIER 3: Build-Your-Own with React Components

#### 5. **Mobiscroll React Calendar**
**Why Consider:**
- ✅ **React component library**
- ✅ **Highly customizable**
- ✅ **Booking widget with pricing display**
- ✅ **Single, multiple & recurring bookings**
- ✅ **Mobile & desktop optimized**

**Pricing:**
- Paid license required (~$300-500/year)

**Implementation:**
```javascript
import { Eventcalendar } from '@mobiscroll/react';

<Eventcalendar
  theme="ios"
  themeVariant="light"
  clickToCreate={true}
  onEventCreate={(event) => {
    // Handle booking
  }}
/>
```

---

#### 6. **Syncfusion React Scheduler**
**Why Consider:**
- ✅ **Comprehensive React component**
- ✅ **Appointment categorization**
- ✅ **Drag-and-drop scheduling**
- ✅ **Multiple views** (day, week, month)

**Pricing:**
- Paid license (~$1,000+/year for commercial use)

**Best For:**
If you want complete UI control and budget allows

---

#### 7. **react-appointment-picker (NPM - Free)**
**Why Consider:**
- ✅ **Free and open source**
- ✅ **Lightweight**
- ✅ **Simple time slot picker**

**Limitations:**
- ❌ No built-in calendar sync
- ❌ No HIPAA compliance
- ❌ Basic features only

**Use Case:**
Build your own scheduling system from scratch

```javascript
import { AppointmentPicker } from 'react-appointment-picker';

<AppointmentPicker
  alpha
  continuous={false}
  selectedByDefault={false}
  days={[1, 2, 3, 4, 5]} // Mon-Fri
  maxReservableAppointments={3}
  onAppointmentChange={handleBooking}
/>
```

---

## 📊 Feature Comparison Table

| Solution | HIPAA | Calendar Sync | API | Price | Best For |
|----------|-------|---------------|-----|-------|----------|
| **Cal.com** | ✅ (paid) | Google, Outlook | ✅ | Free - $29/mo | **Recommended** |
| **Nylas** | ⚠️ | Google, Outlook, Exchange | ✅ | Free - $12+/mo | React integration |
| **OnSched** | ✅ | Google, Outlook | ✅ | Pay-per-booking | Scaling |
| **Healthie** | ✅ | Yes | ✅ | Custom | Full EHR |
| **Mobiscroll** | ❌ | Manual | ❌ | ~$400/yr | Custom UI |
| **Syncfusion** | ❌ | Manual | ❌ | ~$1000/yr | Enterprise UI |
| **react-appointment-picker** | ❌ | ❌ | ❌ | Free | DIY |

---

## 🎯 My Recommendation: **Cal.com**

### Why Cal.com is the Best Choice:

1. **Perfect Feature Match:**
   - ✅ Supports both instant confirmation AND request/approval modes
   - ✅ HIPAA-compliant (you need this for healthcare)
   - ✅ Syncs with Google Calendar, Outlook, iCloud
   - ✅ API-first (easy to integrate into your React app)
   - ✅ Open source (you can self-host if needed)

2. **Cost-Effective:**
   - Start with **FREE tier** for development/testing
   - Only $12-29/month for HIPAA compliance
   - No per-user fees (flat rate)

3. **Developer-Friendly:**
   - React embed components available
   - RESTful API with excellent documentation
   - Webhooks for real-time notifications
   - Active community support

4. **Scalable:**
   - Works for 1 therapist or 1000 therapists
   - Can upgrade features as you grow
   - Self-hosting option for complete control

5. **Patient Experience:**
   - Beautiful, mobile-responsive booking pages
   - Automatic email/SMS reminders
   - Time zone conversion
   - Calendar invites (.ics files)

---

## 🛠️ Implementation Plan for TherapyConnect

### Phase 1: Basic Integration (Week 1-2)

**Step 1: Create Cal.com Account**
```bash
# Sign up at cal.com
# Or self-host: https://github.com/calcom/cal.com
```

**Step 2: Install Cal.com React Package**
```bash
npm install @calcom/embed-react
```

**Step 3: Create Booking Component**
```javascript
// client/src/components/TherapistBooking.tsx
import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

export function TherapistBooking({ therapistCalLink }) {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal("ui", {
        theme: "light",
        styles: { branding: { brandColor: "#0d9488" } }, // Your teal theme
        hideEventTypeDetails: false
      });
    })();
  }, []);

  return (
    <Cal
      calLink={therapistCalLink}
      style={{ width: "100%", height: "100%", overflow: "scroll" }}
      config={{
        layout: "month_view",
        theme: "light"
      }}
    />
  );
}
```

**Step 4: Add to Therapist Profile Page**
```javascript
// In therapist-profile.tsx
import { TherapistBooking } from "@/components/TherapistBooking";

// Inside the profile tabs:
<TabsContent value="booking">
  <Card>
    <CardHeader>
      <CardTitle>Book an Appointment</CardTitle>
    </CardHeader>
    <CardContent>
      <TherapistBooking calLink={`${therapist.username}/30min`} />
    </CardContent>
  </Card>
</TabsContent>
```

**Step 5: Update Database Schema**
```typescript
// Add to shared/schema.ts
export const therapists = pgTable("therapists", {
  // ... existing fields
  calComUsername: text("cal_com_username"), // Cal.com username
  calComApiKey: text("cal_com_api_key"), // For API integration
  bookingMode: text("booking_mode").default("instant"), // "instant" or "request"
  calendarSyncEnabled: boolean("calendar_sync_enabled").default(false),
  googleCalendarId: text("google_calendar_id"),
  outlookCalendarId: text("outlook_calendar_id"),
});
```

---

### Phase 2: Advanced Features (Week 3-4)

**Feature 1: Booking Webhooks**
```javascript
// server/routes.ts - Add webhook endpoint
app.post("/api/webhooks/cal-booking", async (req, res) => {
  const { triggerEvent, payload } = req.body;

  if (triggerEvent === "BOOKING_CREATED") {
    const { uid, startTime, attendees, organizer } = payload;

    // Find therapist
    const therapist = await storage.getTherapistByEmail(organizer.email);

    if (therapist.bookingMode === "request") {
      // Send approval request email to therapist
      await sendBookingRequestEmail(therapist, payload);
    } else {
      // Send confirmation to patient
      await sendBookingConfirmationEmail(attendees[0], payload);
    }

    // Store booking in database
    await storage.createBooking({
      therapistId: therapist.id,
      patientEmail: attendees[0].email,
      startTime,
      status: therapist.bookingMode === "request" ? "pending" : "confirmed"
    });
  }

  res.json({ received: true });
});
```

**Feature 2: Therapist Availability Settings**
```javascript
// New component: AvailabilitySettings.tsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

export function AvailabilitySettings({ therapist }) {
  const [bookingMode, setBookingMode] = useState(therapist.bookingMode);

  const updateSettings = useMutation({
    mutationFn: async (settings) => {
      const res = await fetch("/api/therapist/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      return res.json();
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Booking Mode</h3>
        <RadioGroup value={bookingMode} onValueChange={setBookingMode}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="instant" id="instant" />
            <Label htmlFor="instant">
              Instant Confirmation - Patients can book directly
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="request" id="request" />
            <Label htmlFor="request">
              Request-Based - You approve each booking
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Button onClick={() => updateSettings.mutate({ bookingMode })}>
        Save Settings
      </Button>
    </div>
  );
}
```

---

### Phase 3: Calendar Sync (Week 5-6)

**Option A: Cal.com Built-in Sync** (Easiest)
- Therapists connect their Google/Outlook via Cal.com dashboard
- Cal.com handles all sync automatically
- No additional code needed

**Option B: Direct API Integration** (More control)

```javascript
// Google Calendar API integration
import { google } from 'googleapis';

async function syncGoogleCalendar(therapist) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: therapist.googleRefreshToken
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Get busy times
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      items: [{ id: therapist.googleCalendarId }]
    }
  });

  return response.data.calendars[therapist.googleCalendarId].busy;
}
```

---

## 💰 Cost Analysis

### Scenario 1: Starting Small (10 therapists, 100 bookings/month)
- **Cal.com Free Tier:** $0
- **Upgrade to HIPAA (if needed):** $12-29/month total
- **Total:** $0-29/month

### Scenario 2: Growing (50 therapists, 500 bookings/month)
- **Cal.com Teams:** $29/month
- **SMS notifications:** ~$20/month (optional)
- **Total:** $29-49/month

### Scenario 3: Large Scale (200+ therapists, 2000+ bookings/month)
- **Cal.com Enterprise:** Custom pricing (or self-host for free)
- **OnSched Alternative:** Pay-per-booking (~$0.50-1.00 per booking = $1000-2000/month)
- **Self-hosted Cal.com:** Server costs only (~$50-100/month)

---

## 🚀 Alternative: Build Your Own (Not Recommended)

If you want to build from scratch using free components:

**Tech Stack:**
- `react-appointment-picker` - Free time slot picker
- `react-big-calendar` - Free calendar display
- `node-cron` - Schedule reminders
- Google Calendar API - Free (requires setup)
- Twilio - SMS confirmations (~$0.01 per SMS)

**Estimated Development Time:** 6-8 weeks
**Estimated Cost:** Developer time + $20-50/month for SMS

**Why Not Recommended:**
- ❌ HIPAA compliance is complex to implement yourself
- ❌ Calendar sync is harder than it looks (time zones, conflicts, etc.)
- ❌ 2+ months of development vs. 1-2 days with Cal.com
- ❌ Ongoing maintenance burden

---

## ✅ Final Recommendation

**Start with Cal.com:**
1. **Week 1:** Set up Cal.com free account, test with 2-3 therapists
2. **Week 2:** Integrate embed component into TherapyConnect
3. **Week 3:** Upgrade to HIPAA plan ($12-29/month)
4. **Week 4:** Add webhook integration for booking notifications
5. **Week 5:** Enable Google/Outlook calendar sync
6. **Week 6:** Launch to all therapists

**Total Cost:** $12-29/month
**Total Dev Time:** 3-4 weeks
**Features:** ✅ HIPAA, ✅ Calendar sync, ✅ Confirmations, ✅ Requests, ✅ SMS

---

## 📚 Additional Resources

### Cal.com Resources:
- **Documentation:** https://cal.com/docs
- **API Reference:** https://cal.com/docs/api-reference
- **React Embedding:** https://cal.com/docs/how-to-guides/how-to-embed-cal
- **Self-Hosting:** https://github.com/calcom/cal.com
- **HIPAA Guide:** https://cal.com/hipaa

### Google Calendar API:
- **Documentation:** https://developers.google.com/calendar
- **OAuth Setup:** https://developers.google.com/calendar/api/guides/auth

### Outlook Calendar API:
- **Microsoft Graph:** https://learn.microsoft.com/en-us/graph/api/resources/calendar

### HIPAA Compliance:
- **Cal.com HIPAA:** Must sign BAA (Business Associate Agreement)
- **Google Workspace:** HIPAA-compliant with BAA
- **Microsoft 365:** HIPAA-compliant with BAA

---

## 🎯 Next Steps

1. **Review this document** with your team
2. **Sign up for Cal.com** free account to test
3. **Test the booking flow** with a sample therapist profile
4. **Decide on implementation timeline**
5. **I can help integrate** Cal.com into TherapyConnect when ready

**Would you like me to start implementing Cal.com integration into TherapyConnect?**

---

*Last Updated: 2025-10-18*
*Research by: Claude Code*
