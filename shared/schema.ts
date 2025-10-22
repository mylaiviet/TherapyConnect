import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const profileStatusEnum = pgEnum('profile_status', ['pending', 'approved', 'rejected', 'inactive']);
export const adminRoleEnum = pgEnum('admin_role', ['admin', 'super_admin']);

// Therapists table
export const therapists = pgTable("therapists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  profileStatus: profileStatusEnum("profile_status").default('pending').notNull(),
  
  // Personal Info
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  credentials: text("credentials"),
  photoUrl: text("photo_url"),
  pronouns: text("pronouns"),
  languagesSpoken: text("languages_spoken").array().default(sql`ARRAY[]::text[]`),
  
  // Contact & Location
  email: text("email").notNull(),
  phone: text("phone"),
  website: text("website"),
  practiceName: text("practice_name"),
  streetAddress: text("street_address"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").default('USA'),
  latitude: decimal("latitude"),
  longitude: decimal("longitude"),
  
  // Licensing & Verification
  licenseType: text("license_type"),
  licenseNumber: text("license_number").notNull(),
  licenseState: text("license_state").notNull(),
  licenseExpiration: timestamp("license_expiration"), // License expiration date
  npiNumber: text("npi_number"),
  deaNumber: text("dea_number"), // DEA registration for prescribers
  deaExpiration: timestamp("dea_expiration"), // DEA expiration date
  boardCertified: boolean("board_certified").default(false),
  boardCertification: text("board_certification"), // Certification name (e.g., "ABPN Psychiatry")
  yearsInPractice: integer("years_in_practice"),
  graduateSchool: text("graduate_school"),
  graduationYear: integer("graduation_year"),

  // Credentialing Status
  credentialingStatus: text("credentialing_status").default('not_started'), // 'not_started', 'documents_pending', 'under_review', 'approved', 'rejected'
  credentialingStartedAt: timestamp("credentialing_started_at"),
  credentialingCompletedAt: timestamp("credentialing_completed_at"),
  lastCredentialingUpdate: timestamp("last_credentialing_update"),
  
  // Practice Details
  bio: text("bio"),
  therapeuticApproach: text("therapeutic_approach"),
  sessionTypes: text("session_types").array().default(sql`ARRAY[]::text[]`),
  modalities: text("modalities").array().default(sql`ARRAY[]::text[]`),
  acceptingNewClients: boolean("accepting_new_clients").default(true),
  
  // Specializations
  topSpecialties: text("top_specialties").array().default(sql`ARRAY[]::text[]`),
  issuesTreated: text("issues_treated").array().default(sql`ARRAY[]::text[]`),
  communitiesServed: text("communities_served").array().default(sql`ARRAY[]::text[]`),
  ageGroups: text("age_groups").array().default(sql`ARRAY[]::text[]`),
  
  // Therapy Approaches
  therapyTypes: text("therapy_types").array().default(sql`ARRAY[]::text[]`),
  treatmentOrientation: text("treatment_orientation"),
  
  // Fees & Insurance
  individualSessionFee: integer("individual_session_fee"),
  couplesSessionFee: integer("couples_session_fee"),
  offersSlidingScale: boolean("offers_sliding_scale").default(false),
  slidingScaleMin: integer("sliding_scale_min"),
  insuranceAccepted: text("insurance_accepted").array().default(sql`ARRAY[]::text[]`),
  paymentMethods: text("payment_methods").array().default(sql`ARRAY[]::text[]`),
  
  // Availability
  availableDays: text("available_days").array().default(sql`ARRAY[]::text[]`),
  availableTimes: text("available_times").array().default(sql`ARRAY[]::text[]`),
  waitlistStatus: boolean("waitlist_status").default(false),
  
  // Media
  videoIntroUrl: text("video_intro_url"),
  profileViews: integer("profile_views").default(0),
  lastLogin: timestamp("last_login"),

  // ============================================
  // PHASE 1: Core Matching Fields
  // ============================================

  // Demographics & Identity (for cultural matching)
  gender: text("gender"), // 'Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'
  dateOfBirth: text("date_of_birth"), // Format: YYYY-MM-DD, for age calculation only, never shown publicly
  raceEthnicity: text("race_ethnicity").array().default(sql`ARRAY[]::text[]`),
  religiousOrientation: text("religious_orientation"), // Optional for faith-based matching

  // Clinical Expertise (critical for matching)
  certifications: text("certifications").array().default(sql`ARRAY[]::text[]`), // EMDR Certified, DBT Certified, etc.
  primaryTheoreticalOrientation: text("primary_theoretical_orientation"), // Main therapeutic approach
  yearsSinceGraduation: integer("years_since_graduation"), // Calculated from graduationYear

  // Session Details (critical for filtering)
  sessionLengthOptions: text("session_length_options").array().default(sql`ARRAY[]::text[]`), // ['30', '45', '60', '90']
  currentWaitlistWeeks: integer("current_waitlist_weeks").default(0),

  // ============================================
  // PHASE 2: Accessibility & Availability
  // ============================================

  // Accessibility Features
  wheelchairAccessible: boolean("wheelchair_accessible").default(false),
  aslCapable: boolean("asl_capable").default(false),
  serviceAnimalFriendly: boolean("service_animal_friendly").default(false),

  // Virtual Therapy Details
  virtualPlatforms: text("virtual_platforms").array().default(sql`ARRAY[]::text[]`), // ['Zoom', 'Google Meet', 'Doxy.me']
  interstateLicenses: text("interstate_licenses").array().default(sql`ARRAY[]::text[]`), // State codes ['CA', 'NY', 'TX']

  // Scheduling & Availability
  averageResponseTime: text("average_response_time"), // 'Within 24 hours', 'Within 48 hours'
  consultationOffered: boolean("consultation_offered").default(false),
  consultationFee: integer("consultation_fee").default(0), // 0 if free
  crisisAvailability: boolean("crisis_availability").default(false), // Available for emergency sessions

  // ============================================
  // PHASE 3: Financial & Practice Preferences
  // ============================================

  // Financial Details
  superbillProvided: boolean("superbill_provided").default(false),
  fsaHsaAccepted: boolean("fsa_hsa_accepted").default(false),
  paymentPlanAvailable: boolean("payment_plan_available").default(false),

  // Therapist Preferences (what they prefer to treat)
  preferredClientAges: text("preferred_client_ages").array().default(sql`ARRAY[]::text[]`),
  conditionsNotTreated: text("conditions_not_treated").array().default(sql`ARRAY[]::text[]`), // Issues they don't treat
  severityLevelsAccepted: text("severity_levels_accepted").array().default(sql`ARRAY[]::text[]`), // ['Mild', 'Moderate', 'Severe']

  // Quality Metrics (for advanced matching)
  supervisesInterns: boolean("supervises_interns").default(false),
  clientRetentionRate: decimal("client_retention_rate", { precision: 5, scale: 2 }), // Percentage (e.g., 85.50)

  // ============================================
  // PHASE 4: Multiple Photos
  // ============================================

  // Photo Collections (photoUrl remains for backwards compatibility)
  profilePhotos: text("profile_photos").array().default(sql`ARRAY[]::text[]`), // Multiple profile photos
  officePhotos: text("office_photos").array().default(sql`ARRAY[]::text[]`), // Office environment photos
});

// Admin users table
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  role: adminRoleEnum("role").default('admin').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User credentials table (for authentication)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default('therapist'), // 'therapist' or 'admin'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Session table (created by connect-pg-simple for express-session)
// This table is managed by express-session middleware, not by our app
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(), // JSON session data
  expire: timestamp("expire").notNull(),
});

// Zod Schemas
export const insertTherapistSchema = createInsertSchema(therapists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  profileViews: true,
  lastLogin: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertTherapist = z.infer<typeof insertTherapistSchema>;
export type Therapist = typeof therapists.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Constants for form options
export const SPECIALTIES = [
  'Anxiety', 'Depression', 'Trauma', 'PTSD', 'OCD', 'ADHD', 
  'Bipolar Disorder', 'Eating Disorders', 'Substance Abuse', 
  'Grief', 'Life Transitions', 'Relationship Issues', 'Self-Esteem',
  'Stress Management', 'Anger Management', 'Chronic Pain', 'Sleep Disorders'
];

export const THERAPY_TYPES = [
  'CBT', 'DBT', 'Psychodynamic', 'EMDR', 'IFS', 'ACT',
  'Psychoanalysis', 'Humanistic', 'Narrative Therapy', 
  'Solution-Focused', 'Family Systems', 'Gestalt'
];

export const SESSION_TYPES = ['individual', 'couples', 'family', 'group'];
export const MODALITIES = ['in-person', 'telehealth', 'phone'];
export const AGE_GROUPS = ['children', 'teens', 'adults', 'seniors'];
export const COMMUNITIES_SERVED = [
  'LGBTQ+ Allied', 'BIPOC', 'Veterans', 'First Responders',
  'Healthcare Workers', 'Students', 'Immigrants', 'Disabled Community'
];

export const INSURANCE_PROVIDERS = [
  'Aetna', 'Anthem', 'Blue Cross Blue Shield', 'Cigna', 'Humana',
  'Kaiser Permanente', 'Medicare', 'Medicaid', 'UnitedHealthcare',
  'Out of Network', 'Self-Pay Only'
];

export const PAYMENT_METHODS = ['cash', 'credit card', 'HSA', 'FSA', 'check', 'venmo', 'zelle'];

export const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
export const TIME_SLOTS = ['morning', 'afternoon', 'evening', 'weekend'];

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export const LICENSE_TYPES = [
  'LCSW', 'LMFT', 'LPC', 'LPCC', 'PhD', 'PsyD', 'MD', 'DO', 'LMHC', 'LCPC'
];

// ============================================
// NEW CONSTANTS FOR MATCHING ENHANCEMENTS
// ============================================

export const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Non-binary',
  'Other',
  'Prefer not to say'
];

export const RACE_ETHNICITY_OPTIONS = [
  'African American/Black',
  'Asian',
  'Hispanic/Latino',
  'Native American/Indigenous',
  'Pacific Islander',
  'White/Caucasian',
  'Middle Eastern',
  'Multiracial',
  'Other',
  'Prefer not to say'
];

export const CERTIFICATIONS = [
  'EMDR Certified',
  'DBT Certified',
  'CBT Certified',
  'Gottman Certified (Couples Therapy)',
  'EFT Certified (Emotionally Focused Therapy)',
  'ACT Certified (Acceptance and Commitment Therapy)',
  'IFS Certified (Internal Family Systems)',
  'Brainspotting Certified',
  'Somatic Experiencing Practitioner',
  'Play Therapy Certified',
  'Art Therapy Certified',
  'Music Therapy Certified',
  'Trauma-Informed Certified',
  'PCIT Certified (Parent-Child Interaction Therapy)',
  'ABA Certified (Applied Behavior Analysis)',
  'Sandtray Therapy Certified',
  'Neurofeedback Certified',
  'Biofeedback Certified'
];

export const SESSION_LENGTHS = ['30', '45', '60', '90', '120']; // minutes

export const VIRTUAL_PLATFORMS = [
  'Zoom',
  'Google Meet',
  'Doxy.me',
  'SimplePractice',
  'TherapyNotes',
  'Microsoft Teams',
  'VSee',
  'Skype',
  'Other'
];

export const SEVERITY_LEVELS = ['Mild', 'Moderate', 'Severe'];

export const RESPONSE_TIMES = [
  'Within 24 hours',
  'Within 48 hours',
  'Within 72 hours',
  'Within 1 week',
  '1-2 weeks'
];

export const THEORETICAL_ORIENTATIONS = [
  'Cognitive Behavioral (CBT)',
  'Psychodynamic',
  'Humanistic',
  'Integrative/Holistic',
  'Dialectical Behavior Therapy (DBT)',
  'Acceptance and Commitment (ACT)',
  'Family Systems',
  'Gestalt',
  'Narrative Therapy',
  'Solution-Focused Brief Therapy',
  'Psychoanalytic',
  'Existential',
  'Person-Centered',
  'Mindfulness-Based',
  'Trauma-Focused',
  'Eclectic'
];

export const DOCUMENT_TYPES = [
  'license',
  'certification',
  'insurance',
  'diploma',
  'photo',
  'other'
];

export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  all: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

export const MAX_FILE_SIZES = {
  photo: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024 // 10MB
};

// Appointment Scheduling Enums
export const appointmentStatusEnum = pgEnum('appointment_status', ['pending', 'confirmed', 'cancelled', 'completed', 'no_show']);
export const bookingModeEnum = pgEnum('booking_mode', ['instant', 'request']);

// Chatbot Enums
export const conversationStageEnum = pgEnum('conversation_stage', ['welcome', 'demographics', 'preferences', 'goals', 'insurance', 'matching']);
export const messageSenderEnum = pgEnum('message_sender', ['bot', 'user', 'system']);
export const escalationTypeEnum = pgEnum('escalation_type', ['crisis', 'abuse_report', 'human_request', 'general']);

// Therapist Availability Table
export const therapistAvailability = pgTable("therapist_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "17:00"
  slotDuration: integer("slot_duration").default(60), // minutes per appointment
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Appointments Table
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  patientName: text("patient_name").notNull(),
  patientEmail: text("patient_email").notNull(),
  patientPhone: text("patient_phone"),
  appointmentDate: text("appointment_date").notNull(), // "2025-10-20"
  startTime: text("start_time").notNull(), // "14:00"
  endTime: text("end_time").notNull(), // "15:00"
  status: appointmentStatusEnum("status").default('pending').notNull(),
  notes: text("notes"),
  bookingType: bookingModeEnum("booking_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Therapist Booking Settings Table
export const therapistBookingSettings = pgTable("therapist_booking_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  bookingMode: bookingModeEnum("booking_mode").default('instant').notNull(),
  bufferTime: integer("buffer_time").default(0), // minutes between appointments
  advanceBookingDays: integer("advance_booking_days").default(30), // how far ahead can patients book
  minNoticeHours: integer("min_notice_hours").default(24), // minimum notice for booking
  allowCancellation: boolean("allow_cancellation").default(true),
  cancellationHours: integer("cancellation_hours").default(24), // hours before appointment
  googleCalendarConnected: boolean("google_calendar_connected").default(false),
  googleCalendarId: text("google_calendar_id"),
  outlookCalendarConnected: boolean("outlook_calendar_connected").default(false),
  outlookCalendarId: text("outlook_calendar_id"),
  emailNotifications: boolean("email_notifications").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Blocked Time Slots Table (for vacations, breaks, etc.)
export const blockedTimeSlots = pgTable("blocked_time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startDate: text("start_date").notNull(), // "2025-10-20"
  endDate: text("end_date").notNull(), // "2025-10-25"
  startTime: text("start_time"), // optional - if not set, blocks entire day
  endTime: text("end_time"), // optional
  reason: text("reason"), // "vacation", "sick", "personal", etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod Schemas for Scheduling
export const insertAvailabilitySchema = createInsertSchema(therapistAvailability).omit({
  id: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSettingsSchema = createInsertSchema(therapistBookingSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBlockedTimeSchema = createInsertSchema(blockedTimeSlots).omit({
  id: true,
  createdAt: true,
});

// Types for Scheduling
export type TherapistAvailability = typeof therapistAvailability.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type BookingSettings = typeof therapistBookingSettings.$inferSelect;
export type InsertBookingSettings = z.infer<typeof insertBookingSettingsSchema>;
export type BlockedTime = typeof blockedTimeSlots.$inferSelect;
export type InsertBlockedTime = z.infer<typeof insertBlockedTimeSchema>;

// Time slot type for availability checking
export type TimeSlot = {
  time: string; // "14:00"
  available: boolean;
  duration: number; // minutes
};

// ============================================
// CHATBOT TABLES (HIPAA-Compliant)
// ============================================

// Chat Conversations Table
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id"), // Anonymous session ID (for logged-out users)
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // Linked user if logged in
  stage: conversationStageEnum("stage").default('welcome').notNull(),
  isActive: boolean("is_active").default(true),
  crisisDetected: boolean("crisis_detected").default(false),
  escalationRequested: boolean("escalation_requested").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // 30-day retention from creation
});

// Chat Messages Table
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  sender: messageSenderEnum("sender").notNull(),
  content: text("content").notNull(), // Actual message content (PHI redacted with tokens)
  hasButtonOptions: boolean("has_button_options").default(false),
  selectedOption: text("selected_option"), // User's selected option value
  isDisclaimer: boolean("is_disclaimer").default(false),
  isCrisisAlert: boolean("is_crisis_alert").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// PHI Token Vault (Encrypted Storage)
export const chatTokens = pgTable("chat_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  tokenKey: text("token_key").notNull().unique(), // e.g., "TOKEN_NAME_001"
  encryptedValue: text("encrypted_value").notNull(), // AES-256 encrypted PHI
  fieldType: text("field_type").notNull(), // "name", "location", "phone", "email"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Preferences Collected (Non-PHI)
export const chatPreferences = pgTable("chat_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().unique().references(() => chatConversations.id, { onDelete: "cascade" }),

  // Demographics (tokenized or range-based)
  ageRange: text("age_range"), // "25-34"
  pronouns: text("pronouns"),
  language: text("language"), // "english", "spanish", etc.
  locationZip: text("location_zip"), // ZIP code only, not full address

  // Preferences
  sessionFormat: text("session_format"), // "in-person", "virtual", "either"
  availability: text("availability").array().default(sql`ARRAY[]::text[]`), // ["weekday-evening", "weekend"]
  therapistGenderPreference: text("therapist_gender_preference"),
  therapistAgePreference: text("therapist_age_preference"),
  culturalBackgroundMatch: boolean("cultural_background_match").default(false),
  therapyApproach: text("therapy_approach").array().default(sql`ARRAY[]::text[]`), // ["CBT", "DBT"]
  hasPreviousTherapyExperience: boolean("has_previous_therapy_experience"),
  previousTherapyFeedback: text("previous_therapy_feedback"),

  // Goals
  treatmentGoals: text("treatment_goals"),
  treatmentDuration: text("treatment_duration"), // "short-term", "long-term"

  // Insurance
  paymentMethod: text("payment_method"), // "insurance", "out-of-pocket"
  insuranceProvider: text("insurance_provider"), // "bcbs", "aetna", etc.
  budgetRange: text("budget_range"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Crisis Escalations Log
export const chatEscalations = pgTable("chat_escalations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  escalationType: escalationTypeEnum("escalation_type").notNull(),
  triggerMessage: text("trigger_message"), // The message that triggered escalation
  crisisKeywords: text("crisis_keywords").array(), // Keywords detected
  actionTaken: text("action_taken"), // "displayed_resources", "notified_staff", etc.
  staffNotified: boolean("staff_notified").default(false),
  staffNotifiedAt: timestamp("staff_notified_at"),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Therapist Match Results (Links conversations to recommended therapists)
export const chatTherapistMatches = pgTable("chat_therapist_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  therapistId: varchar("therapist_id").notNull().references(() => therapists.id, { onDelete: "cascade" }),
  matchScore: integer("match_score"), // 0-100 based on preference alignment
  displayOrder: integer("display_order"), // Order shown to user
  clicked: boolean("clicked").default(false),
  clickedAt: timestamp("clicked_at"),
  booked: boolean("booked").default(false),
  bookedAt: timestamp("booked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// ZIP CODES TABLE
// ============================================

export const zipCodes = pgTable("zip_codes", {
  zip: varchar("zip", { length: 5 }).primaryKey(),
  city: text("city").notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  county: text("county"),
  timezone: text("timezone"),
});

// ============================================
// THERAPIST DOCUMENTS TABLE (PHASE 4)
// ============================================

export const therapistDocuments = pgTable("therapist_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => therapists.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(), // 'license', 'certification', 'insurance', 'diploma', 'photo', 'other'
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(), // S3 URL or local file path
  fileSize: integer("file_size").notNull(), // bytes
  mimeType: text("mime_type").notNull(),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  expirationDate: text("expiration_date"), // For licenses/certifications (YYYY-MM-DD)
  metadata: text("metadata"), // JSON string for additional info
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// CHATBOT ZOD SCHEMAS
// ============================================

export const insertConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertTokenSchema = createInsertSchema(chatTokens).omit({
  id: true,
  createdAt: true,
});

export const insertPreferencesSchema = createInsertSchema(chatPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEscalationSchema = createInsertSchema(chatEscalations).omit({
  id: true,
  createdAt: true,
});

export const insertChatMatchSchema = createInsertSchema(chatTherapistMatches).omit({
  id: true,
  createdAt: true,
});

// ============================================
// THERAPIST DOCUMENTS ZOD SCHEMAS
// ============================================

export const insertTherapistDocumentSchema = createInsertSchema(therapistDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================
// CHATBOT TYPES
// ============================================

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertConversationSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertMessageSchema>;

export type ChatToken = typeof chatTokens.$inferSelect;
export type InsertChatToken = z.infer<typeof insertTokenSchema>;

export type ChatPreferences = typeof chatPreferences.$inferSelect;
export type InsertChatPreferences = z.infer<typeof insertPreferencesSchema>;

export type ChatEscalation = typeof chatEscalations.$inferSelect;
export type InsertChatEscalation = z.infer<typeof insertEscalationSchema>;

export type ChatTherapistMatch = typeof chatTherapistMatches.$inferSelect;
export type InsertChatMatch = z.infer<typeof insertChatMatchSchema>;

export type ZipCode = typeof zipCodes.$inferSelect;
export type InsertZipCode = typeof zipCodes.$inferInsert;

// ============================================
// THERAPIST DOCUMENTS TYPES
// ============================================

export type TherapistDocument = typeof therapistDocuments.$inferSelect;
export type InsertTherapistDocument = z.infer<typeof insertTherapistDocumentSchema>;

// ============================================
// ANALYTICS TABLES (Geolocation Tracking)
// ============================================

// Analytics Enums
export const locationMethodEnum = pgEnum('location_method', ['ip', 'gps', 'manual', 'unknown']);
export const aggregationTypeEnum = pgEnum('aggregation_type', ['daily', 'weekly', 'monthly']);
export const userActionTypeEnum = pgEnum('user_action_type', ['search', 'profile_view', 'booking', 'account_creation']);

// Page Views Table (Anonymous Traffic)
export const pageViews = pgTable("page_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // Geographic data (city-level only)
  city: text("city"),
  state: text("state"),
  country: text("country").default('USA'),

  // Detection method
  locationMethod: text("location_method"),

  // Page context
  pagePath: text("page_path"),
  referrerDomain: text("referrer_domain"),

  // Session tracking (anonymous)
  sessionId: varchar("session_id"),
  isNewSession: boolean("is_new_session").default(true),

  // Device info (non-identifying)
  deviceType: text("device_type"),
  browserFamily: text("browser_family"),
});

// Location Searches Table (Search Analytics)
export const locationSearches = pgTable("location_searches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // Search location (city-level only)
  searchCity: text("search_city"),
  searchState: text("search_state"),
  searchZip: text("search_zip"),

  // Search parameters
  radiusMiles: integer("radius_miles"),
  locationMethod: text("location_method").notNull(),

  // Results
  resultsFound: integer("results_found"),
  resultsClicked: integer("results_clicked").default(0),

  // Filters used (anonymized)
  hadSpecialtyFilter: boolean("had_specialty_filter").default(false),
  hadInsuranceFilter: boolean("had_insurance_filter").default(false),
  hadModalityFilter: boolean("had_modality_filter").default(false),
  hadGenderFilter: boolean("had_gender_filter").default(false),

  // Session tracking (anonymous)
  sessionId: varchar("session_id"),
});

// Geographic Aggregates Table (Permanent Summary)
export const geographicAggregates = pgTable("geographic_aggregates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow(),

  // Time period
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  aggregationType: text("aggregation_type").notNull(),

  // Location
  city: text("city"),
  state: text("state").notNull(),
  country: text("country").default('USA'),

  // Metrics
  totalVisitors: integer("total_visitors").default(0),
  totalSearches: integer("total_searches").default(0),
  totalResultsFound: integer("total_results_found").default(0),
  avgSearchRadius: integer("avg_search_radius"),

  // Location method breakdown
  ipLocationCount: integer("ip_location_count").default(0),
  gpsLocationCount: integer("gps_location_count").default(0),
  manualLocationCount: integer("manual_location_count").default(0),
});

// User Location History Table (Registered Users - PHI)
export const userLocationHistory = pgTable("user_location_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // Location (city-level only)
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default('USA'),

  // Context
  locationMethod: text("location_method"),
  actionType: text("action_type"),
});

// Zod Schemas for Analytics
export const insertPageViewSchema = createInsertSchema(pageViews).omit({
  id: true,
  createdAt: true,
});

export const insertLocationSearchSchema = createInsertSchema(locationSearches).omit({
  id: true,
  createdAt: true,
});

export const insertGeographicAggregateSchema = createInsertSchema(geographicAggregates).omit({
  id: true,
  createdAt: true,
});

export const insertUserLocationHistorySchema = createInsertSchema(userLocationHistory).omit({
  id: true,
  createdAt: true,
});

// Types for Analytics
export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = z.infer<typeof insertPageViewSchema>;

export type LocationSearch = typeof locationSearches.$inferSelect;
export type InsertLocationSearch = z.infer<typeof insertLocationSearchSchema>;

export type GeographicAggregate = typeof geographicAggregates.$inferSelect;
export type InsertGeographicAggregate = z.infer<typeof insertGeographicAggregateSchema>;

export type UserLocationHistory = typeof userLocationHistory.$inferSelect;
export type InsertUserLocationHistory = z.infer<typeof insertUserLocationHistorySchema>;

// ============================================
// THERAPIST ANALYTICS TABLES
// ============================================

// Therapist Profile Views (Enhanced Analytics)
export const therapistProfileViews = pgTable("therapist_profile_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => therapists.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id"),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
  viewDurationSeconds: integer("view_duration_seconds"),
  referrerPage: text("referrer_page"),
  clickedBookButton: boolean("clicked_book_button").default(false),
  deviceType: text("device_type"),
  browserFamily: text("browser_family"),
  city: text("city"),
  state: text("state"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Therapist Growth Metrics
export const therapistGrowthMetrics = pgTable("therapist_growth_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodStart: text("period_start").notNull(), // DATE as text (YYYY-MM-DD)
  periodEnd: text("period_end").notNull(),
  periodType: text("period_type").notNull(), // 'daily', 'weekly', 'monthly'
  newSignups: integer("new_signups").default(0),
  approvedCount: integer("approved_count").default(0),
  rejectedCount: integer("rejected_count").default(0),
  inactiveCount: integer("inactive_count").default(0),
  avgApprovalTimeHours: decimal("avg_approval_time_hours", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Booking Analytics (Daily Aggregates)
export const bookingAnalytics = pgTable("booking_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  periodDate: text("period_date").notNull(), // DATE as text (YYYY-MM-DD)
  totalBookings: integer("total_bookings").default(0),
  confirmedBookings: integer("confirmed_bookings").default(0),
  cancelledBookings: integer("cancelled_bookings").default(0),
  rejectedBookings: integer("rejected_bookings").default(0),
  profileViews: integer("profile_views").default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
  avgResponseTimeHours: decimal("avg_response_time_hours", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Search Conversion Funnel
export const searchConversionFunnel = pgTable("search_conversion_funnel", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  searchId: varchar("search_id"),
  stage: text("stage").notNull(), // 'search', 'results_view', 'profile_view', 'booking_request', 'booking_confirmed'
  therapistId: varchar("therapist_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  city: text("city"),
  state: text("state"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Specialty Demand Metrics
export const specialtyDemandMetrics = pgTable("specialty_demand_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodDate: text("period_date").notNull(), // DATE as text (YYYY-MM-DD)
  specialty: text("specialty").notNull(),
  searchCount: integer("search_count").default(0),
  availableTherapists: integer("available_therapists").default(0),
  avgResultsPerSearch: decimal("avg_results_per_search", { precision: 10, scale: 2 }),
  city: text("city"),
  state: text("state"),
  supplyDemandRatio: decimal("supply_demand_ratio", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod Schemas for Therapist Analytics
export const insertTherapistProfileViewSchema = createInsertSchema(therapistProfileViews).omit({
  id: true,
  createdAt: true,
  viewedAt: true,
});

export const insertTherapistGrowthMetricsSchema = createInsertSchema(therapistGrowthMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertBookingAnalyticsSchema = createInsertSchema(bookingAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertSearchConversionFunnelSchema = createInsertSchema(searchConversionFunnel).omit({
  id: true,
  createdAt: true,
  timestamp: true,
});

export const insertSpecialtyDemandMetricsSchema = createInsertSchema(specialtyDemandMetrics).omit({
  id: true,
  createdAt: true,
});

// Types for Therapist Analytics
export type TherapistProfileView = typeof therapistProfileViews.$inferSelect;
export type InsertTherapistProfileView = z.infer<typeof insertTherapistProfileViewSchema>;

export type TherapistGrowthMetrics = typeof therapistGrowthMetrics.$inferSelect;
export type InsertTherapistGrowthMetrics = z.infer<typeof insertTherapistGrowthMetricsSchema>;

export type BookingAnalytics = typeof bookingAnalytics.$inferSelect;
export type InsertBookingAnalytics = z.infer<typeof insertBookingAnalyticsSchema>;

export type SearchConversionFunnel = typeof searchConversionFunnel.$inferSelect;
export type InsertSearchConversionFunnel = z.infer<typeof insertSearchConversionFunnelSchema>;

export type SpecialtyDemandMetrics = typeof specialtyDemandMetrics.$inferSelect;
export type InsertSpecialtyDemandMetrics = z.infer<typeof insertSpecialtyDemandMetricsSchema>;

// ============================================
// CREDENTIALING SYSTEM
// ============================================

// Document types enum
export const documentTypeEnum = pgEnum('document_type', [
  'license',
  'transcript',
  'diploma',
  'government_id',
  'headshot',
  'liability_insurance',
  'w9',
  'background_check_authorization',
  'self_disclosure',
  'resume',
  'dea_certificate',
  'board_certification',
  'collaborative_agreement',
  'other'
]);

// Verification status enum
export const verificationStatusEnum = pgEnum('verification_status', [
  'not_started',
  'in_progress',
  'verified',
  'failed',
  'requires_review'
]);

// Credentialing Documents table
export const credentialingDocuments = pgTable("credentialing_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull(),
  documentType: documentTypeEnum("document_type").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"), // in bytes
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  uploadedBy: varchar("uploaded_by"), // user ID who uploaded
  expirationDate: timestamp("expiration_date"), // for licenses, insurance, etc.
  verified: boolean("verified").default(false),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by"), // admin user ID
  notes: text("notes"), // admin notes about this document
});

// Credentialing Verifications table - tracks each verification step
export const credentialingVerifications = pgTable("credentialing_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull(),
  verificationType: text("verification_type").notNull(), // 'npi', 'license', 'education', 'background', 'dea', 'oig', 'sam'
  status: verificationStatusEnum("status").default('not_started').notNull(),
  verificationDate: timestamp("verification_date"),
  verifiedBy: varchar("verified_by"), // admin user ID
  verificationSource: text("verification_source"), // URL or source name
  verificationData: text("verification_data"), // JSON string with verification details
  expirationDate: timestamp("expiration_date"), // when this verification expires
  nextCheckDate: timestamp("next_check_date"), // when to re-verify
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// OIG Exclusions table - monthly download of OIG LEIE data
export const oigExclusions = pgTable("oig_exclusions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  businessName: text("business_name"),
  general: text("general"), // General category
  specialty: text("specialty"),
  npi: text("npi"),
  dob: text("dob"), // Date of birth
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  exclType: text("excl_type"), // Exclusion type
  exclDate: text("excl_date"), // Exclusion date
  reinDate: text("rein_date"), // Reinstatement date
  waiverDate: text("waiver_date"),
  waiverState: text("waiver_state"),
  importedAt: timestamp("imported_at").defaultNow().notNull(),
});

// Background Check Results table
export const backgroundCheckResults = pgTable("background_check_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull(),
  vendor: text("vendor").notNull(), // 'checkr', 'sterling', etc.
  vendorCheckId: text("vendor_check_id"), // ID from vendor system
  status: text("status").notNull(), // 'pending', 'clear', 'consider', 'suspended'
  completedAt: timestamp("completed_at"),
  reportUrl: text("report_url"), // URL to full report
  criminalRecords: boolean("criminal_records").default(false),
  sexOffenderRegistry: boolean("sex_offender_registry").default(false),
  oigExclusion: boolean("oig_exclusion").default(false),
  samExclusion: boolean("sam_exclusion").default(false),
  resultData: text("result_data"), // JSON string with full results
  reviewedBy: varchar("reviewed_by"), // admin user ID
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Credentialing Notes table - admin notes during credentialing process
export const credentialingNotes = pgTable("credentialing_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull(),
  authorId: varchar("author_id").notNull(), // admin user ID
  noteType: text("note_type"), // 'general', 'concern', 'follow_up', 'decision'
  note: text("note").notNull(),
  isInternal: boolean("is_internal").default(true), // if false, shared with provider
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Credentialing Timeline table - tracks progress through credentialing workflow
export const credentialingTimeline = pgTable("credentialing_timeline", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull(),
  phase: text("phase").notNull(), // 'document_review', 'license_verification', 'education', 'background', 'insurance', 'final_review', 'approved'
  status: text("status").notNull(), // 'pending', 'in_progress', 'completed', 'failed'
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  assignedTo: varchar("assigned_to"), // admin user ID
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// BLOG SYSTEM
// ============================================

// Blog article status enum
export const articleStatusEnum = pgEnum('article_status', ['draft', 'published', 'archived']);
export const commentStatusEnum = pgEnum('comment_status', ['pending', 'approved', 'rejected', 'spam']);

// Blog Articles table
export const blogArticles = pgTable("blog_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(), // markdown content
  authorId: varchar("author_id").references(() => blogAuthors.id),
  status: articleStatusEnum("status").default('draft').notNull(),
  category: text("category").notNull(),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  featuredImage: text("featured_image"),
  readTime: integer("read_time"), // in minutes

  // SEO fields
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords").array().default(sql`ARRAY[]::text[]`),

  // Analytics
  views: integer("views").default(0),
  likes: integer("likes").default(0),

  // Publishing
  publishedAt: timestamp("published_at"),
  scheduledFor: timestamp("scheduled_for"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Blog Authors table
export const blogAuthors = pgTable("blog_authors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  credentials: text("credentials"), // "PhD, LCSW"
  bio: text("bio"),
  photoUrl: text("photo_url"),
  email: text("email"),

  // Social links
  twitterUrl: text("twitter_url"),
  linkedinUrl: text("linkedin_url"),
  websiteUrl: text("website_url"),

  // Stats
  articleCount: integer("article_count").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Blog Categories table
export const blogCategories = pgTable("blog_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"), // lucide icon name
  articleCount: integer("article_count").default(0),
  displayOrder: integer("display_order").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Blog Comments table
export const blogComments = pgTable("blog_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull().references(() => blogArticles.id, { onDelete: "cascade" }),
  parentId: varchar("parent_id"), // for nested replies

  // Commenter info (supports both logged in and guest)
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  guestName: text("guest_name"),
  guestEmail: text("guest_email"),

  content: text("content").notNull(),
  status: commentStatusEnum("status").default('pending').notNull(),

  // Moderation
  moderatedBy: varchar("moderated_by").references(() => users.id, { onDelete: "set null" }),
  moderatedAt: timestamp("moderated_at"),
  moderationNotes: text("moderation_notes"),

  // Engagement
  likes: integer("likes").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Blog Newsletter Subscribers
export const blogNewsletterSubscribers = pgTable("blog_newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  isActive: boolean("is_active").default(true),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  source: text("source").default('blog_page'), // 'blog_page', 'footer', 'popup'
});

// Blog Article Likes (track who liked what)
export const blogArticleLikes = pgTable("blog_article_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull().references(() => blogArticles.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id"), // for anonymous users
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Automated Alerts table - for expiration warnings, exclusion matches, etc.
export const credentialingAlerts = pgTable("credentialing_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull(),
  alertType: text("alert_type").notNull(), // 'license_expiring', 'insurance_expiring', 'oig_match', 'document_missing'
  severity: text("severity").notNull(), // 'info', 'warning', 'critical'
  message: text("message").notNull(),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email Preferences for Credentialing Notifications
export const credentialingEmailPreferences = pgTable("credentialing_email_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").notNull().unique(),

  // Email notification preferences
  documentUploadConfirmation: boolean("document_upload_confirmation").default(true),
  documentVerified: boolean("document_verified").default(true),
  documentExpiring: boolean("document_expiring").default(true),
  phaseCompleted: boolean("phase_completed").default(true),
  credentialingApproved: boolean("credentialing_approved").default(true),
  alerts: boolean("alerts").default(true),
  criticalAlertsOnly: boolean("critical_alerts_only").default(false),

  // Expiration reminder timing (days before expiration)
  expirationReminderDays: integer("expiration_reminder_days").array().default(sql`ARRAY[90, 60, 30, 7]::integer[]`),

  // Email delivery preferences
  emailEnabled: boolean("email_enabled").default(true),
  digestMode: boolean("digest_mode").default(false), // If true, batch non-urgent emails
  digestFrequency: text("digest_frequency").default("daily"), // 'daily', 'weekly'

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod schemas for credentialing tables
export const insertCredentialingDocumentSchema = createInsertSchema(credentialingDocuments).omit({
  id: true,
  uploadedAt: true,
  verifiedAt: true,
});

export const insertCredentialingVerificationSchema = createInsertSchema(credentialingVerifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOigExclusionSchema = createInsertSchema(oigExclusions).omit({
  id: true,
  importedAt: true,
});

export const insertBackgroundCheckResultSchema = createInsertSchema(backgroundCheckResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCredentialingNoteSchema = createInsertSchema(credentialingNotes).omit({
  id: true,
  createdAt: true,
});

export const insertCredentialingTimelineSchema = createInsertSchema(credentialingTimeline).omit({
  id: true,
  createdAt: true,
});

export const insertCredentialingAlertSchema = createInsertSchema(credentialingAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertCredentialingEmailPreferencesSchema = createInsertSchema(credentialingEmailPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for credentialing tables
export type CredentialingDocument = typeof credentialingDocuments.$inferSelect;
export type InsertCredentialingDocument = z.infer<typeof insertCredentialingDocumentSchema>;

export type CredentialingVerification = typeof credentialingVerifications.$inferSelect;
export type InsertCredentialingVerification = z.infer<typeof insertCredentialingVerificationSchema>;

export type OigExclusion = typeof oigExclusions.$inferSelect;
export type InsertOigExclusion = z.infer<typeof insertOigExclusionSchema>;

export type BackgroundCheckResult = typeof backgroundCheckResults.$inferSelect;
export type InsertBackgroundCheckResult = z.infer<typeof insertBackgroundCheckResultSchema>;

export type CredentialingNote = typeof credentialingNotes.$inferSelect;
export type InsertCredentialingNote = z.infer<typeof insertCredentialingNoteSchema>;

export type CredentialingTimeline = typeof credentialingTimeline.$inferSelect;
export type InsertCredentialingTimeline = z.infer<typeof insertCredentialingTimelineSchema>;

export type CredentialingAlert = typeof credentialingAlerts.$inferSelect;
export type InsertCredentialingAlert = z.infer<typeof insertCredentialingAlertSchema>;

// ============================================
// BLOG SYSTEM ZOD SCHEMAS
// ============================================

export const insertBlogArticleSchema = createInsertSchema(blogArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  likes: true,
});

export const insertBlogAuthorSchema = createInsertSchema(blogAuthors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  articleCount: true,
});

export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  articleCount: true,
});

export const insertBlogCommentSchema = createInsertSchema(blogComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likes: true,
});

export const insertNewsletterSubscriberSchema = createInsertSchema(blogNewsletterSubscribers).omit({
  id: true,
  subscribedAt: true,
});

export const insertBlogArticleLikeSchema = createInsertSchema(blogArticleLikes).omit({
  id: true,
  createdAt: true,
});

// ============================================
// BLOG SYSTEM TYPES
// ============================================

export type BlogArticle = typeof blogArticles.$inferSelect;
export type InsertBlogArticle = z.infer<typeof insertBlogArticleSchema>;

export type BlogAuthor = typeof blogAuthors.$inferSelect;
export type InsertBlogAuthor = z.infer<typeof insertBlogAuthorSchema>;

export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;

export type BlogComment = typeof blogComments.$inferSelect;
export type InsertBlogComment = z.infer<typeof insertBlogCommentSchema>;

export type NewsletterSubscriber = typeof blogNewsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;

export type BlogArticleLike = typeof blogArticleLikes.$inferSelect;
export type InsertBlogArticleLike = z.infer<typeof insertBlogArticleLikeSchema>;

// ============================================
// BLOG CONSTANTS
// ============================================

export const BLOG_CATEGORIES = [
  'Mental Health Tips',
  'Therapy Insights',
  'Workplace Wellness',
  'Getting Started',
  'Mental Health Awareness',
  'Wellness & Self-Care',
  'Therapy Education',
  'CBT Techniques',
  'Coping Strategies'
];

export const BLOG_TAGS = [
  'Anxiety',
  'Depression',
  'CBT',
  'Mindfulness',
  'Self-Care',
  'Work-Life Balance',
  'Relationships',
  'Stress Management',
  'Mental Health',
  'Therapy',
  'Coping Skills',
  'PTSD',
  'Grief',
  'Burnout',
  'Sleep',
  'Resilience'
];
