CREATE TABLE "sharing_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"actor_id" text,
	"family_member_id" uuid,
	"action" text NOT NULL,
	"member_email_masked" text,
	"modules" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sharing_events_action_chk" CHECK ("sharing_events"."action" in ('invite','accept','permissions_change','invite_cancel','revoke','guardian_confirm','majority_review','admin_revoke'))
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_audit_logs" DROP CONSTRAINT "admin_audit_logs_action_chk";--> statement-breakpoint
ALTER TABLE "consent_logs" DROP CONSTRAINT "consent_logs_kind_chk";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "notification_details" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "majority_reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "role" text DEFAULT 'companion' NOT NULL;--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sharing_events" ADD CONSTRAINT "sharing_events_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharing_events" ADD CONSTRAINT "sharing_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharing_events" ADD CONSTRAINT "sharing_events_family_member_id_family_members_id_fk" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sharing_events_owner_idx" ON "sharing_events" USING btree ("owner_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_action_chk" CHECK ("admin_audit_logs"."action" in ('suspend','unsuspend','delete','request_update','link_revoke','professional_verify','professional_reject','role_grant','role_revoke','verify_email','end_sessions','setting_update'));--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_role_chk" CHECK ("family_members"."role" in ('companion','guardian'));--> statement-breakpoint
ALTER TABLE "consent_logs" ADD CONSTRAINT "consent_logs_kind_chk" CHECK ("consent_logs"."kind" in ('lgpd','guardian','majority_review'));--> statement-breakpoint
-- Responsáveis já confirmados passam a ser identificados no próprio vínculo (antes eram deduzidos de guardian_requests).
UPDATE "family_members" AS fm SET "role" = 'guardian' FROM "guardian_requests" AS gr WHERE gr."minor_id" = fm."owner_id" AND gr."confirmed_by" = fm."member_user_id" AND gr."confirmed_at" IS NOT NULL;--> statement-breakpoint
-- Limite inicial de acompanhantes por perfil (o administrador ajusta em Admin > Configurações).
INSERT INTO "app_settings" ("key", "value") VALUES ('max_companions', '2'::jsonb) ON CONFLICT ("key") DO NOTHING;
