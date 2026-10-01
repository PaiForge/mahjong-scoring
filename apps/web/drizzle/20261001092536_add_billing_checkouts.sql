CREATE TABLE "billing_checkouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"plan" varchar(50) NOT NULL,
	"offer" varchar(20) NOT NULL,
	"kind" varchar(20) NOT NULL,
	"benefits" text[] NOT NULL,
	"duration_days" integer,
	"stripe_price_id" varchar(255) NOT NULL,
	"origin" text NOT NULL,
	"stripe_checkout_session_id" varchar(255),
	"expires_at" timestamp with time zone NOT NULL,
	"settled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_checkouts_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id"),
	CONSTRAINT "billing_checkouts_chk_kind" CHECK ("billing_checkouts"."kind" IN ('pass', 'lifetime')),
	CONSTRAINT "billing_checkouts_chk_duration" CHECK (("billing_checkouts"."kind" = 'pass' AND "billing_checkouts"."duration_days" IS NOT NULL AND "billing_checkouts"."duration_days" > 0) OR ("billing_checkouts"."kind" = 'lifetime' AND "billing_checkouts"."duration_days" IS NULL)),
	CONSTRAINT "billing_checkouts_chk_benefits" CHECK (cardinality("billing_checkouts"."benefits") > 0)
);
--> statement-breakpoint
ALTER TABLE "billing_checkouts" ADD CONSTRAINT "billing_checkouts_customer_id_stripe_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."stripe_customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_checkouts_one_pending_customer" ON "billing_checkouts" USING btree ("customer_id") WHERE "billing_checkouts"."settled_at" IS NULL;