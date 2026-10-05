CREATE TABLE "lesson_completions" (
	"user_id" uuid NOT NULL,
	"lesson_slug" varchar(64) NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_completions_user_id_lesson_slug_pk" PRIMARY KEY("user_id","lesson_slug"),
	CONSTRAINT "lesson_completions_lesson_slug_format" CHECK ("lesson_completions"."lesson_slug" ~ '^[a-z][a-z0-9-]{0,63}$')
);
--> statement-breakpoint
CREATE INDEX "idx_lesson_completions_user" ON "lesson_completions" USING btree ("user_id");