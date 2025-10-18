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
