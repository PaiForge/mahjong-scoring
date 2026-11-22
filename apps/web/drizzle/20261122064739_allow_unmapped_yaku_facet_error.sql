ALTER TABLE "practice_problem_facet_sets" DROP CONSTRAINT "practice_problem_facet_sets_chk_state";--> statement-breakpoint
ALTER TABLE "practice_problem_facet_sets" ADD CONSTRAINT "practice_problem_facet_sets_chk_state" CHECK ((
      "practice_problem_facet_sets"."scoring_version" > 0 AND (
        ("practice_problem_facet_sets"."status" = 'ok' AND "practice_problem_facet_sets"."error" IS NULL
          AND "practice_problem_facet_sets"."is_oya" IS NOT NULL AND "practice_problem_facet_sets"."is_menzen" IS NOT NULL AND "practice_problem_facet_sets"."is_riichi" IS NOT NULL
          AND "practice_problem_facet_sets"."kan_count" BETWEEN 0 AND 4
          AND "practice_problem_facet_sets"."jikaze" IN (27, 28, 29, 30) AND "practice_problem_facet_sets"."bakaze" IN (27, 28, 29, 30)
          AND "practice_problem_facet_sets"."is_oya" = ("practice_problem_facet_sets"."jikaze" = 27)
          AND ("practice_problem_facet_sets"."wait_count" IS NULL OR "practice_problem_facet_sets"."wait_count" BETWEEN 2 AND 34))
        OR ("practice_problem_facet_sets"."status" = 'failed' AND "practice_problem_facet_sets"."error" IN ('invalidPayload', 'invalidHand', 'agariHaiNotInHand', 'riichiWithFuro', 'noYaku', 'unsupportedYakuman', 'notTenpai', 'tooFewWaits', 'invalidWait', 'karaWait', 'noYakuTsumo', 'riichiWithNoYakuRon', 'fuOutOfOptions', 'unmappedYaku')
          AND "practice_problem_facet_sets"."is_oya" IS NULL AND "practice_problem_facet_sets"."is_menzen" IS NULL AND "practice_problem_facet_sets"."is_riichi" IS NULL
          AND "practice_problem_facet_sets"."kan_count" IS NULL AND "practice_problem_facet_sets"."jikaze" IS NULL AND "practice_problem_facet_sets"."bakaze" IS NULL
          AND "practice_problem_facet_sets"."wait_count" IS NULL)
      )) IS TRUE);