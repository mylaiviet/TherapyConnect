-- Migration: Analytics Tables for Geolocation Tracking
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
