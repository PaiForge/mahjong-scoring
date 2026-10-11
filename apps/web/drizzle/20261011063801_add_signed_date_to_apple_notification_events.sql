DROP INDEX "idx_apple_notification_events_transaction";--> statement-breakpoint
ALTER TABLE "apple_notification_events" ADD COLUMN "signed_date" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_apple_notification_events_transaction" ON "apple_notification_events" USING btree ("apple_transaction_id","signed_date");