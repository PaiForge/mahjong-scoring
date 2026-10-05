CREATE TABLE "challenge_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"state" jsonb NOT NULL,
	"consumed" boolean DEFAULT false NOT NULL
);

--> statement-breakpoint
ALTER TABLE "challenge_attempts" ENABLE ROW LEVEL SECURITY;
