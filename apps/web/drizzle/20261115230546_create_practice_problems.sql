CREATE TABLE "practice_problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"schema_version" integer NOT NULL,
	"identity_version" integer NOT NULL,
	"content_hash" text NOT NULL,
	"payload" jsonb NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_practice_problems_identity" UNIQUE("kind","identity_version","content_hash"),
	CONSTRAINT "practice_problems_chk_kind" CHECK ("practice_problems"."kind" IN ('agari-score', 'tenpai-score')),
	CONSTRAINT "practice_problems_chk_source" CHECK ("practice_problems"."source" IN ('web', 'ios', 'android')),
	CONSTRAINT "practice_problems_chk_content_hash" CHECK ("practice_problems"."content_hash" ~ '^[0-9a-f]{64}$')
);
