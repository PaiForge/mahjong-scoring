CREATE TABLE "app_usage" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"platform" varchar(20) NOT NULL,
	"app_version" varchar(32),
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_usage_chk_platform" CHECK ("app_usage"."platform" IN ('ios', 'android'))
);
--> statement-breakpoint
ALTER TABLE "app_usage" ENABLE ROW LEVEL SECURITY;