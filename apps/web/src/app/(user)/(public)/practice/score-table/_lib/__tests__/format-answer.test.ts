import { describe, expect, it } from "vitest";

import type { ScoreTableAnswer } from "@mahjong-scoring/core";
import { formatScoreAnswer as formatAnswer } from "../../../_lib/format-score-answer";

const mockT = (key: string): string => {
  const dict: Record<string, string> = { all: "オール" };
  return dict[key] ?? key;
};

describe("formatAnswer", () => {
  it("ロンの場合は点数のみ返す", () => {
    const answer: ScoreTableAnswer = { type: "ron", score: 3900 };
    expect(formatAnswer(answer, mockT)).toBe("3900");
  });

  it("親ツモの場合はオール表記を返す", () => {
    const answer: ScoreTableAnswer = { type: "oyaTsumo", scoreAll: 4000 };
    expect(formatAnswer(answer, mockT)).toBe("4000オール");
  });

  it("子ツモの場合はスラッシュ区切りで返す", () => {
    const answer: ScoreTableAnswer = {
      type: "koTsumo",
      scoreFromKo: 1000,
      scoreFromOya: 2000,
    };
    expect(formatAnswer(answer, mockT)).toBe("1000/2000");
  });

  it("ロン 1000点", () => {
    const answer: ScoreTableAnswer = { type: "ron", score: 1000 };
    expect(formatAnswer(answer, mockT)).toBe("1000");
  });

  it("ロン 12000点", () => {
    const answer: ScoreTableAnswer = { type: "ron", score: 12000 };
    expect(formatAnswer(answer, mockT)).toBe("12000");
  });

  it("親ツモ 2000オール", () => {
    const answer: ScoreTableAnswer = { type: "oyaTsumo", scoreAll: 2000 };
    expect(formatAnswer(answer, mockT)).toBe("2000オール");
  });

  it("子ツモ 2000/4000", () => {
    const answer: ScoreTableAnswer = {
      type: "koTsumo",
      scoreFromKo: 2000,
      scoreFromOya: 4000,
    };
    expect(formatAnswer(answer, mockT)).toBe("2000/4000");
  });

  it("翻訳関数の 'all' キーが使われる", () => {
    const customT = (key: string): string => (key === "all" ? "ALL" : key);
    const answer: ScoreTableAnswer = { type: "oyaTsumo", scoreAll: 4000 };
    expect(formatAnswer(answer, customT)).toBe("4000ALL");
  });
});
