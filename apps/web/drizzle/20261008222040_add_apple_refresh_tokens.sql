CREATE TABLE "apple_refresh_tokens" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"apple_subject" text NOT NULL,
	"client_id" text NOT NULL,
	"encrypted_refresh_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_deletions" ADD COLUMN "apple_revoked_at" timestamp with time zone;