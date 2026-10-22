import type { JudgementResult, ScoreQuestion } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { resolveScoreResultView } from "./score-result-view";

/** 答え合わせに要る項目だけを持つ出題（手牌は組み立てに関与しない） */
function questionOf(
  overrides: Partial<Pick<ScoreQuestion, "yakuDetails" | "fuDetails">> & {
    readonly han?: number;
    readonly scoreLevel?: ScoreQuestion["answer"]["scoreLevel"];
  } = {},
): ScoreQuestion {
  return {
    tehai: { closed: [], exposed: [] },
    agariHai: 0,
    isTsumo: false,
    jikaze: 28,
    bakaze: 27,
    doraMarkers: [],
    answer: {
      han: overrides.han ?? 3,
      fu: 40,
      scoreLevel: overrides.scoreLevel ?? "Normal",
      payment: { type: "ron", amount: 5200 },
    },
    yakuDetails: overrides.yakuDetails ?? [{ name: "断么九", han: 1 }],
    fuDetails: overrides.fuDetails ?? [{ reason: "副底", fu: 20 }],
  } as unknown as ScoreQuestion;
}

const CORRECT: JudgementResult = {
  isCorrect: true,
  isHanCorrect: true,
  isFuCorrect: true,
  isScoreCorrect: true,
  isYakuCorrect: true,
};

const BASE = {
  requireHanFu: true,
  requireFuForMangan: false,
  yakuOrder: [],
  fuHanOrder: "han-first",
} as const;

describe("resolveScoreResultView", () => {
  it("回答と判定が揃えば judged を持ち、翻数と符を答えさせていれば judgedHanFu も持つ", () => {
    const userAnswer = { han: 3, fu: 40, score: 5200, yakus: ["断么九"] };
    const view = resolveScoreResultView({
      ...BASE,
      question: questionOf(),
      userAnswer,
      result: CORRECT,
    });
    expect(view.judged).toEqual({ answer: userAnswer, result: CORRECT });
    expect(view.judgedHanFu).toEqual(view.judged);
    expect(view.correctYakuNames).toEqual(["断么九"]);
    expect(view.showsFu).toBe(true);
    expect(view.breakdownTabs.map((tab) => tab.kind)).toEqual(["han", "fu"]);
  });

  it("翻数と符を答えさせていない設定では judgedHanFu を持たない", () => {
    const view = resolveScoreResultView({
      ...BASE,
      requireHanFu: false,
      question: questionOf(),
      userAnswer: { han: undefined, fu: undefined, score: 5200, yakus: [] },
      result: CORRECT,
    });
    expect(view.judged).toBeDefined();
    expect(view.judgedHanFu).toBeUndefined();
  });

  it("無回答の開示では judged が無く、満貫以上なら符の行も出さない", () => {
    const view = resolveScoreResultView({
      ...BASE,
      question: questionOf({ han: 5, scoreLevel: "Mangan" }),
      userAnswer: undefined,
      result: undefined,
    });
    expect(view.judged).toBeUndefined();
    expect(view.showsFu).toBe(false);
  });
});
