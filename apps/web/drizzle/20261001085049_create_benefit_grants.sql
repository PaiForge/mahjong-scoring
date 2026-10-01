CREATE TABLE "benefit_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan" varchar(50) NOT NULL,
	"benefits" text[] NOT NULL,
	"reason" text NOT NULL,
	"granted_by" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revoke_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "benefit_grants_chk_benefits_not_empty" CHECK (cardinality("benefit_grants"."benefits") > 0),
	CONSTRAINT "benefit_grants_chk_reason_not_blank" CHECK (length(trim("benefit_grants"."reason")) > 0),
	CONSTRAINT "benefit_grants_chk_revoke_reason_pairs_with_revoked_at" CHECK (("benefit_grants"."revoked_at" IS NULL) = ("benefit_grants"."revoke_reason" IS NULL))
);
--> statement-breakpoint
CREATE INDEX "idx_benefit_grants_user_expires" ON "benefit_grants" USING btree ("user_id","expires_at");