CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan" varchar(50) NOT NULL,
	"kind" varchar(20) NOT NULL,
	"benefits" text[] NOT NULL,
	"stripe_checkout_session_id" varchar(255) NOT NULL,
	"stripe_payment_intent_id" varchar(255) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"amount" integer NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revoke_reason" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchases_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id"),
	CONSTRAINT "purchases_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id"),
	CONSTRAINT "purchases_chk_kind" CHECK ("purchases"."kind" IN ('pass', 'lifetime')),
	CONSTRAINT "purchases_chk_lifetime_has_no_expiry" CHECK (("purchases"."kind" = 'lifetime') = ("purchases"."expires_at" IS NULL)),
	CONSTRAINT "purchases_chk_revoke_reason_pairs_with_revoked_at" CHECK (("purchases"."revoked_at" IS NULL) = ("purchases"."revoke_reason" IS NULL)),
	CONSTRAINT "purchases_chk_benefits_not_empty" CHECK (cardinality("purchases"."benefits") > 0),
	CONSTRAINT "purchases_chk_amount_non_negative" CHECK ("purchases"."amount" >= 0),
	CONSTRAINT "purchases_chk_currency" CHECK ("purchases"."currency" ~ '^[a-z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "stripe_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_customer_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_customers_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "stripe_customers_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "stripe_webhook_events" (
	"event_id" varchar(255) PRIMARY KEY NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_purchases_user_expires" ON "purchases" USING btree ("user_id","expires_at");