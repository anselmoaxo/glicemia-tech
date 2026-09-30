CREATE TABLE "meal_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"meal_type" text NOT NULL,
	"custom_type" text,
	"eaten_at" timestamp with time zone NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meals_type_chk" CHECK ("meals"."meal_type" in ('cafe_manha','almoco','jantar','lanche','personalizado')),
	CONSTRAINT "meals_custom_type_chk" CHECK (("meals"."meal_type" = 'personalizado') = ("meals"."custom_type" is not null))
);
--> statement-breakpoint
ALTER TABLE "meal_photos" ADD CONSTRAINT "meal_photos_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_photos" ADD CONSTRAINT "meal_photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meal_photos_meal_idx" ON "meal_photos" USING btree ("meal_id");--> statement-breakpoint
CREATE INDEX "meals_user_eaten_idx" ON "meals" USING btree ("user_id","eaten_at" DESC NULLS LAST);