CREATE TABLE "alert_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"range_enabled" boolean DEFAULT false NOT NULL,
	"low_mg_dl" integer,
	"high_mg_dl" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alert_settings_range_chk" CHECK (("alert_settings"."low_mg_dl" is null and "alert_settings"."high_mg_dl" is null) or ("alert_settings"."low_mg_dl" between 20 and 600 and "alert_settings"."high_mg_dl" between 20 and 600 and "alert_settings"."low_mg_dl" < "alert_settings"."high_mg_dl")),
	CONSTRAINT "alert_settings_enabled_chk" CHECK (not "alert_settings"."range_enabled" or ("alert_settings"."low_mg_dl" is not null and "alert_settings"."high_mg_dl" is not null))
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"time_local" text NOT NULL,
	"days_mask" integer DEFAULT 127 NOT NULL,
	"timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_sent_on" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reminders_time_chk" CHECK ("reminders"."time_local" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
	CONSTRAINT "reminders_days_chk" CHECK ("reminders"."days_mask" between 1 and 127)
);
--> statement-breakpoint
ALTER TABLE "alert_settings" ADD CONSTRAINT "alert_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reminders_user_idx" ON "reminders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reminders_enabled_idx" ON "reminders" USING btree ("enabled");