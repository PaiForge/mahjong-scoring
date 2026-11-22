ALTER TABLE "daily_problem_answers" ADD COLUMN "detail_version" smallint;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "outcome" text;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "require_yaku" boolean;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "require_han_fu" boolean;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "exact_han" boolean;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "require_fu_for_mangan" boolean;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "submitted" jsonb;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "score_result" text;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "han_result" text;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "fu_result" text;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "yaku_result" text;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "judged_correct" boolean;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "judge_error" text;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "snapshot_consistent" boolean;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "scoring_version" smallint;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "client" jsonb;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD COLUMN "revision" text;--> statement-breakpoint
ALTER TABLE "daily_problems" ADD COLUMN "answer_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "daily_problem_answers" ADD CONSTRAINT "daily_problem_answers_chk_detail" CHECK ((
      ("daily_problem_answers"."detail_version" IS NULL AND "daily_problem_answers"."outcome" IS NULL
        AND "daily_problem_answers"."require_yaku" IS NULL AND "daily_problem_answers"."require_han_fu" IS NULL
        AND "daily_problem_answers"."exact_han" IS NULL AND "daily_problem_answers"."require_fu_for_mangan" IS NULL
        AND "daily_problem_answers"."submitted" IS NULL AND "daily_problem_answers"."score_result" IS NULL
        AND "daily_problem_answers"."han_result" IS NULL AND "daily_problem_answers"."fu_result" IS NULL AND "daily_problem_answers"."yaku_result" IS NULL
        AND "daily_problem_answers"."judged_correct" IS NULL AND "daily_problem_answers"."judge_error" IS NULL
        AND "daily_problem_answers"."snapshot_consistent" IS NULL AND "daily_problem_answers"."scoring_version" IS NULL
        AND "daily_problem_answers"."source" IS NULL AND "daily_problem_answers"."client" IS NULL AND "daily_problem_answers"."revision" IS NULL)
      OR
      ("daily_problem_answers"."detail_version" = 1
        AND "daily_problem_answers"."require_yaku" IS NOT NULL AND "daily_problem_answers"."require_han_fu" IS NOT NULL
        AND "daily_problem_answers"."exact_han" IS NOT NULL AND "daily_problem_answers"."require_fu_for_mangan" IS NOT NULL
        AND "daily_problem_answers"."scoring_version" > 0
        AND "daily_problem_answers"."source" IN ('web', 'ios', 'android')
        AND jsonb_typeof("daily_problem_answers"."client") = 'object'
        AND (("daily_problem_answers"."outcome" = 'answered' AND jsonb_typeof("daily_problem_answers"."submitted") = 'object')
          OR ("daily_problem_answers"."outcome" = 'gaveUp' AND "daily_problem_answers"."submitted" IS NULL))
        AND (
          ("daily_problem_answers"."judge_error" IN ('ineligible', 'invalidPayload', 'invalidHand', 'agariHaiNotInHand', 'riichiWithFuro', 'noYaku', 'unsupportedYakuman', 'notTenpai', 'tooFewWaits', 'invalidWait', 'karaWait', 'noYakuTsumo', 'riichiWithNoYakuRon', 'fuOutOfOptions')
            AND "daily_problem_answers"."score_result" IS NULL AND "daily_problem_answers"."han_result" IS NULL
            AND "daily_problem_answers"."fu_result" IS NULL AND "daily_problem_answers"."yaku_result" IS NULL
            AND "daily_problem_answers"."judged_correct" IS NULL AND "daily_problem_answers"."snapshot_consistent" IS NULL)
          OR
          ("daily_problem_answers"."judge_error" IS NULL AND "daily_problem_answers"."outcome" = 'gaveUp'
            AND "daily_problem_answers"."score_result" IS NULL AND "daily_problem_answers"."han_result" IS NULL
            AND "daily_problem_answers"."fu_result" IS NULL AND "daily_problem_answers"."yaku_result" IS NULL
            AND "daily_problem_answers"."judged_correct" IS FALSE)
          OR
          ("daily_problem_answers"."judge_error" IS NULL AND "daily_problem_answers"."outcome" = 'answered'
            AND "daily_problem_answers"."score_result" IN ('correct', 'incorrect')
            AND "daily_problem_answers"."han_result" IN ('correct', 'incorrect', 'notJudged')
            AND "daily_problem_answers"."fu_result" IN ('correct', 'incorrect', 'notJudged')
            AND "daily_problem_answers"."yaku_result" IN ('correct', 'incorrect', 'notJudged')
            AND ("daily_problem_answers"."han_result" = 'notJudged') = (NOT "daily_problem_answers"."require_han_fu")
            AND ("daily_problem_answers"."yaku_result" = 'notJudged') = (NOT "daily_problem_answers"."require_yaku")
            AND ("daily_problem_answers"."require_han_fu" OR "daily_problem_answers"."fu_result" = 'notJudged')
            AND (NOT ("daily_problem_answers"."require_han_fu" AND "daily_problem_answers"."require_fu_for_mangan") OR "daily_problem_answers"."fu_result" <> 'notJudged')
            AND "daily_problem_answers"."judged_correct" = ("daily_problem_answers"."score_result" = 'correct'
              AND "daily_problem_answers"."han_result" <> 'incorrect' AND "daily_problem_answers"."fu_result" <> 'incorrect'
              AND "daily_problem_answers"."yaku_result" <> 'incorrect'))
        ))
    ) IS TRUE);--> statement-breakpoint
ALTER TABLE "daily_problems" ADD CONSTRAINT "daily_problems_chk_snapshot" CHECK ("daily_problems"."answer_snapshot" IS NULL OR (jsonb_typeof("daily_problems"."answer_snapshot") = 'object' AND "daily_problems"."answer_snapshot"->'v' = '1'::jsonb) IS TRUE);