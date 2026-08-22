import { describe, it, expect } from "vitest";
import { judgeScoreTableAnswer } from "./judgement";
import type { ScoreTableAnswer, ScoreTableUserAnswer } from "./types";

describe("judgeScoreTableAnswer", () => {
  describe("正解の場合 true を返すこと", () => {
    it("ron: 点数が一致する場合 true", () => {
      const correct = { type: "ron", score: 3900 } as ScoreTableAnswer;
      const user = { type: "ron", score: 3900 } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(true);
    });

    it("oyaTsumo: all が一致する場合 true", () => {
      const correct = {
        type: "oyaTsumo",
        all: 2000,
      } as ScoreTableAnswer;
      const user = {
        type: "oyaTsumo",
        all: 2000,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(true);
    });

    it("koTsumo: fromKo と fromOya が一致する場合 true", () => {
      const correct = {
        type: "koTsumo",
        fromKo: 1000,
        fromOya: 2000,
      } as ScoreTableAnswer;
      const user = {
        type: "koTsumo",
        fromKo: 1000,
        fromOya: 2000,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(true);
    });
  });

  describe("不正解の場合 false を返すこと", () => {
    it("ron: 点数が異なる場合 false", () => {
      const correct = { type: "ron", score: 3900 } as ScoreTableAnswer;
      const user = { type: "ron", score: 2600 } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });

    it("oyaTsumo: all が異なる場合 false", () => {
      const correct = {
        type: "oyaTsumo",
        all: 2000,
      } as ScoreTableAnswer;
      const user = {
        type: "oyaTsumo",
        all: 1300,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });

    it("koTsumo: fromKo が異なる場合 false", () => {
      const correct = {
        type: "koTsumo",
        fromKo: 1000,
        fromOya: 2000,
      } as ScoreTableAnswer;
      const user = {
        type: "koTsumo",
        fromKo: 500,
        fromOya: 2000,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });

    it("koTsumo: fromOya が異なる場合 false", () => {
      const correct = {
        type: "koTsumo",
        fromKo: 1000,
        fromOya: 2000,
      } as ScoreTableAnswer;
      const user = {
        type: "koTsumo",
        fromKo: 1000,
        fromOya: 1000,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });
  });

  describe("回答の type が正解と異なる場合 false を返すこと", () => {
    it("正解が ron でユーザーが oyaTsumo の場合 false", () => {
      const correct = { type: "ron", score: 3900 } as ScoreTableAnswer;
      const user = {
        type: "oyaTsumo",
        all: 3900,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });

    it("正解が oyaTsumo でユーザーが ron の場合 false", () => {
      const correct = {
        type: "oyaTsumo",
        all: 2000,
      } as ScoreTableAnswer;
      const user = { type: "ron", score: 2000 } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });

    it("正解が koTsumo でユーザーが ron の場合 false", () => {
      const correct = {
        type: "koTsumo",
        fromKo: 1000,
        fromOya: 2000,
      } as ScoreTableAnswer;
      const user = { type: "ron", score: 1000 } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });

    it("正解が ron でユーザーが koTsumo の場合 false", () => {
      const correct = { type: "ron", score: 3900 } as ScoreTableAnswer;
      const user = {
        type: "koTsumo",
        fromKo: 1000,
        fromOya: 2000,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });
  });

  describe("koTsumo で片方だけ正解の場合 false を返すこと", () => {
    it("fromKo のみ正解の場合 false", () => {
      const correct = {
        type: "koTsumo",
        fromKo: 2000,
        fromOya: 4000,
      } as ScoreTableAnswer;
      const user = {
        type: "koTsumo",
        fromKo: 2000,
        fromOya: 3000,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });

    it("fromOya のみ正解の場合 false", () => {
      const correct = {
        type: "koTsumo",
        fromKo: 2000,
        fromOya: 4000,
      } as ScoreTableAnswer;
      const user = {
        type: "koTsumo",
        fromKo: 1000,
        fromOya: 4000,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });
  });
});
