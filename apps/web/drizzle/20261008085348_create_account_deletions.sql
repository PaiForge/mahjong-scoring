CREATE TABLE "account_deletions" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"data_deleted_at" timestamp with time zone,
	"storage_deleted_at" timestamp with time zone,
	"auth_deleted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"last_error" text
);
--> statement-breakpoint
CREATE INDEX "idx_account_deletions_pending" ON "account_deletions" USING btree ("requested_at") WHERE "account_deletions"."completed_at" IS NULL;