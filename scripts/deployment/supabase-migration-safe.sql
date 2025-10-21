-- ============================================================================
-- SUPABASE DATABASE MIGRATION FOR KAREMATCH/THERAPYCONNECT
-- ============================================================================
-- SAFE VERSION: Uses IF NOT EXISTS and DO blocks for enum types
-- Created: 2025-10-20
-- ============================================================================

-- ============================================
-- ENUM TYPES (with safe creation)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_mode') THEN
        CREATE TYPE booking_mode AS ENUM('instant', 'request');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_stage') THEN
        CREATE TYPE conversation_stage AS ENUM('welcome', 'demographics', 'preferences', 'goals', 'insurance', 'matching');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escalation_type') THEN
        CREATE TYPE escalation_type AS ENUM('crisis', 'abuse_report', 'human_request', 'general');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_sender') THEN
        CREATE TYPE message_sender AS ENUM('bot', 'user', 'system');
    END IF;
END $$;

-- ============================================
-- TABLES (Migration 0001)
-- ============================================

CREATE TABLE IF NOT EXISTS appointments (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	therapist_id varchar NOT NULL,
	patient_name text NOT NULL,
	patient_email text NOT NULL,
	patient_phone text,
	appointment_date text NOT NULL,
	start_time text NOT NULL,
	end_time text NOT NULL,
	status appointment_status DEFAULT 'pending' NOT NULL,
	notes text,
	booking_type booking_mode NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS blocked_time_slots (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	therapist_id varchar NOT NULL,
	start_date text NOT NULL,
	end_date text NOT NULL,
	start_time text,
	end_time text,
	reason text,
	created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_conversations (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	session_id text,
	user_id varchar,
	stage conversation_stage DEFAULT 'welcome' NOT NULL,
	is_active boolean DEFAULT true,
	crisis_detected boolean DEFAULT false,
	escalation_requested boolean DEFAULT false,
	completed_at timestamp,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	expires_at timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_escalations (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	conversation_id varchar NOT NULL,
	escalation_type escalation_type NOT NULL,
	trigger_message text,
	crisis_keywords text[],
	action_taken text,
	staff_notified boolean DEFAULT false,
	staff_notified_at timestamp,
	resolved boolean DEFAULT false,
	resolved_at timestamp,
	notes text,
	created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	conversation_id varchar NOT NULL,
	sender message_sender NOT NULL,
	content text NOT NULL,
	has_button_options boolean DEFAULT false,
	selected_option text,
	is_disclaimer boolean DEFAULT false,
	is_crisis_alert boolean DEFAULT false,
	created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_preferences (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	conversation_id varchar NOT NULL,
	age_range text,
	pronouns text,
	language text,
	location_zip text,
	session_format text,
	availability text[] DEFAULT ARRAY[]::text[],
	therapist_gender_preference text,
	therapist_age_preference text,
	cultural_background_match boolean DEFAULT false,
	therapy_approach text[] DEFAULT ARRAY[]::text[],
	has_previous_therapy_experience boolean,
	previous_therapy_feedback text,
	treatment_goals text,
	treatment_duration text,
	payment_method text,
	insurance_provider text,
	budget_range text,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT chat_preferences_conversation_id_unique UNIQUE(conversation_id)
);

CREATE TABLE IF NOT EXISTS chat_therapist_matches (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	conversation_id varchar NOT NULL,
	therapist_id varchar NOT NULL,
	match_score integer,
	display_order integer,
	clicked boolean DEFAULT false,
	clicked_at timestamp,
	booked boolean DEFAULT false,
	booked_at timestamp,
	created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_tokens (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	conversation_id varchar NOT NULL,
	token_key text NOT NULL,
	encrypted_value text NOT NULL,
	field_type text NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT chat_tokens_token_key_unique UNIQUE(token_key)
);

CREATE TABLE IF NOT EXISTS session (
	sid varchar PRIMARY KEY NOT NULL,
	sess text NOT NULL,
	expire timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS therapist_availability (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	therapist_id varchar NOT NULL,
	day_of_week integer NOT NULL,
	start_time text NOT NULL,
	end_time text NOT NULL,
	slot_duration integer DEFAULT 60,
	is_active boolean DEFAULT true,
	created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS therapist_booking_settings (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	therapist_id varchar NOT NULL,
	booking_mode booking_mode DEFAULT 'instant' NOT NULL,
	buffer_time integer DEFAULT 0,
	advance_booking_days integer DEFAULT 30,
	min_notice_hours integer DEFAULT 24,
	allow_cancellation boolean DEFAULT true,
	cancellation_hours integer DEFAULT 24,
	google_calendar_connected boolean DEFAULT false,
	google_calendar_id text,
	outlook_calendar_connected boolean DEFAULT false,
	outlook_calendar_id text,
	email_notifications boolean DEFAULT true,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT therapist_booking_settings_therapist_id_unique UNIQUE(therapist_id)
);

CREATE TABLE IF NOT EXISTS therapist_documents (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	therapist_id varchar NOT NULL,
	document_type text NOT NULL,
	file_name text NOT NULL,
	file_url text NOT NULL,
	file_size integer NOT NULL,
	mime_type text NOT NULL,
	is_verified boolean DEFAULT false,
	verified_by varchar,
	verified_at timestamp,
	expiration_date text,
	metadata text,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS zip_codes (
	zip varchar(5) PRIMARY KEY NOT NULL,
	city text NOT NULL,
	state varchar(2) NOT NULL,
	latitude numeric(10, 8),
	longitude numeric(11, 8),
	county text,
	timezone text
);

-- ============================================
-- ALTER THERAPISTS TABLE (Add new columns)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='gender') THEN
        ALTER TABLE therapists ADD COLUMN gender text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='date_of_birth') THEN
        ALTER TABLE therapists ADD COLUMN date_of_birth text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='race_ethnicity') THEN
        ALTER TABLE therapists ADD COLUMN race_ethnicity text[] DEFAULT ARRAY[]::text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='religious_orientation') THEN
        ALTER TABLE therapists ADD COLUMN religious_orientation text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='certifications') THEN
        ALTER TABLE therapists ADD COLUMN certifications text[] DEFAULT ARRAY[]::text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='primary_theoretical_orientation') THEN
        ALTER TABLE therapists ADD COLUMN primary_theoretical_orientation text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='years_since_graduation') THEN
        ALTER TABLE therapists ADD COLUMN years_since_graduation integer;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='session_length_options') THEN
        ALTER TABLE therapists ADD COLUMN session_length_options text[] DEFAULT ARRAY[]::text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='current_waitlist_weeks') THEN
        ALTER TABLE therapists ADD COLUMN current_waitlist_weeks integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='wheelchair_accessible') THEN
        ALTER TABLE therapists ADD COLUMN wheelchair_accessible boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='asl_capable') THEN
        ALTER TABLE therapists ADD COLUMN asl_capable boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='service_animal_friendly') THEN
        ALTER TABLE therapists ADD COLUMN service_animal_friendly boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='virtual_platforms') THEN
        ALTER TABLE therapists ADD COLUMN virtual_platforms text[] DEFAULT ARRAY[]::text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='interstate_licenses') THEN
        ALTER TABLE therapists ADD COLUMN interstate_licenses text[] DEFAULT ARRAY[]::text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='average_response_time') THEN
        ALTER TABLE therapists ADD COLUMN average_response_time text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='consultation_offered') THEN
        ALTER TABLE therapists ADD COLUMN consultation_offered boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='consultation_fee') THEN
        ALTER TABLE therapists ADD COLUMN consultation_fee integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='crisis_availability') THEN
        ALTER TABLE therapists ADD COLUMN crisis_availability boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='superbill_provided') THEN
        ALTER TABLE therapists ADD COLUMN superbill_provided boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='fsa_hsa_accepted') THEN
        ALTER TABLE therapists ADD COLUMN fsa_hsa_accepted boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='payment_plan_available') THEN
        ALTER TABLE therapists ADD COLUMN payment_plan_available boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='preferred_client_ages') THEN
        ALTER TABLE therapists ADD COLUMN preferred_client_ages text[] DEFAULT ARRAY[]::text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='conditions_not_treated') THEN
        ALTER TABLE therapists ADD COLUMN conditions_not_treated text[] DEFAULT ARRAY[]::text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='severity_levels_accepted') THEN
        ALTER TABLE therapists ADD COLUMN severity_levels_accepted text[] DEFAULT ARRAY[]::text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='supervises_interns') THEN
        ALTER TABLE therapists ADD COLUMN supervises_interns boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='client_retention_rate') THEN
        ALTER TABLE therapists ADD COLUMN client_retention_rate numeric(5, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='profile_photos') THEN
        ALTER TABLE therapists ADD COLUMN profile_photos text[] DEFAULT ARRAY[]::text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='therapists' AND column_name='office_photos') THEN
        ALTER TABLE therapists ADD COLUMN office_photos text[] DEFAULT ARRAY[]::text[];
    END IF;
END $$;

-- ============================================
-- FOREIGN KEY CONSTRAINTS (safe to re-run)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_therapist_id_users_id_fk') THEN
        ALTER TABLE appointments ADD CONSTRAINT appointments_therapist_id_users_id_fk
        FOREIGN KEY (therapist_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blocked_time_slots_therapist_id_users_id_fk') THEN
        ALTER TABLE blocked_time_slots ADD CONSTRAINT blocked_time_slots_therapist_id_users_id_fk
        FOREIGN KEY (therapist_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_conversations_user_id_users_id_fk') THEN
        ALTER TABLE chat_conversations ADD CONSTRAINT chat_conversations_user_id_users_id_fk
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_escalations_conversation_id_chat_conversations_id_fk') THEN
        ALTER TABLE chat_escalations ADD CONSTRAINT chat_escalations_conversation_id_chat_conversations_id_fk
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_conversation_id_chat_conversations_id_fk') THEN
        ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_conversation_id_chat_conversations_id_fk
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_preferences_conversation_id_chat_conversations_id_fk') THEN
        ALTER TABLE chat_preferences ADD CONSTRAINT chat_preferences_conversation_id_chat_conversations_id_fk
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_therapist_matches_conversation_id_chat_conversations_id_fk') THEN
        ALTER TABLE chat_therapist_matches ADD CONSTRAINT chat_therapist_matches_conversation_id_chat_conversations_id_fk
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_therapist_matches_therapist_id_therapists_id_fk') THEN
        ALTER TABLE chat_therapist_matches ADD CONSTRAINT chat_therapist_matches_therapist_id_therapists_id_fk
        FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_tokens_conversation_id_chat_conversations_id_fk') THEN
        ALTER TABLE chat_tokens ADD CONSTRAINT chat_tokens_conversation_id_chat_conversations_id_fk
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'therapist_availability_therapist_id_users_id_fk') THEN
        ALTER TABLE therapist_availability ADD CONSTRAINT therapist_availability_therapist_id_users_id_fk
        FOREIGN KEY (therapist_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'therapist_booking_settings_therapist_id_users_id_fk') THEN
        ALTER TABLE therapist_booking_settings ADD CONSTRAINT therapist_booking_settings_therapist_id_users_id_fk
        FOREIGN KEY (therapist_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'therapist_documents_therapist_id_therapists_id_fk') THEN
        ALTER TABLE therapist_documents ADD CONSTRAINT therapist_documents_therapist_id_therapists_id_fk
        FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'therapist_documents_verified_by_users_id_fk') THEN
        ALTER TABLE therapist_documents ADD CONSTRAINT therapist_documents_verified_by_users_id_fk
        FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE NO ACTION;
    END IF;
END $$;

-- ============================================
-- ANALYTICS TABLES (Migration 0002)
-- ============================================

CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  location_method TEXT CHECK (location_method IN ('ip', 'gps', 'manual', 'unknown')),
  page_path TEXT,
  referrer_domain TEXT,
  session_id UUID,
  is_new_session BOOLEAN DEFAULT true,
  device_type TEXT,
  browser_family TEXT
);

CREATE TABLE IF NOT EXISTS location_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  search_city TEXT,
  search_state TEXT,
  search_zip TEXT,
  radius_miles INTEGER CHECK (radius_miles IN (10, 25, 50, 100, 150, 200)),
  location_method TEXT NOT NULL CHECK (location_method IN ('ip', 'gps', 'manual')),
  results_found INTEGER,
  results_clicked INTEGER DEFAULT 0,
  had_specialty_filter BOOLEAN DEFAULT false,
  had_insurance_filter BOOLEAN DEFAULT false,
  had_modality_filter BOOLEAN DEFAULT false,
  had_gender_filter BOOLEAN DEFAULT false,
  session_id UUID
);

CREATE TABLE IF NOT EXISTS geographic_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  aggregation_type TEXT NOT NULL CHECK (aggregation_type IN ('daily', 'weekly', 'monthly')),
  city TEXT,
  state TEXT NOT NULL,
  country TEXT DEFAULT 'USA',
  total_visitors INTEGER DEFAULT 0,
  total_searches INTEGER DEFAULT 0,
  total_results_found INTEGER DEFAULT 0,
  avg_search_radius INTEGER,
  ip_location_count INTEGER DEFAULT 0,
  gps_location_count INTEGER DEFAULT 0,
  manual_location_count INTEGER DEFAULT 0,
  UNIQUE(period_start, period_end, aggregation_type, state, city)
);

CREATE TABLE IF NOT EXISTS user_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'USA',
  location_method TEXT CHECK (location_method IN ('ip', 'gps', 'manual')),
  action_type TEXT CHECK (action_type IN ('search', 'profile_view', 'booking', 'account_creation'))
);

-- ============================================
-- THERAPIST ANALYTICS TABLES (Migration 0003)
-- ============================================

CREATE TABLE IF NOT EXISTS therapist_profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id VARCHAR NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  session_id VARCHAR,
  viewed_at TIMESTAMP DEFAULT NOW() NOT NULL,
  view_duration_seconds INTEGER,
  referrer_page TEXT,
  clicked_book_button BOOLEAN DEFAULT false,
  device_type TEXT,
  browser_family TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS therapist_growth_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL,
  new_signups INTEGER DEFAULT 0,
  approved_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  inactive_count INTEGER DEFAULT 0,
  avg_approval_time_hours DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS booking_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  total_bookings INTEGER DEFAULT 0,
  confirmed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  rejected_bookings INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2),
  avg_response_time_hours DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(therapist_id, period_date)
);

CREATE TABLE IF NOT EXISTS search_conversion_funnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL,
  search_id UUID,
  stage TEXT NOT NULL,
  therapist_id VARCHAR,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  city TEXT,
  state TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS specialty_demand_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_date DATE NOT NULL,
  specialty TEXT NOT NULL,
  search_count INTEGER DEFAULT 0,
  available_therapists INTEGER DEFAULT 0,
  avg_results_per_search DECIMAL(10, 2),
  city TEXT,
  state TEXT,
  supply_demand_ratio DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(period_date, specialty, state, city)
);

-- ============================================
-- INDEXES
-- ============================================

-- Page views indexes
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_city_state ON page_views(city, state);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);

-- Location searches indexes
CREATE INDEX IF NOT EXISTS idx_location_searches_created_at ON location_searches(created_at);
CREATE INDEX IF NOT EXISTS idx_location_searches_city_state ON location_searches(search_city, search_state);
CREATE INDEX IF NOT EXISTS idx_location_searches_method ON location_searches(location_method);
CREATE INDEX IF NOT EXISTS idx_location_searches_session ON location_searches(session_id);

-- Geographic aggregates indexes
CREATE INDEX IF NOT EXISTS idx_geo_agg_period ON geographic_aggregates(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_geo_agg_state_city ON geographic_aggregates(state, city);
CREATE INDEX IF NOT EXISTS idx_geo_agg_type ON geographic_aggregates(aggregation_type);

-- User location history indexes
CREATE INDEX IF NOT EXISTS idx_user_location_user_id ON user_location_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_location_created_at ON user_location_history(created_at);
CREATE INDEX IF NOT EXISTS idx_user_location_action ON user_location_history(action_type);

-- Therapist profile views indexes
CREATE INDEX IF NOT EXISTS idx_profile_views_therapist ON therapist_profile_views(therapist_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_date ON therapist_profile_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_profile_views_session ON therapist_profile_views(session_id);

-- Therapist growth metrics indexes
CREATE INDEX IF NOT EXISTS idx_growth_metrics_period ON therapist_growth_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_growth_metrics_type ON therapist_growth_metrics(period_type);

-- Booking analytics indexes
CREATE INDEX IF NOT EXISTS idx_booking_analytics_therapist ON booking_analytics(therapist_id);
CREATE INDEX IF NOT EXISTS idx_booking_analytics_date ON booking_analytics(period_date);

-- Search conversion funnel indexes
CREATE INDEX IF NOT EXISTS idx_funnel_session ON search_conversion_funnel(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_stage ON search_conversion_funnel(stage);
CREATE INDEX IF NOT EXISTS idx_funnel_timestamp ON search_conversion_funnel(timestamp);

-- Specialty demand metrics indexes
CREATE INDEX IF NOT EXISTS idx_specialty_demand_date ON specialty_demand_metrics(period_date);
CREATE INDEX IF NOT EXISTS idx_specialty_demand_specialty ON specialty_demand_metrics(specialty);
CREATE INDEX IF NOT EXISTS idx_specialty_demand_location ON specialty_demand_metrics(state, city);

-- Therapists table indexes
CREATE INDEX IF NOT EXISTS idx_therapists_status ON therapists(profile_status);
CREATE INDEX IF NOT EXISTS idx_therapists_city_state ON therapists(city, state);
CREATE INDEX IF NOT EXISTS idx_therapists_created_at ON therapists(created_at);
CREATE INDEX IF NOT EXISTS idx_therapists_accepting_clients ON therapists(accepting_new_clients);

-- Appointments table indexes
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist_date ON appointments(therapist_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);
