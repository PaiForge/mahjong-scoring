import { describe, it, expect } from "vitest";
import { BAKAZE_OPTIONS } from "../../core/constants";
import { expectSampled } from "../../test/sampling";
import { generateJantouFuQuestion } from "../jantou-fu/generator";
import { generateScoreQuestion } from "../score/generator";
import { generateMentsuJantouFuQuestion } from "../mentsu-jantou-fu/generator";
import { generateTotalFuQuestion } from "../total-fu/generator";
import { generateYakuQuestion } from "../yaku/generator";

/**
 * 出題される場風が全ジェネレータで {@link BAKAZE_OPTIONS} に収まることを検証する。
 *
 * かつて各ジェネレータが場風の候補を個別に持っており、東南のみを出すものと
 * 西場・北場も出すものに分かれていた。同じルールが2通りに割れる再発を防ぐ。
 */
describe("場風の候補", () => {
  const generators = [
    ["jantou-fu", () => generateJantouFuQuestion()?.context.bakaze],
    [
      "mentsu-jantou-fu",
      () => generateMentsuJantouFuQuestion()?.context.bakaze,
    ],
    ["total-fu", () => generateTotalFuQuestion()?.context.bakaze],
    ["yaku", () => generateYakuQuestion()?.context.bakaze],
    ["score", () => generateScoreQuestion()?.bakaze],
  ] as const;

  it.each(generators)(
    "%s は BAKAZE_OPTIONS の中から出題する",
    (_name, pick) => {
      const bakazes = expectSampled(pick, { need: 30, attempts: 300 });
      for (const bakaze of bakazes) {
        expect(BAKAZE_OPTIONS).toContain(bakaze);
      }
    },
  );
});
