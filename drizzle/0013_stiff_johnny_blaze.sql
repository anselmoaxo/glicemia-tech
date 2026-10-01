CREATE TABLE "access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"viewer_id" text,
	"resource" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "access_logs_resource_chk" CHECK ("access_logs"."resource" in ('acompanhamento','relatorio'))
);
--> statement-breakpoint
CREATE TABLE "consent_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consent_logs_kind_chk" CHECK ("consent_logs"."kind" in ('lgpd','guardian'))
);
--> statement-breakpoint
CREATE TABLE "professional_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"profession" text NOT NULL,
	"registry_number" text,
	"bio" text,
	"verification_status" text DEFAULT 'unverified' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "professional_profiles_status_chk" CHECK ("professional_profiles"."verification_status" in ('unverified'))
);
--> statement-breakpoint
CREATE TABLE "profile_photos" (
	"user_id" text PRIMARY KEY NOT NULL,
	"content_type" text NOT NULL,
	"data_base64" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_photos_type_chk" CHECK ("profile_photos"."content_type" in ('image/jpeg','image/png','image/webp'))
);
--> statement-breakpoint
CREATE TABLE "support_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "support_requests_kind_chk" CHECK ("support_requests"."kind" in ('suporte','privacidade','exclusao','exportacao')),
	CONSTRAINT "support_requests_status_chk" CHECK ("support_requests"."status" in ('open','in_progress','done'))
);
--> statement-breakpoint
ALTER TABLE "admin_audit_logs" DROP CONSTRAINT "admin_audit_logs_action_chk";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "tracking_purpose" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "guardian_consent_at" timestamp;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_viewer_id_users_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_logs" ADD CONSTRAINT "consent_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_logs_owner_idx" ON "access_logs" USING btree ("owner_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "consent_logs_user_idx" ON "consent_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_requests_status_idx" ON "support_requests" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "support_requests_user_idx" ON "support_requests" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_action_chk" CHECK ("admin_audit_logs"."action" in ('suspend','unsuspend','delete','request_update','link_revoke'));--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_tracking_purpose_chk" CHECK ("profiles"."tracking_purpose" is null or "profiles"."tracking_purpose" in ('pessoal','diabetes','outro'));