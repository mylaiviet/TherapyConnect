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
ALTER TABLE "therapist_documents" ADD CONSTRAINT "therapist_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;