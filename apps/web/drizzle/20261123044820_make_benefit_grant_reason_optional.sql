ALTER TABLE "benefit_grants" DROP CONSTRAINT "benefit_grants_chk_reason_not_blank";--> statement-breakpoint
ALTER TABLE "benefit_grants" ALTER COLUMN "reason" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "benefit_grants" ADD CONSTRAINT "benefit_grants_chk_reason_null_or_not_blank" CHECK ("benefit_grants"."reason" IS NULL OR length(trim("benefit_grants"."reason")) > 0);