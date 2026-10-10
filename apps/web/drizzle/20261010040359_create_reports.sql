CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid,
	"target_user_id" uuid NOT NULL,
	"reason" varchar(30) NOT NULL,
	"detail" text,
	"snapshot" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_status_values" CHECK ("reports"."status" IN ('open', 'resolved', 'dismissed'))
);
--> statement-breakpoint
CREATE INDEX "idx_reports_status_created" ON "reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_reports_target" ON "reports" USING btree ("target_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_reports_open_per_reporter" ON "reports" USING btree ("reporter_id","target_user_id") WHERE "reports"."status" = 'open';