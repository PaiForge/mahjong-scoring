CREATE TABLE "practice_problem_facet_sets" (
	"problem_id" uuid NOT NULL,
	"scoring_version" smallint NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"is_oya" boolean,
	"is_menzen" boolean,
	"is_riichi" boolean,
	"kan_count" smallint,
	"jikaze" smallint,
	"bakaze" smallint,
	"wait_count" smallint,
	"revision" text,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "practice_problem_facet_sets_problem_id_scoring_version_pk" PRIMARY KEY("problem_id","scoring_version"),
	CONSTRAINT "practice_problem_facet_sets_chk_state" CHECK ((
      "practice_problem_facet_sets"."scoring_version" > 0 AND (
        ("practice_problem_facet_sets"."status" = 'ok' AND "practice_problem_facet_sets"."error" IS NULL
          AND "practice_problem_facet_sets"."is_oya" IS NOT NULL AND "practice_problem_facet_sets"."is_menzen" IS NOT NULL AND "practice_problem_facet_sets"."is_riichi" IS NOT NULL
          AND "practice_problem_facet_sets"."kan_count" BETWEEN 0 AND 4
          AND "practice_problem_facet_sets"."jikaze" IN (27, 28, 29, 30) AND "practice_problem_facet_sets"."bakaze" IN (27, 28, 29, 30)
          AND "practice_problem_facet_sets"."is_oya" = ("practice_problem_facet_sets"."jikaze" = 27)
          AND ("practice_problem_facet_sets"."wait_count" IS NULL OR "practice_problem_facet_sets"."wait_count" BETWEEN 2 AND 34))
        OR ("practice_problem_facet_sets"."status" = 'failed' AND "practice_problem_facet_sets"."error" IN ('invalidPayload', 'invalidHand', 'agariHaiNotInHand', 'riichiWithFuro', 'noYaku', 'unsupportedYakuman', 'notTenpai', 'tooFewWaits', 'invalidWait', 'karaWait', 'noYakuTsumo', 'riichiWithNoYakuRon', 'fuOutOfOptions')
          AND "practice_problem_facet_sets"."is_oya" IS NULL AND "practice_problem_facet_sets"."is_menzen" IS NULL AND "practice_problem_facet_sets"."is_riichi" IS NULL
          AND "practice_problem_facet_sets"."kan_count" IS NULL AND "practice_problem_facet_sets"."jikaze" IS NULL AND "practice_problem_facet_sets"."bakaze" IS NULL
          AND "practice_problem_facet_sets"."wait_count" IS NULL)
      )) IS TRUE)
);
--> statement-breakpoint
ALTER TABLE "practice_problem_facet_sets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "practice_problem_facets" (
	"problem_id" uuid NOT NULL,
	"scoring_version" smallint NOT NULL,
	"agari_hai" smallint NOT NULL,
	"is_tsumo" boolean NOT NULL,
	"result" text NOT NULL,
	"han" smallint,
	"fu" smallint,
	"score_level" text,
	"yakuman_multiplier" smallint,
	"points" integer,
	"yaku" text[],
	"dora_han" smallint,
	"ura_dora_han" smallint,
	"machi" text,
	"varies_by_renfonpai" boolean,
	"varies_by_kiriage" boolean,
	"varies_by_yakuman_rules" boolean,
	CONSTRAINT "practice_problem_facets_problem_id_scoring_version_agari_hai_is_tsumo_pk" PRIMARY KEY("problem_id","scoring_version","agari_hai","is_tsumo"),
	CONSTRAINT "practice_problem_facets_chk_state" CHECK ((
      "practice_problem_facets"."scoring_version" > 0 AND "practice_problem_facets"."agari_hai" BETWEEN 0 AND 33 AND (
        ("practice_problem_facets"."result" = 'scored' AND "practice_problem_facets"."han" > 0 AND "practice_problem_facets"."fu" >= 0
          AND "practice_problem_facets"."score_level" IN ('Normal', 'Mangan', 'Haneman', 'Baiman', 'Sanbaiman', 'Yakuman', 'DoubleYakuman')
          AND "practice_problem_facets"."yakuman_multiplier" >= 0 AND "practice_problem_facets"."points" > 0
          AND "practice_problem_facets"."yaku" IS NOT NULL AND cardinality("practice_problem_facets"."yaku") > 0
          AND array_position("practice_problem_facets"."yaku", NULL) IS NULL
          AND "practice_problem_facets"."dora_han" >= 0 AND "practice_problem_facets"."ura_dora_han" >= 0
          AND ("practice_problem_facets"."machi" IS NULL OR "practice_problem_facets"."machi" IN ('Tanki', 'Shanpon', 'Ryanmen', 'Kanchan', 'Penchan'))
          AND "practice_problem_facets"."varies_by_renfonpai" IS NOT NULL AND "practice_problem_facets"."varies_by_kiriage" IS NOT NULL
          AND "practice_problem_facets"."varies_by_yakuman_rules" IS NOT NULL)
        OR ("practice_problem_facets"."result" = 'noYaku' AND "practice_problem_facets"."is_tsumo" IS FALSE
          AND "practice_problem_facets"."han" IS NULL AND "practice_problem_facets"."fu" IS NULL AND "practice_problem_facets"."score_level" IS NULL
          AND "practice_problem_facets"."yakuman_multiplier" IS NULL AND "practice_problem_facets"."points" IS NULL AND "practice_problem_facets"."yaku" IS NULL
          AND "practice_problem_facets"."dora_han" IS NULL AND "practice_problem_facets"."ura_dora_han" IS NULL AND "practice_problem_facets"."machi" IS NULL
          AND "practice_problem_facets"."varies_by_renfonpai" IS NULL AND "practice_problem_facets"."varies_by_kiriage" IS NULL
          AND "practice_problem_facets"."varies_by_yakuman_rules" IS NULL)
      )) IS TRUE)
);
--> statement-breakpoint
ALTER TABLE "practice_problem_facets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "practice_problem_facet_sets" ADD CONSTRAINT "practice_problem_facet_sets_problem_id_practice_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."practice_problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_problem_facets" ADD CONSTRAINT "practice_problem_facets_problem_id_scoring_version_practice_problem_facet_sets_problem_id_scoring_version_fk" FOREIGN KEY ("problem_id","scoring_version") REFERENCES "public"."practice_problem_facet_sets"("problem_id","scoring_version") ON DELETE cascade ON UPDATE no action;