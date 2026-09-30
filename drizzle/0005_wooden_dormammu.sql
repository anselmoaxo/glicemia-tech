CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"reading_id" uuid NOT NULL,
	"direction" text NOT NULL,
	"value_mg_dl" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alerts_reading_id_unique" UNIQUE("reading_id"),
	CONSTRAINT "alerts_direction_chk" CHECK ("alerts"."direction" in ('low','high'))
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"alert_id" uuid,
	"recipient_type" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_recipient_chk" CHECK ("notifications"."recipient_type" in ('self','family')),
	CONSTRAINT "notifications_status_chk" CHECK ("notifications"."status" in ('sent','failed'))
);
--> statement-breakpoint
CREATE TABLE "family_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"email" text NOT NULL,
	"member_user_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"token_hash" text NOT NULL,
	"invite_expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	CONSTRAINT "family_members_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "family_members_owner_email_uq" UNIQUE("owner_id","email"),
	CONSTRAINT "family_members_status_chk" CHECK ("family_members"."status" in ('pending','accepted','revoked'))
);
--> statement-breakpoint
CREATE TABLE "sharing_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_member_id" uuid NOT NULL,
	"module" text NOT NULL,
	CONSTRAINT "sharing_permissions_member_module_uq" UNIQUE("family_member_id","module"),
	CONSTRAINT "sharing_permissions_module_chk" CHECK ("sharing_permissions"."module" in ('glucose','meals','medications','insulin','reports'))
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "alert_email_self" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "alert_email_family" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_reading_id_glucose_readings_id_fk" FOREIGN KEY ("reading_id") REFERENCES "public"."glucose_readings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_member_user_id_users_id_fk" FOREIGN KEY ("member_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharing_permissions" ADD CONSTRAINT "sharing_permissions_family_member_id_family_members_id_fk" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alerts_user_created_idx" ON "alerts" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "family_members_owner_idx" ON "family_members" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "family_members_member_idx" ON "family_members" USING btree ("member_user_id");