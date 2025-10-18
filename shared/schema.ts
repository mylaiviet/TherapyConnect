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
