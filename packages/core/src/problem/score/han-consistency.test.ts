import { describe, expect, it } from "vitest";

import { generateValidScoreQuestion } from "./generator";
import { ALL_YAKUMAN_RULES_ENABLED } from "../../rules/settings";
import type { QuestionGeneratorOptions } from "./types";

/**
 * 翻数と役の内訳の整合性
 *
 * ライブラリの `detectYaku` と `calculateScoreForTehai` は同じ手牌で食い違う
 * ことがある（門前の清一色・混一色・混全帯么九を含む手で、後者が副露のときの
 * 値で数えて 1〜2 翻少なくなる）。アプリは翻数を後者から、内訳を前者から
 * 取っていたため、30000 手あたり 19 件で両者がずれ、うち 2 件は点数帯まで
 * 変わっていた。`generateScoreQuestion` が内訳の合計を翻数の正典にすることで
 * 揃えている。
 *
 * 結果ページが役の内訳を出すため、ここがずれると画面上で見えてしまう
 * （「6翻」の横に合計 7 翻の内訳が並ぶ）。乱数生成なので件数で押す。
 */
const CASES: readonly (readonly [string, QuestionGeneratorOptions])[] = [
  ["既定", {}],
  // 清一色・混一色が出るのは満貫以上。食い違いが最も出やすい条件
  ["満貫以上", { allowedRanges: ["manganPlus"], minHan: 5 }],
  ["満貫未満", { allowedRanges: ["nonMangan"] }],
  // ダブル役満（26翻の役）が内訳と翻数の両方に正しく乗ることの保証
  ["役満ルール全有効", { yakumanRules: ALL_YAKUMAN_RULES_ENABLED }],
];

describe.each(CASES)("翻数と役の内訳の整合性: %s", (_label, options) => {
  it("役の内訳の合計が翻数と一致する", () => {
    const mismatches: string[] = [];

    for (let i = 0; i < 2000; i++) {
      const question = generateValidScoreQuestion(options, 500);
      if (!question) continue;

      const details = question.yakuDetails ?? [];
      const sum = details.reduce((total, yaku) => total + yaku.han, 0);
      if (sum !== question.answer.han) {
        mismatches.push(
          `内訳 ${sum} vs 翻数 ${question.answer.han}: ${details
            .map((yaku) => `${yaku.name}${yaku.han}`)
            .join(",")}`,
        );
      }
    }

    expect(mismatches, mismatches.slice(0, 3).join(" / ")).toEqual([]);
  });
});
