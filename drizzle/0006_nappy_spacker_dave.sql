CREATE TABLE "shared_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"from_date" date NOT NULL,
	"to_date" date NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shared_reports_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "shared_reports_range_chk" CHECK ("shared_reports"."from_date" <= "shared_reports"."to_date")
);
--> statement-breakpoint
ALTER TABLE "shared_reports" ADD CONSTRAINT "shared_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shared_reports_user_idx" ON "shared_reports" USING btree ("user_id","created_at" DESC NULLS LAST);