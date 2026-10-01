CREATE TABLE "guardian_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"minor_id" text NOT NULL,
	"guardian_email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"confirmed_at" timestamp with time zone,
	"confirmed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guardian_requests_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "admin_audit_logs" DROP CONSTRAINT "admin_audit_logs_action_chk";--> statement-breakpoint
ALTER TABLE "professional_profiles" DROP CONSTRAINT "professional_profiles_status_chk";--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "registry_council" text;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "registry_uf" text;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "verified_by" text;--> statement-breakpoint
ALTER TABLE "guardian_requests" ADD CONSTRAINT "guardian_requests_minor_id_users_id_fk" FOREIGN KEY ("minor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_requests" ADD CONSTRAINT "guardian_requests_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guardian_requests_minor_idx" ON "guardian_requests" USING btree ("minor_id");--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_action_chk" CHECK ("admin_audit_logs"."action" in ('suspend','unsuspend','delete','request_update','link_revoke','professional_verify','professional_reject'));--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_status_chk" CHECK ("professional_profiles"."verification_status" in ('unverified','pending','verified','rejected'));