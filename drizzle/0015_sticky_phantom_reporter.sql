CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"category" text NOT NULL,
	"reason" text NOT NULL,
	"recipient_masked" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider_id" text,
	"error" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"provider_updated_at" timestamp with time zone,
	CONSTRAINT "email_logs_status_chk" CHECK ("email_logs"."status" in ('pending','sent','delivered','delayed','rejected','failed','unknown'))
);
--> statement-breakpoint
CREATE TABLE "plan_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"slot_key" text NOT NULL,
	"slot_at" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plan_events_slot_uq" UNIQUE("user_id","slot_key"),
	CONSTRAINT "plan_events_kind_chk" CHECK ("plan_events"."kind" in ('missed_measurement','med_unconfirmed')),
	CONSTRAINT "plan_events_status_chk" CHECK ("plan_events"."status" in ('reminder_sent','unconfirmed'))
);
--> statement-breakpoint
CREATE TABLE "tracking_plans" (
	"user_id" text PRIMARY KEY NOT NULL,
	"specific_enabled" boolean DEFAULT false NOT NULL,
	"measure_days_mask" integer,
	"measure_times" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expected_per_day" integer,
	"tolerance_min" integer,
	"track_medication" boolean DEFAULT false NOT NULL,
	"channel_app" boolean DEFAULT false NOT NULL,
	"email_missed_measure" boolean DEFAULT false NOT NULL,
	"email_med_unconfirmed" boolean DEFAULT false NOT NULL,
	"notify_family" boolean DEFAULT false NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracking_plans_expected_chk" CHECK ("tracking_plans"."expected_per_day" is null or "tracking_plans"."expected_per_day" between 1 and 24),
	CONSTRAINT "tracking_plans_tolerance_chk" CHECK ("tracking_plans"."tolerance_min" is null or "tracking_plans"."tolerance_min" between 5 and 720),
	CONSTRAINT "tracking_plans_days_chk" CHECK ("tracking_plans"."measure_days_mask" is null or "tracking_plans"."measure_days_mask" between 1 and 127)
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"http_status" integer,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	CONSTRAINT "webhook_deliveries_event_uq" UNIQUE("user_id","event_id"),
	CONSTRAINT "webhook_deliveries_status_chk" CHECK ("webhook_deliveries"."status" in ('pending','delivered','failed')),
	CONSTRAINT "webhook_deliveries_type_chk" CHECK ("webhook_deliveries"."type" in ('test','measurement_out_of_range','measurement_missed','medication_unconfirmed'))
);
--> statement-breakpoint
CREATE TABLE "webhook_integrations" (
	"user_id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"url_enc" text,
	"url_host" text,
	"secret_enc" text,
	"ev_out_of_range" boolean DEFAULT false NOT NULL,
	"ev_missed_measure" boolean DEFAULT false NOT NULL,
	"ev_med_unconfirmed" boolean DEFAULT false NOT NULL,
	"scope" text DEFAULT 'diabetes_only' NOT NULL,
	"consent_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_integrations_scope_chk" CHECK ("webhook_integrations"."scope" in ('diabetes_only','profile'))
);
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_tracking_purpose_chk";--> statement-breakpoint
ALTER TABLE "access_logs" DROP CONSTRAINT "access_logs_resource_chk";--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_events" ADD CONSTRAINT "plan_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_plans" ADD CONSTRAINT "tracking_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_plans" ADD CONSTRAINT "tracking_plans_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_integrations" ADD CONSTRAINT "webhook_integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_logs_user_idx" ON "email_logs" USING btree ("user_id","requested_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "email_logs_provider_idx" ON "email_logs" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "email_logs_requested_idx" ON "email_logs" USING btree ("requested_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "plan_events_user_idx" ON "plan_events" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "webhook_deliveries_user_idx" ON "webhook_deliveries" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "webhook_deliveries_due_idx" ON "webhook_deliveries" USING btree ("status","next_attempt_at");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_tracking_purpose_chk" CHECK ("profiles"."tracking_purpose" is null or "profiles"."tracking_purpose" in ('pessoal','diabetes','outro','sem_diabetes'));--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_resource_chk" CHECK ("access_logs"."resource" in ('acompanhamento','relatorio','configuracao'));