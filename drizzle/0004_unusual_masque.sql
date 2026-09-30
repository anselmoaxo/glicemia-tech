CREATE TABLE "insulin_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"insulin_type_id" uuid NOT NULL,
	"units" numeric(4, 1) NOT NULL,
	"applied_at" timestamp with time zone NOT NULL,
	"meal_relation" text NOT NULL,
	"site" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "insulin_logs_units_chk" CHECK ("insulin_logs"."units" > 0 and "insulin_logs"."units" <= 300),
	CONSTRAINT "insulin_logs_relation_chk" CHECK ("insulin_logs"."meal_relation" in ('antes_refeicao','com_refeicao','apos_refeicao','sem_relacao')),
	CONSTRAINT "insulin_logs_site_chk" CHECK ("insulin_logs"."site" is null or "insulin_logs"."site" in ('abdomen','coxa','braco','gluteo','outro'))
);
--> statement-breakpoint
CREATE TABLE "insulin_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "insulin_types_user_name_uq" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "insulin_logs" ADD CONSTRAINT "insulin_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insulin_logs" ADD CONSTRAINT "insulin_logs_insulin_type_id_insulin_types_id_fk" FOREIGN KEY ("insulin_type_id") REFERENCES "public"."insulin_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insulin_types" ADD CONSTRAINT "insulin_types_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "insulin_logs_user_applied_idx" ON "insulin_logs" USING btree ("user_id","applied_at" DESC NULLS LAST);