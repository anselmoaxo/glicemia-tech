ALTER TABLE "profiles" ADD COLUMN "sex" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "diagnosis_year" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_sex_chk" CHECK ("profiles"."sex" is null or "profiles"."sex" in ('feminino','masculino','nao_informado'));--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_diagnosis_year_chk" CHECK ("profiles"."diagnosis_year" is null or "profiles"."diagnosis_year" between 1900 and 2200);