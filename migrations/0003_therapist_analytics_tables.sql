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
