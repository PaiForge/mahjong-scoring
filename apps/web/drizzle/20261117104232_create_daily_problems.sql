CREATE TABLE "daily_problem_answers" (
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"is_correct" boolean NOT NULL,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_problem_answers_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_problems" (
	"day" date PRIMARY KEY NOT NULL,
	"problem_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_daily_problems_problem_id" UNIQUE("problem_id")
);
--> statement-breakpoint
ALTER TABLE "daily_problems" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD CONSTRAINT "daily_problem_answers_day_daily_problems_day_fk" FOREIGN KEY ("day") REFERENCES "public"."daily_problems"("day") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_problems" ADD CONSTRAINT "daily_problems_problem_id_practice_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."practice_problems"("id") ON DELETE restrict ON UPDATE no action;