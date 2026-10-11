CREATE TABLE "apple_notification_events" (
	"notification_uuid" varchar(64) PRIMARY KEY NOT NULL,
	"notification_type" varchar(50) NOT NULL,
	"subtype" varchar(50),
	"apple_transaction_id" varchar(64),
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "stripe_checkout_session_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "stripe_payment_intent_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "provider" varchar(20) DEFAULT 'stripe' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "apple_transaction_id" varchar(64);--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "apple_original_transaction_id" varchar(64);--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "apple_product_id" varchar(255);--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "apple_environment" varchar(20);--> statement-breakpoint
CREATE INDEX "idx_apple_notification_events_transaction" ON "apple_notification_events" USING btree ("apple_transaction_id","received_at");--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_apple_transaction_id_unique" UNIQUE("apple_transaction_id");--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_chk_provider" CHECK ("purchases"."provider" IN ('stripe', 'apple'));--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_chk_provider_columns" CHECK (("purchases"."provider" = 'stripe' AND "purchases"."stripe_checkout_session_id" IS NOT NULL AND "purchases"."stripe_payment_intent_id" IS NOT NULL AND "purchases"."apple_transaction_id" IS NULL AND "purchases"."apple_original_transaction_id" IS NULL AND "purchases"."apple_product_id" IS NULL AND "purchases"."apple_environment" IS NULL) OR ("purchases"."provider" = 'apple' AND "purchases"."apple_transaction_id" IS NOT NULL AND "purchases"."apple_original_transaction_id" IS NOT NULL AND "purchases"."apple_product_id" IS NOT NULL AND "purchases"."apple_environment" IS NOT NULL AND "purchases"."stripe_checkout_session_id" IS NULL AND "purchases"."stripe_payment_intent_id" IS NULL));--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_chk_apple_environment" CHECK ("purchases"."apple_environment" IS NULL OR "purchases"."apple_environment" IN ('Sandbox', 'Production'));