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
  npiNumber: text("npi_number"),
  yearsInPractice: integer("years_in_practice"),
  graduateSchool: text("graduate_school"),
  graduationYear: integer("graduation_year"),
  
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
