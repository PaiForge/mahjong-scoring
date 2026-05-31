CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"locale" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"pinned_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_announcements_slug_locale" UNIQUE("slug","locale")
);
--> statement-breakpoint
CREATE INDEX "idx_announcements_status_published" ON "announcements" USING btree ("status","published_at");