CREATE TABLE "glucose_contexts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "glucose_contexts_user_label_uq" UNIQUE("user_id","label")
);
--> statement-breakpoint
CREATE TABLE "glucose_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"value_mg_dl" integer NOT NULL,
	"measured_at" timestamp with time zone NOT NULL,
	"context_key" text NOT NULL,
	"custom_context_id" uuid,
	"notes" text,
	"symptoms" text,
	"activity" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "glucose_readings_value_chk" CHECK ("glucose_readings"."value_mg_dl" between 20 and 600),
	CONSTRAINT "glucose_readings_context_chk" CHECK ("glucose_readings"."context_key" in ('jejum','antes_refeicao','apos_1h','apos_2h','antes_dormir','aleatoria','personalizado'))
);
--> statement-breakpoint
CREATE TABLE "glucose_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"target_key" text NOT NULL,
	"min_mg_dl" integer NOT NULL,
	"max_mg_dl" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "glucose_targets_user_key_uq" UNIQUE("user_id","target_key"),
	CONSTRAINT "glucose_targets_range_chk" CHECK ("glucose_targets"."min_mg_dl" < "glucose_targets"."max_mg_dl"),
	CONSTRAINT "glucose_targets_key_chk" CHECK ("glucose_targets"."target_key" in ('geral','jejum','pos_refeicao'))
);
--> statement-breakpoint
ALTER TABLE "glucose_contexts" ADD CONSTRAINT "glucose_contexts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glucose_readings" ADD CONSTRAINT "glucose_readings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glucose_readings" ADD CONSTRAINT "glucose_readings_custom_context_id_glucose_contexts_id_fk" FOREIGN KEY ("custom_context_id") REFERENCES "public"."glucose_contexts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glucose_targets" ADD CONSTRAINT "glucose_targets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "glucose_readings_user_measured_idx" ON "glucose_readings" USING btree ("user_id","measured_at" DESC NULLS LAST);