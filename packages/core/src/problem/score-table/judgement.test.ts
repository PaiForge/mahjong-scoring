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

    it("oyaTsumo: scoreAll が一致する場合 true", () => {
      const correct = {
        type: "oyaTsumo",
        scoreAll: 2000,
      } as ScoreTableAnswer;
      const user = {
        type: "oyaTsumo",
        scoreAll: 2000,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(true);
    });

    it("koTsumo: scoreFromKo と scoreFromOya が一致する場合 true", () => {
      const correct = {
        type: "koTsumo",
        scoreFromKo: 1000,
        scoreFromOya: 2000,
      } as ScoreTableAnswer;
      const user = {
        type: "koTsumo",
        scoreFromKo: 1000,
        scoreFromOya: 2000,
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

    it("oyaTsumo: scoreAll が異なる場合 false", () => {
      const correct = {
        type: "oyaTsumo",
        scoreAll: 2000,
      } as ScoreTableAnswer;
      const user = {
        type: "oyaTsumo",
        scoreAll: 1300,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });

    it("koTsumo: scoreFromKo が異なる場合 false", () => {
      const correct = {
        type: "koTsumo",
        scoreFromKo: 1000,
        scoreFromOya: 2000,
      } as ScoreTableAnswer;
      const user = {
        type: "koTsumo",
        scoreFromKo: 500,
        scoreFromOya: 2000,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });

    it("koTsumo: scoreFromOya が異なる場合 false", () => {
      const correct = {
        type: "koTsumo",
        scoreFromKo: 1000,
        scoreFromOya: 2000,
      } as ScoreTableAnswer;
      const user = {
        type: "koTsumo",
        scoreFromKo: 1000,
        scoreFromOya: 1000,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });
  });

  describe("回答の type が正解と異なる場合 false を返すこと", () => {
    it("正解が ron でユーザーが oyaTsumo の場合 false", () => {
      const correct = { type: "ron", score: 3900 } as ScoreTableAnswer;
      const user = {
        type: "oyaTsumo",
        scoreAll: 3900,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });

    it("正解が oyaTsumo でユーザーが ron の場合 false", () => {
      const correct = {
        type: "oyaTsumo",
        scoreAll: 2000,
      } as ScoreTableAnswer;
      const user = { type: "ron", score: 2000 } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });

    it("正解が koTsumo でユーザーが ron の場合 false", () => {
      const correct = {
        type: "koTsumo",
        scoreFromKo: 1000,
        scoreFromOya: 2000,
      } as ScoreTableAnswer;
      const user = { type: "ron", score: 1000 } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });

    it("正解が ron でユーザーが koTsumo の場合 false", () => {
      const correct = { type: "ron", score: 3900 } as ScoreTableAnswer;
      const user = {
        type: "koTsumo",
        scoreFromKo: 1000,
        scoreFromOya: 2000,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });
  });

  describe("koTsumo で片方だけ正解の場合 false を返すこと", () => {
    it("scoreFromKo のみ正解の場合 false", () => {
      const correct = {
        type: "koTsumo",
        scoreFromKo: 2000,
        scoreFromOya: 4000,
      } as ScoreTableAnswer;
      const user = {
        type: "koTsumo",
        scoreFromKo: 2000,
        scoreFromOya: 3000,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });

    it("scoreFromOya のみ正解の場合 false", () => {
      const correct = {
        type: "koTsumo",
        scoreFromKo: 2000,
        scoreFromOya: 4000,
      } as ScoreTableAnswer;
      const user = {
        type: "koTsumo",
        scoreFromKo: 1000,
        scoreFromOya: 4000,
      } as ScoreTableUserAnswer;
      expect(judgeScoreTableAnswer(user, correct)).toBe(false);
    });
  });
});
