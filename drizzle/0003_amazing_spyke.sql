CREATE TABLE "medication_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"medication_id" uuid NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "medication_logs_dose_uq" UNIQUE("medication_id","scheduled_for"),
	CONSTRAINT "medication_logs_status_chk" CHECK ("medication_logs"."status" in ('taken','skipped'))
);
--> statement-breakpoint
CREATE TABLE "medication_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medication_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"time" time NOT NULL,
	"days_of_week" integer[] NOT NULL,
	CONSTRAINT "medication_schedules_days_chk" CHECK (cardinality("medication_schedules"."days_of_week") between 1 and 7)
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"dose" text NOT NULL,
	"unit" text NOT NULL,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_schedules" ADD CONSTRAINT "medication_schedules_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_schedules" ADD CONSTRAINT "medication_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "medication_logs_user_scheduled_idx" ON "medication_logs" USING btree ("user_id","scheduled_for" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "medication_schedules_user_idx" ON "medication_schedules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "medication_schedules_med_idx" ON "medication_schedules" USING btree ("medication_id");--> statement-breakpoint
CREATE INDEX "medications_user_active_idx" ON "medications" USING btree ("user_id","active");