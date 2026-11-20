CREATE TABLE "problem_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"reporter_id" uuid,
	"reason" varchar(30) NOT NULL,
	"detail" text,
	"context" text NOT NULL,
	"stage" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"source" text NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"resolution_note" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "problem_reports_chk_reason" CHECK ("problem_reports"."reason" IN ('wrong_score', 'wrong_yaku', 'wrong_fu', 'wrong_machi', 'invalid_board', 'other')),
	CONSTRAINT "problem_reports_chk_context" CHECK ("problem_reports"."context" IN ('agari-score', 'tenpai-score', 'daily-problem')),
	CONSTRAINT "problem_reports_chk_source" CHECK ("problem_reports"."source" IN ('web', 'ios', 'android')),
	CONSTRAINT "problem_reports_chk_status" CHECK ("problem_reports"."status" IN ('open', 'resolved', 'dismissed'))
);
--> statement-breakpoint
ALTER TABLE "problem_reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "problem_reports" ADD CONSTRAINT "problem_reports_problem_id_practice_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."practice_problems"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_problem_reports_status_created" ON "problem_reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_problem_reports_problem" ON "problem_reports" USING btree ("problem_id");--> statement-breakpoint
CREATE INDEX "idx_problem_reports_reporter_created" ON "problem_reports" USING btree ("reporter_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_problem_reports_open_per_reporter" ON "problem_reports" USING btree ("reporter_id","problem_id") WHERE "problem_reports"."status" = 'open';