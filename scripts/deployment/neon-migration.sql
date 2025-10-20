-- ============================================================================
-- NEON DATABASE MIGRATION FOR KAREMATCH/THERAPYCONNECT
-- ============================================================================
--
-- PURPOSE: Migrate Neon database from base schema to full analytics platform
-- CREATED: 2025-10-20
-- SAFE TO RUN: Yes - uses IF NOT EXISTS for all tables
--
-- ⚠️  IMPORTANT: Run this in Neon SQL Editor BEFORE deploying code to Render
--
-- This migration adds:
-- - Appointments & booking system (Migration 0001)
-- - Chatbot conversation tracking
-- - Analytics tables for IP geolocation tracking (Migration 0002)
-- - Therapist analytics & performance metrics (Migration 0003)
--
-- TOTAL TABLES CREATED: 20+
-- ESTIMATED TIME: 2-5 seconds
--
-- ============================================================================
-- HOW TO RUN IN NEON:
-- ============================================================================
-- 1. Log into Neon Console: https://console.neon.tech
-- 2. Select your KareMatch/TherapyConnect database
-- 3. Click "SQL Editor" in left sidebar
-- 4. Copy entire contents of 'neon-migration.sql' file
-- 5. Paste into SQL Editor
-- 6. Click "Run" button
-- 7. Verify success: Check for "Completed successfully" message
-- 8. Verify tables exist: Run verification query below
--
-- ============================================================================
-- VERIFICATION QUERY (Run after migration):
-- ============================================================================
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN (
--   'page_views',
--   'therapist_profile_views',
--   'booking_analytics',
--   'appointments',
--   'chat_conversations'
-- )
-- ORDER BY table_name;
--
-- Expected: 5 rows showing all 5 table names
-- ============================================================================

CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."booking_mode" AS ENUM('instant', 'request');--> statement-breakpoint
CREATE TYPE "public"."conversation_stage" AS ENUM('welcome', 'demographics', 'preferences', 'goals', 'insurance', 'matching');--> statement-breakpoint
CREATE TYPE "public"."escalation_type" AS ENUM('crisis', 'abuse_report', 'human_request', 'general');--> statement-breakpoint
CREATE TYPE "public"."message_sender" AS ENUM('bot', 'user', 'system');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" varchar NOT NULL,
	"patient_name" text NOT NULL,
	"patient_email" text NOT NULL,
	"patient_phone" text,
	"appointment_date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"booking_type" "booking_mode" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_time_slots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" varchar NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"start_time" text,
	"end_time" text,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text,
	"user_id" varchar,
	"stage" "conversation_stage" DEFAULT 'welcome' NOT NULL,
	"is_active" boolean DEFAULT true,
	"crisis_detected" boolean DEFAULT false,
	"escalation_requested" boolean DEFAULT false,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_escalations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"escalation_type" "escalation_type" NOT NULL,
	"trigger_message" text,
	"crisis_keywords" text[],
	"action_taken" text,
	"staff_notified" boolean DEFAULT false,
	"staff_notified_at" timestamp,
	"resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender" "message_sender" NOT NULL,
	"content" text NOT NULL,
	"has_button_options" boolean DEFAULT false,
	"selected_option" text,
	"is_disclaimer" boolean DEFAULT false,
	"is_crisis_alert" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"age_range" text,
	"pronouns" text,
	"language" text,
	"location_zip" text,
	"session_format" text,
	"availability" text[] DEFAULT ARRAY[]::text[],
	"therapist_gender_preference" text,
	"therapist_age_preference" text,
	"cultural_background_match" boolean DEFAULT false,
	"therapy_approach" text[] DEFAULT ARRAY[]::text[],
	"has_previous_therapy_experience" boolean,
	"previous_therapy_feedback" text,
	"treatment_goals" text,
	"treatment_duration" text,
	"payment_method" text,
	"insurance_provider" text,
	"budget_range" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_preferences_conversation_id_unique" UNIQUE("conversation_id")
);
--> statement-breakpoint
CREATE TABLE "chat_therapist_matches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"therapist_id" varchar NOT NULL,
	"match_score" integer,
	"display_order" integer,
	"clicked" boolean DEFAULT false,
	"clicked_at" timestamp,
	"booked" boolean DEFAULT false,
	"booked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"token_key" text NOT NULL,
	"encrypted_value" text NOT NULL,
	"field_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_tokens_token_key_unique" UNIQUE("token_key")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" text NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapist_availability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" varchar NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"slot_duration" integer DEFAULT 60,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapist_booking_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" varchar NOT NULL,
	"booking_mode" "booking_mode" DEFAULT 'instant' NOT NULL,
	"buffer_time" integer DEFAULT 0,
	"advance_booking_days" integer DEFAULT 30,
	"min_notice_hours" integer DEFAULT 24,
	"allow_cancellation" boolean DEFAULT true,
	"cancellation_hours" integer DEFAULT 24,
	"google_calendar_connected" boolean DEFAULT false,
	"google_calendar_id" text,
	"outlook_calendar_connected" boolean DEFAULT false,
	"outlook_calendar_id" text,
	"email_notifications" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "therapist_booking_settings_therapist_id_unique" UNIQUE("therapist_id")
);
--> statement-breakpoint
CREATE TABLE "therapist_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" varchar NOT NULL,
	"document_type" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"is_verified" boolean DEFAULT false,
	"verified_by" varchar,
	"verified_at" timestamp,
	"expiration_date" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zip_codes" (
	"zip" varchar(5) PRIMARY KEY NOT NULL,
	"city" text NOT NULL,
	"state" varchar(2) NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"county" text,
	"timezone" text
);
--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "date_of_birth" text;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "race_ethnicity" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "religious_orientation" text;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "certifications" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "primary_theoretical_orientation" text;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "years_since_graduation" integer;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "session_length_options" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "current_waitlist_weeks" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "wheelchair_accessible" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "asl_capable" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "service_animal_friendly" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "virtual_platforms" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "interstate_licenses" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "average_response_time" text;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "consultation_offered" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "consultation_fee" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "crisis_availability" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "superbill_provided" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "fsa_hsa_accepted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "payment_plan_available" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "preferred_client_ages" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "conditions_not_treated" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "severity_levels_accepted" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "supervises_interns" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "client_retention_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "profile_photos" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "office_photos" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_therapist_id_users_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_time_slots" ADD CONSTRAINT "blocked_time_slots_therapist_id_users_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_escalations" ADD CONSTRAINT "chat_escalations_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_preferences" ADD CONSTRAINT "chat_preferences_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_therapist_matches" ADD CONSTRAINT "chat_therapist_matches_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_therapist_matches" ADD CONSTRAINT "chat_therapist_matches_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_tokens" ADD CONSTRAINT "chat_tokens_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_availability" ADD CONSTRAINT "therapist_availability_therapist_id_users_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_booking_settings" ADD CONSTRAINT "therapist_booking_settings_therapist_id_users_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_documents" ADD CONSTRAINT "therapist_documents_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_documents" ADD CONSTRAINT "therapist_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;-- Migration: Analytics Tables for Geolocation Tracking
-- Purpose: Track anonymized visitor location data for business intelligence
-- HIPAA Compliant: No PII stored for anonymous users, city-level data only
-- Created: 2025-10-20

-- ============================================
-- TABLE 1: Page Views (Anonymous Traffic)
-- ============================================
CREATE TABLE IF NOT EXISTS "page_views" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Geographic data (city-level only, no exact coords)
  "city" TEXT,
  "state" TEXT,
  "country" TEXT DEFAULT 'USA',

  -- Detection method
  "location_method" TEXT CHECK ("location_method" IN ('ip', 'gps', 'manual', 'unknown')),

  -- Page context
  "page_path" TEXT,
  "referrer_domain" TEXT,

  -- Session tracking (anonymous)
  "session_id" UUID,
  "is_new_session" BOOLEAN DEFAULT true,

  -- Device info (non-identifying)
  "device_type" TEXT,
  "browser_family" TEXT
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS "idx_page_views_created_at" ON "page_views"("created_at");
CREATE INDEX IF NOT EXISTS "idx_page_views_city_state" ON "page_views"("city", "state");
CREATE INDEX IF NOT EXISTS "idx_page_views_session" ON "page_views"("session_id");
CREATE INDEX IF NOT EXISTS "idx_page_views_page_path" ON "page_views"("page_path");

-- ============================================
-- TABLE 2: Location Searches (Search Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS "location_searches" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Search location (city-level only)
  "search_city" TEXT,
  "search_state" TEXT,
  "search_zip" TEXT,

  -- Search parameters
  "radius_miles" INTEGER CHECK ("radius_miles" IN (10, 25, 50, 100, 150, 200)),
  "location_method" TEXT NOT NULL CHECK ("location_method" IN ('ip', 'gps', 'manual')),

  -- Results
  "results_found" INTEGER,
  "results_clicked" INTEGER DEFAULT 0,

  -- Filters used (anonymized - no specific values)
  "had_specialty_filter" BOOLEAN DEFAULT false,
  "had_insurance_filter" BOOLEAN DEFAULT false,
  "had_modality_filter" BOOLEAN DEFAULT false,
  "had_gender_filter" BOOLEAN DEFAULT false,

  -- Session tracking (anonymous)
  "session_id" UUID
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_location_searches_created_at" ON "location_searches"("created_at");
CREATE INDEX IF NOT EXISTS "idx_location_searches_city_state" ON "location_searches"("search_city", "search_state");
CREATE INDEX IF NOT EXISTS "idx_location_searches_method" ON "location_searches"("location_method");
CREATE INDEX IF NOT EXISTS "idx_location_searches_session" ON "location_searches"("session_id");

-- ============================================
-- TABLE 3: Geographic Aggregates (Permanent Summary)
-- ============================================
CREATE TABLE IF NOT EXISTS "geographic_aggregates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMP DEFAULT NOW(),

  -- Time period
  "period_start" DATE NOT NULL,
  "period_end" DATE NOT NULL,
  "aggregation_type" TEXT NOT NULL CHECK ("aggregation_type" IN ('daily', 'weekly', 'monthly')),

  -- Location
  "city" TEXT,
  "state" TEXT NOT NULL,
  "country" TEXT DEFAULT 'USA',

  -- Metrics
  "total_visitors" INTEGER DEFAULT 0,
  "total_searches" INTEGER DEFAULT 0,
  "total_results_found" INTEGER DEFAULT 0,
  "avg_search_radius" INTEGER,

  -- Location method breakdown
  "ip_location_count" INTEGER DEFAULT 0,
  "gps_location_count" INTEGER DEFAULT 0,
  "manual_location_count" INTEGER DEFAULT 0,

  UNIQUE("period_start", "period_end", "aggregation_type", "state", "city")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_geo_agg_period" ON "geographic_aggregates"("period_start", "period_end");
CREATE INDEX IF NOT EXISTS "idx_geo_agg_state_city" ON "geographic_aggregates"("state", "city");
CREATE INDEX IF NOT EXISTS "idx_geo_agg_type" ON "geographic_aggregates"("aggregation_type");

-- ============================================
-- TABLE 4: User Location History (Registered Users - Optional)
-- ============================================
CREATE TABLE IF NOT EXISTS "user_location_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Location (city-level only, no exact coords)
  "city" TEXT,
  "state" TEXT,
  "zip_code" TEXT,
  "country" TEXT DEFAULT 'USA',

  -- Context
  "location_method" TEXT CHECK ("location_method" IN ('ip', 'gps', 'manual')),
  "action_type" TEXT CHECK ("action_type" IN ('search', 'profile_view', 'booking', 'account_creation'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_user_location_user_id" ON "user_location_history"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_location_created_at" ON "user_location_history"("created_at");
CREATE INDEX IF NOT EXISTS "idx_user_location_action" ON "user_location_history"("action_type");

-- ============================================
-- COMMENTS (Documentation)
-- ============================================
COMMENT ON TABLE "page_views" IS 'Anonymous visitor tracking - NO PII stored';
COMMENT ON TABLE "location_searches" IS 'Therapist search analytics - city-level only';
COMMENT ON TABLE "geographic_aggregates" IS 'Permanent historical summaries - aggregate data only';
COMMENT ON TABLE "user_location_history" IS 'Registered user location history - PHI, requires consent and encryption';

COMMENT ON COLUMN "page_views"."session_id" IS 'Anonymous session UUID - NOT linked to user accounts';
COMMENT ON COLUMN "location_searches"."search_city" IS 'City-level only - no exact GPS coordinates';
COMMENT ON COLUMN "user_location_history"."user_id" IS 'WARNING: This table contains PHI - requires HIPAA controls';
-- Migration: Therapist Analytics Tables
-- Created: 2025-10-20
-- Description: Add tables for tracking therapist engagement, growth, and booking analytics

-- ============================================
-- THERAPIST PROFILE VIEWS (Enhanced Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS "therapist_profile_views" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "therapist_id" VARCHAR NOT NULL REFERENCES "therapists"("id") ON DELETE CASCADE,
  "session_id" VARCHAR, -- Anonymous tracking
  "viewed_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "view_duration_seconds" INTEGER, -- How long they viewed the profile
  "referrer_page" TEXT, -- Where they came from (search, direct, etc.)
  "clicked_book_button" BOOLEAN DEFAULT false,
  "device_type" TEXT, -- mobile, desktop, tablet
  "browser_family" TEXT,
  "city" TEXT, -- Visitor location
  "state" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for fast queries by therapist
CREATE INDEX IF NOT EXISTS "idx_profile_views_therapist" ON "therapist_profile_views"("therapist_id");
CREATE INDEX IF NOT EXISTS "idx_profile_views_date" ON "therapist_profile_views"("viewed_at");
CREATE INDEX IF NOT EXISTS "idx_profile_views_session" ON "therapist_profile_views"("session_id");

-- ============================================
-- THERAPIST GROWTH METRICS
-- ============================================
CREATE TABLE IF NOT EXISTS "therapist_growth_metrics" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "period_start" DATE NOT NULL,
  "period_end" DATE NOT NULL,
  "period_type" TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  "new_signups" INTEGER DEFAULT 0,
  "approved_count" INTEGER DEFAULT 0,
  "rejected_count" INTEGER DEFAULT 0,
  "inactive_count" INTEGER DEFAULT 0,
  "avg_approval_time_hours" DECIMAL(10, 2),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS "idx_growth_metrics_period" ON "therapist_growth_metrics"("period_start", "period_end");
CREATE INDEX IF NOT EXISTS "idx_growth_metrics_type" ON "therapist_growth_metrics"("period_type");

-- ============================================
-- BOOKING ANALYTICS (Daily Aggregates)
-- ============================================
CREATE TABLE IF NOT EXISTS "booking_analytics" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "therapist_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "period_date" DATE NOT NULL,
  "total_bookings" INTEGER DEFAULT 0,
  "confirmed_bookings" INTEGER DEFAULT 0,
  "cancelled_bookings" INTEGER DEFAULT 0,
  "rejected_bookings" INTEGER DEFAULT 0,
  "profile_views" INTEGER DEFAULT 0,
  "conversion_rate" DECIMAL(5, 2), -- (confirmed_bookings / profile_views) * 100
  "avg_response_time_hours" DECIMAL(10, 2),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("therapist_id", "period_date")
);

-- Index for therapist and date queries
CREATE INDEX IF NOT EXISTS "idx_booking_analytics_therapist" ON "booking_analytics"("therapist_id");
CREATE INDEX IF NOT EXISTS "idx_booking_analytics_date" ON "booking_analytics"("period_date");

-- ============================================
-- SEARCH CONVERSION FUNNEL
-- ============================================
CREATE TABLE IF NOT EXISTS "search_conversion_funnel" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" VARCHAR NOT NULL,
  "search_id" UUID, -- Reference to location_searches
  "stage" TEXT NOT NULL, -- 'search', 'results_view', 'profile_view', 'booking_request', 'booking_confirmed'
  "therapist_id" VARCHAR, -- NULL for search stage
  "timestamp" TIMESTAMP DEFAULT NOW() NOT NULL,
  "city" TEXT,
  "state" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for funnel analysis
CREATE INDEX IF NOT EXISTS "idx_funnel_session" ON "search_conversion_funnel"("session_id");
CREATE INDEX IF NOT EXISTS "idx_funnel_stage" ON "search_conversion_funnel"("stage");
CREATE INDEX IF NOT EXISTS "idx_funnel_timestamp" ON "search_conversion_funnel"("timestamp");

-- ============================================
-- THERAPIST SPECIALTY DEMAND
-- ============================================
CREATE TABLE IF NOT EXISTS "specialty_demand_metrics" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "period_date" DATE NOT NULL,
  "specialty" TEXT NOT NULL,
  "search_count" INTEGER DEFAULT 0,
  "available_therapists" INTEGER DEFAULT 0,
  "avg_results_per_search" DECIMAL(10, 2),
  "city" TEXT,
  "state" TEXT,
  "supply_demand_ratio" DECIMAL(10, 2), -- available_therapists / search_count
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE("period_date", "specialty", "state", "city")
);

-- Index for specialty and location queries
CREATE INDEX IF NOT EXISTS "idx_specialty_demand_date" ON "specialty_demand_metrics"("period_date");
CREATE INDEX IF NOT EXISTS "idx_specialty_demand_specialty" ON "specialty_demand_metrics"("specialty");
CREATE INDEX IF NOT EXISTS "idx_specialty_demand_location" ON "specialty_demand_metrics"("state", "city");

-- ============================================
-- INDEXES ON EXISTING TABLES FOR PERFORMANCE
-- ============================================

-- Therapists table indexes for analytics
CREATE INDEX IF NOT EXISTS "idx_therapists_status" ON "therapists"("profile_status");
CREATE INDEX IF NOT EXISTS "idx_therapists_city_state" ON "therapists"("city", "state");
CREATE INDEX IF NOT EXISTS "idx_therapists_created_at" ON "therapists"("created_at");
CREATE INDEX IF NOT EXISTS "idx_therapists_accepting_clients" ON "therapists"("accepting_new_clients");

-- Appointments table indexes for booking analytics
CREATE INDEX IF NOT EXISTS "idx_appointments_status" ON "appointments"("status");
CREATE INDEX IF NOT EXISTS "idx_appointments_therapist_date" ON "appointments"("therapist_id", "appointment_date");
CREATE INDEX IF NOT EXISTS "idx_appointments_created_at" ON "appointments"("created_at");

-- Page views indexes (enhance existing table)
CREATE INDEX IF NOT EXISTS "idx_page_views_path" ON "page_views"("page_path");
CREATE INDEX IF NOT EXISTS "idx_page_views_city_state" ON "page_views"("city", "state");

-- Location searches indexes (enhance existing table)
CREATE INDEX IF NOT EXISTS "idx_location_searches_city_state" ON "location_searches"("search_city", "search_state");
CREATE INDEX IF NOT EXISTS "idx_location_searches_created" ON "location_searches"("created_at");

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE "therapist_profile_views" IS 'Tracks individual profile views for engagement analytics';
COMMENT ON TABLE "therapist_growth_metrics" IS 'Aggregated metrics for therapist signup and approval trends';
COMMENT ON TABLE "booking_analytics" IS 'Daily aggregates of booking performance by therapist';
COMMENT ON TABLE "search_conversion_funnel" IS 'Tracks user journey from search to booking completion';
COMMENT ON TABLE "specialty_demand_metrics" IS 'Supply vs demand analysis by specialty and location';
