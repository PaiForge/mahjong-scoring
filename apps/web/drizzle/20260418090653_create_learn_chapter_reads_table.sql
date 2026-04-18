CREATE TABLE "learn_chapter_reads" (
	"user_id" uuid NOT NULL,
	"chapter_slug" varchar(64) NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learn_chapter_reads_user_id_chapter_slug_pk" PRIMARY KEY("user_id","chapter_slug")
);
--> statement-breakpoint
CREATE INDEX "idx_lcr_user" ON "learn_chapter_reads" USING btree ("user_id");