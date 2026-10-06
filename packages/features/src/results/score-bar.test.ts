import { describe, expect, it } from "vitest";
import { scoreBarFigures } from "./score-bar";

describe("scoreBarFigures", () => {
  it("正解・不正解の件数と正答率を出す", () => {
    expect(scoreBarFigures(27, 28)).toEqual({
      correct: 27,
      incorrect: 1,
      total: 28,
      accuracy: 96,
    });
  });

  it("正解数を 0〜全体に丸める", () => {
    expect(scoreBarFigures(5, 3)).toMatchObject({ correct: 3, incorrect: 0 });
    expect(scoreBarFigures(-1, 3)).toMatchObject({ correct: 0, incorrect: 3 });
  });

  it("解いた問題が無ければすべて 0", () => {
    expect(scoreBarFigures(0, 0)).toEqual({
      correct: 0,
      incorrect: 0,
      total: 0,
      accuracy: 0,
    });
  });
});
