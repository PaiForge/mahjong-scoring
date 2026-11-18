import { describe, expect, it } from "vitest";

import { practiceMenuByType } from "../practice-menu-types";
import { RANK_REGISTRY } from "../ranks/registry";

import {
  ANSWER_FEEDBACK_DURATION_MS,
  isPlausibleChallengeResult,
  isPlausibleExamScore,
  maxAnswersWithin,
} from "./challenge-result-bounds";

/**
 * 申告値の上限は「制限時間 ÷ フィードバックの表示時間 + 1 問」。
 * ここでは 60 秒・ミス上限 3 のルールで境界を確かめる（60 秒なら 75 問 + 1 問）。
 */
const RULES = { mistakeLimit: 3, timeLimit: 60 };
const MAX_ANSWERS = maxAnswersWithin(RULES.timeLimit);

describe("maxAnswersWithin", () => {
  it("制限時間の間にフィードバックを挟んで回答しきれる数に、時間切れ間際の 1 問を足す", () => {
    expect(maxAnswersWithin(60)).toBe(76);
  });

  it("フィードバックの表示時間ちょうどの倍数でない制限時間は端数を切り捨ててから 1 問足す", () => {
    // 1 秒 = 1.25 回ぶんのフィードバック → 1 問 + 間際の 1 問
    expect(maxAnswersWithin(1)).toBe(2);
  });

  it("フィードバックの表示時間ちょうどの制限時間は、その回数 + 1 問", () => {
    const seconds = (ANSWER_FEEDBACK_DURATION_MS * 5) / 1000;
    expect(maxAnswersWithin(seconds)).toBe(6);
  });

  it("制限時間が 0 でも時間切れ間際の 1 問は数える", () => {
    expect(maxAnswersWithin(0)).toBe(1);
  });
});

describe("isPlausibleChallengeResult", () => {
  it("すべての項目が 0 の結果（1 問も答えずに終えた）は受け付ける", () => {
    expect(
      isPlausibleChallengeResult(RULES, {
        score: 0,
        incorrectAnswers: 0,
        timeTaken: 0,
      }),
    ).toBe(true);
  });

  it("回答数・ミス・経過時間がすべて上限ちょうどなら受け付ける", () => {
    expect(
      isPlausibleChallengeResult(RULES, {
        score: MAX_ANSWERS - RULES.mistakeLimit,
        incorrectAnswers: RULES.mistakeLimit,
        timeTaken: RULES.timeLimit + 1,
      }),
    ).toBe(true);
  });

  it("経過時間は秒への丸め上がりぶん 1 秒だけ制限時間を超えてよく、2 秒超えは弾く", () => {
    const fields = { score: 0, incorrectAnswers: 0 };
    expect(
      isPlausibleChallengeResult(RULES, {
        ...fields,
        timeTaken: RULES.timeLimit + 1,
      }),
    ).toBe(true);
    expect(
      isPlausibleChallengeResult(RULES, {
        ...fields,
        timeTaken: RULES.timeLimit + 2,
      }),
    ).toBe(false);
  });

  it("ミスはミス上限ちょうどまで受け付け、1 つ超えると弾く", () => {
    const fields = { score: 0, timeTaken: 10 };
    expect(
      isPlausibleChallengeResult(RULES, {
        ...fields,
        incorrectAnswers: RULES.mistakeLimit,
      }),
    ).toBe(true);
    expect(
      isPlausibleChallengeResult(RULES, {
        ...fields,
        incorrectAnswers: RULES.mistakeLimit + 1,
      }),
    ).toBe(false);
  });

  it("正解とミスの合計は時間内に回答できる数まで受け付け、1 問超えると弾く", () => {
    const fields = { incorrectAnswers: 1, timeTaken: RULES.timeLimit };
    expect(
      isPlausibleChallengeResult(RULES, {
        ...fields,
        score: MAX_ANSWERS - 1,
      }),
    ).toBe(true);
    expect(
      isPlausibleChallengeResult(RULES, {
        ...fields,
        score: MAX_ANSWERS,
      }),
    ).toBe(false);
  });

  it("正解数だけで回答数の上限を超える結果は、ミスが 0 でも弾く", () => {
    expect(
      isPlausibleChallengeResult(RULES, {
        score: MAX_ANSWERS + 1,
        incorrectAnswers: 0,
        timeTaken: 10,
      }),
    ).toBe(false);
  });

  it.each([
    ["正解数が負", { score: -1, incorrectAnswers: 0, timeTaken: 10 }],
    ["正解数が小数", { score: 1.5, incorrectAnswers: 0, timeTaken: 10 }],
    ["正解数が無限大", { score: Infinity, incorrectAnswers: 0, timeTaken: 10 }],
    ["正解数が NaN", { score: Number.NaN, incorrectAnswers: 0, timeTaken: 10 }],
    ["ミスが負", { score: 3, incorrectAnswers: -1, timeTaken: 10 }],
    ["ミスが小数", { score: 0, incorrectAnswers: 0.5, timeTaken: 10 }],
    ["経過時間が負", { score: 0, incorrectAnswers: 0, timeTaken: -1 }],
    ["経過時間が小数", { score: 0, incorrectAnswers: 0, timeTaken: 10.5 }],
  ])("%s の結果は弾く", (_label, fields) => {
    expect(isPlausibleChallengeResult(RULES, fields)).toBe(false);
  });
});

describe("isPlausibleExamScore", () => {
  /**
   * 合格点が上限を超えていると、正規に解いた受験者が合格できなくなる。
   * 試験の制限時間や合格点を動かしたときに気づけるように全件で確かめる。
   */
  it("どの試験も合格点は上限以内", () => {
    expect(RANK_REGISTRY.length).toBeGreaterThan(0);
    for (const rank of RANK_REGISTRY) {
      const rules = practiceMenuByType(rank.exam.menuType);
      expect(isPlausibleExamScore(rules, rank.exam.minScore)).toBe(true);
    }
  });

  it("0 点と時間内に回答できる数ちょうどは受け付け、1 問超えると弾く", () => {
    expect(isPlausibleExamScore(RULES, 0)).toBe(true);
    expect(isPlausibleExamScore(RULES, MAX_ANSWERS)).toBe(true);
    expect(isPlausibleExamScore(RULES, MAX_ANSWERS + 1)).toBe(false);
  });

  it.each([
    ["負値", -1],
    ["小数", 2.5],
    ["NaN", Number.NaN],
  ])("%s の正解数は弾く", (_label, score) => {
    expect(isPlausibleExamScore(RULES, score)).toBe(false);
  });
});
