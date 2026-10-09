import { describe, expect, it } from "vitest";
import {
  generateValidScoreQuestion,
  generateValidTenpaiScoreQuestion,
  isMangan,
  koTsumoPaymentKey,
  mulberry32,
  type ScoreQuestion,
} from "@mahjong-scoring/core";

import {
  getAvailableScores,
  type AvailableScoresParams,
} from "./get-available-scores";

/**
 * 生成器が出す子ツモの正解が、その出題で出す選択肢に含まれること
 *
 * 全セル・全区分の網羅は `get-available-scores.test.ts` が持つ。こちらは
 * 実際の生成器（和了形の点数計算・チャレンジ / 試験の境界除外・聴牌形の
 * 各ツモのマス）を固定シードで回し、生成器と選択肢の分類（満貫未満 /
 * 以上）が食い違っていないかを確かめる。
 */
function expectSelectable(
  question: ScoreQuestion,
  kiriageMangan: boolean,
): boolean {
  const { payment, han } = question.answer;
  if (payment.type !== "koTsumo") return false;
  const [fromKo, fromOya] = payment.amount;
  const filters: readonly Pick<AvailableScoresParams, "han" | "scoreRange">[] =
    [
      { han },
      {
        han: undefined,
        scoreRange: isMangan(question.answer.scoreLevel)
          ? "manganPlus"
          : "nonMangan",
      },
      { han: undefined, scoreRange: "all" },
    ];
  for (const filter of filters) {
    const base = { ...filter, isOya: false, isTsumo: true, kiriageMangan };
    const combined = getAvailableScores({ ...base, koTsumoInput: "combined" });
    if (combined.type !== "koTsumoCombined") throw new Error(combined.type);
    expect(combined.payments.map(koTsumoPaymentKey)).toContain(
      koTsumoPaymentKey({ fromKo, fromOya }),
    );

    const split = getAvailableScores({ ...base, koTsumoInput: "split" });
    if (split.type !== "koTsumoSplit") throw new Error(split.type);
    expect(split.koScores).toContain(fromKo);
    expect(split.oyaScores).toContain(fromOya);
  }
  return true;
}

describe("生成器の子ツモの正解は選択肢に含まれる", () => {
  it.each([
    { kiriageMangan: false, excludeKiriageBoundary: false },
    { kiriageMangan: true, excludeKiriageBoundary: false },
    // 記録が残るチャレンジ・昇級試験（境界の手を落とし、切り上げ満貫なしで出す）
    { kiriageMangan: false, excludeKiriageBoundary: true },
  ])("和了形の点数計算 %o", (rules) => {
    const rng = mulberry32(20261009);
    let checked = 0;
    for (let i = 0; i < 300; i++) {
      const question = generateValidScoreQuestion({
        ...rules,
        includeParent: false,
        rng,
      });
      if (question && expectSelectable(question, rules.kiriageMangan)) {
        checked++;
      }
    }
    // 子ツモが十分な数だけ出て、検査が空回りしていないこと
    expect(checked).toBeGreaterThan(100);
  });

  it.each([false, true])(
    "聴牌形の点数計算の各ツモのマス（切り上げ満貫=%s）",
    (kiriageMangan) => {
      const rng = mulberry32(20261009);
      for (let i = 0; i < 60; i++) {
        const question = generateValidTenpaiScoreQuestion({
          kiriageMangan,
          includeParent: false,
          rng,
        });
        for (const wait of question?.waits ?? []) {
          expectSelectable(wait.tsumo, kiriageMangan);
        }
      }
    },
  );
});
