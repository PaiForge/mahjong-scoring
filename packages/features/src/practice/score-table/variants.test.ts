import { describe, expect, it } from "vitest";
import {
  generateScoreTableQuestion,
  MANGAN_MIN_HAN,
} from "@mahjong-scoring/core";

import {
  practiceMenuBySlug,
  PRACTICE_SLUG,
  type PracticeVariantOf,
} from "@mahjong-scoring/features/practice-menu-types";

import {
  SCORE_TABLE_VARIANT_OPTIONS,
  scoreTableDemoPromptOf,
  scoreTableGeneratorOptions,
} from "./variants";

type Variant = PracticeVariantOf<"score-table">;

const VARIANTS = Object.keys(SCORE_TABLE_VARIANT_OPTIONS) as Variant[];

describe("scoreTableDemoPromptOf", () => {
  it("親・満貫以上だけなら親の符の無い満貫", () => {
    expect(scoreTableDemoPromptOf("oya_mangan_plus")).toEqual({
      isOya: true,
      han: MANGAN_MIN_HAN,
      fu: undefined,
    });
  });

  it("子・満貫以上だけなら子の符の無い満貫", () => {
    expect(scoreTableDemoPromptOf("ko_mangan_plus")).toEqual({
      isOya: false,
      han: MANGAN_MIN_HAN,
      fu: undefined,
    });
  });

  it("親・満貫未満なら親の 3翻30符", () => {
    expect(scoreTableDemoPromptOf("oya_non_mangan")).toEqual({
      isOya: true,
      han: 3,
      fu: 30,
    });
  });

  it("子・満貫未満なら子の 3翻30符", () => {
    expect(scoreTableDemoPromptOf("ko_non_mangan")).toEqual({
      isOya: false,
      han: 3,
      fu: 30,
    });
  });

  it("すべてなら代表値（子・3翻30符）", () => {
    expect(scoreTableDemoPromptOf("all")).toEqual({
      isOya: false,
      han: 3,
      fu: 30,
    });
  });
});

describe("SCORE_TABLE_VARIANT_OPTIONS", () => {
  it("レジストリのバリアントと同じ集合を同じ順で持つ", () => {
    expect(VARIANTS).toEqual(
      practiceMenuBySlug(PRACTICE_SLUG.scoreTable).variants,
    );
  });

  it.each(VARIANTS.filter((v) => v !== "all"))(
    "%s の絞り込みはバリアント名の親子と点数帯の 1 つずつに限る",
    (variant) => {
      const { roles, ranges } = SCORE_TABLE_VARIANT_OPTIONS[variant];
      const [role, ...rest] = variant.split("_");
      expect(roles).toEqual([role]);
      expect(ranges).toEqual([
        rest.join("_") === "mangan_plus" ? "manganPlus" : "nonMangan",
      ]);
    },
  );

  it("「すべて」は他のバリアントの親子と点数帯をすべて含む", () => {
    const { roles, ranges } = SCORE_TABLE_VARIANT_OPTIONS.all;
    const others = VARIANTS.filter((v) => v !== "all").map(
      (v) => SCORE_TABLE_VARIANT_OPTIONS[v],
    );
    expect(new Set(roles)).toEqual(new Set(others.flatMap((o) => o.roles)));
    expect(new Set(ranges)).toEqual(new Set(others.flatMap((o) => o.ranges)));
  });

  it.each(VARIANTS)(
    "%s の出題条件で生成した問題は絞り込みの親子と点数帯に収まり、ツモとロンの両方が出る",
    (variant) => {
      const options = scoreTableGeneratorOptions(variant, {
        kiriageMangan: false,
        isTraining: true,
      });
      const { roles, ranges } = SCORE_TABLE_VARIANT_OPTIONS[variant];
      const questions = Array.from({ length: 200 }, () =>
        generateScoreTableQuestion(options),
      );
      for (const q of questions) {
        expect(roles).toContain(q.isOya ? "oya" : "ko");
        // 満貫以上の出題だけが符を持たない
        expect(ranges).toContain(
          q.fu === undefined ? "manganPlus" : "nonMangan",
        );
      }
      expect(new Set(questions.map((q) => q.isTsumo))).toEqual(
        new Set([true, false]),
      );
    },
  );
});

describe("scoreTableGeneratorOptions", () => {
  it("バリアントの絞り込みに切り上げ満貫の設定をそのまま載せる", () => {
    expect(
      scoreTableGeneratorOptions("ko_non_mangan", {
        kiriageMangan: true,
        isTraining: true,
      }),
    ).toEqual({
      roles: ["ko"],
      ranges: ["nonMangan"],
      kiriageMangan: true,
      excludeKiriageBoundary: false,
    });
  });

  it("チャレンジでは切り上げ満貫で正解が割れるセルを出題から落とす", () => {
    expect(
      scoreTableGeneratorOptions("all", {
        kiriageMangan: false,
        isTraining: false,
      }),
    ).toMatchObject({
      kiriageMangan: false,
      excludeKiriageBoundary: true,
    });
  });
});
