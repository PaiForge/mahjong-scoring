import { describe, it, expect } from "vitest";
import { judgeAnswer, isMangan, getScoreLevelName } from "./judgement";
import type { ScoreQuestion, UserAnswer } from "./types";
import { ScoreLevel } from "../../core/constants";

/**
 * テスト用のScoreQuestionを構築するヘルパー
 */
function makeQuestion(overrides: {
  han?: number;
  fu?: number;
  scoreLevel?: string;
  payment?: ScoreQuestion["answer"]["payment"];
  yakuDetails?: ScoreQuestion["yakuDetails"];
}): ScoreQuestion {
  const {
    han = 2,
    fu = 30,
    scoreLevel = ScoreLevel.Normal,
    payment = { type: "ron" as const, amount: 2000 },
    yakuDetails,
  } = overrides;

  return {
    tehai: { closed: [], exposed: [] },
    agariHai: 0,
    isTsumo: false,
    jikaze: 27,
    bakaze: 27,
    doraMarkers: [],
    answer: { han, fu, scoreLevel, payment },
    yakuDetails,
  } as unknown as ScoreQuestion;
}

describe("isMangan", () => {
  it("満貫で true を返す", () => {
    expect(isMangan(ScoreLevel.Mangan)).toBe(true);
  });

  it("跳満で true を返す", () => {
    expect(isMangan(ScoreLevel.Haneman)).toBe(true);
  });

  it("倍満で true を返す", () => {
    expect(isMangan(ScoreLevel.Baiman)).toBe(true);
  });

  it("三倍満で true を返す", () => {
    expect(isMangan(ScoreLevel.Sanbaiman)).toBe(true);
  });

  it("役満で true を返す", () => {
    expect(isMangan(ScoreLevel.Yakuman)).toBe(true);
  });

  it("ダブル役満で true を返す", () => {
    expect(isMangan(ScoreLevel.DoubleYakuman)).toBe(true);
  });

  it("通常で false を返す", () => {
    expect(isMangan(ScoreLevel.Normal)).toBe(false);
  });

  it("不明な文字列で false を返す", () => {
    expect(isMangan("Unknown")).toBe(false);
  });
});

describe("judgeAnswer", () => {
  describe("全項目正解", () => {
    it("ロンの正解判定", () => {
      const question = makeQuestion({
        han: 3,
        fu: 30,
        payment: { type: "ron", amount: 3900 },
      });
      const answer: UserAnswer = { han: 3, fu: 30, score: 3900, yakus: [] };
      const result = judgeAnswer(question, answer);

      expect(result.isCorrect).toBe(true);
      expect(result.isHanCorrect).toBe(true);
      expect(result.isFuCorrect).toBe(true);
      expect(result.isScoreCorrect).toBe(true);
      expect(result.isYakuCorrect).toBe(true);
    });

    it("親ツモの正解判定", () => {
      const question = makeQuestion({
        han: 2,
        fu: 40,
        payment: { type: "oyaTsumo", amount: 2600 },
      });
      const answer: UserAnswer = { han: 2, fu: 40, score: 2600, yakus: [] };
      const result = judgeAnswer(question, answer);

      expect(result.isCorrect).toBe(true);
    });

    it("子ツモの正解判定", () => {
      const question = makeQuestion({
        han: 3,
        fu: 30,
        payment: { type: "koTsumo", amount: [1000, 2000] },
      });
      const answer: UserAnswer = {
        han: 3,
        fu: 30,
        scoreFromKo: 1000,
        scoreFromOya: 2000,
        yakus: [],
      };
      const result = judgeAnswer(question, answer);

      expect(result.isCorrect).toBe(true);
    });
  });

  describe("翻の不正解", () => {
    it("翻数が違う場合 isHanCorrect が false", () => {
      const question = makeQuestion({ han: 3, fu: 30, payment: { type: "ron", amount: 3900 } });
      const answer: UserAnswer = { han: 2, fu: 30, score: 3900, yakus: [] };
      const result = judgeAnswer(question, answer);

      expect(result.isHanCorrect).toBe(false);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe("符の不正解", () => {
    it("符が違う場合 isFuCorrect が false", () => {
      const question = makeQuestion({ han: 2, fu: 30, payment: { type: "ron", amount: 2000 } });
      const answer: UserAnswer = { han: 2, fu: 40, score: 2000, yakus: [] };
      const result = judgeAnswer(question, answer);

      expect(result.isFuCorrect).toBe(false);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe("点数の不正解", () => {
    it("ロン点数が違う場合 isScoreCorrect が false", () => {
      const question = makeQuestion({ han: 2, fu: 30, payment: { type: "ron", amount: 2000 } });
      const answer: UserAnswer = { han: 2, fu: 30, score: 3900, yakus: [] };
      const result = judgeAnswer(question, answer);

      expect(result.isScoreCorrect).toBe(false);
      expect(result.isCorrect).toBe(false);
    });

    it("子ツモの子支払いが違う場合 isScoreCorrect が false", () => {
      const question = makeQuestion({
        han: 3,
        fu: 30,
        payment: { type: "koTsumo", amount: [1000, 2000] },
      });
      const answer: UserAnswer = {
        han: 3,
        fu: 30,
        scoreFromKo: 500,
        scoreFromOya: 2000,
        yakus: [],
      };
      const result = judgeAnswer(question, answer);

      expect(result.isScoreCorrect).toBe(false);
    });

    it("子ツモの親支払いが違う場合 isScoreCorrect が false", () => {
      const question = makeQuestion({
        han: 3,
        fu: 30,
        payment: { type: "koTsumo", amount: [1000, 2000] },
      });
      const answer: UserAnswer = {
        han: 3,
        fu: 30,
        scoreFromKo: 1000,
        scoreFromOya: 1000,
        yakus: [],
      };
      const result = judgeAnswer(question, answer);

      expect(result.isScoreCorrect).toBe(false);
    });
  });

  describe("simplifyMangan モード", () => {
    it("5翻以上は満貫バケットに統一される（5翻正解 → 5翻回答OK）", () => {
      const question = makeQuestion({
        han: 5,
        fu: 30,
        scoreLevel: ScoreLevel.Mangan,
        payment: { type: "ron", amount: 8000 },
      });
      const answer: UserAnswer = { han: 5, fu: 30, score: 8000, yakus: [] };
      const result = judgeAnswer(question, answer, false, true);

      expect(result.isHanCorrect).toBe(true);
    });

    it("6翻と7翻は同じ跳満バケット", () => {
      const question = makeQuestion({
        han: 7,
        fu: 30,
        scoreLevel: ScoreLevel.Haneman,
        payment: { type: "ron", amount: 12000 },
      });
      const answer: UserAnswer = { han: 6, fu: 30, score: 12000, yakus: [] };
      const result = judgeAnswer(question, answer, false, true);

      expect(result.isHanCorrect).toBe(true);
    });

    it("8翻と10翻は同じ倍満バケット", () => {
      const question = makeQuestion({
        han: 10,
        fu: 30,
        scoreLevel: ScoreLevel.Baiman,
        payment: { type: "ron", amount: 16000 },
      });
      const answer: UserAnswer = { han: 8, fu: 30, score: 16000, yakus: [] };
      const result = judgeAnswer(question, answer, false, true);

      expect(result.isHanCorrect).toBe(true);
    });

    it("11翻と12翻は同じ三倍満バケット", () => {
      const question = makeQuestion({
        han: 12,
        fu: 30,
        scoreLevel: ScoreLevel.Sanbaiman,
        payment: { type: "ron", amount: 24000 },
      });
      const answer: UserAnswer = { han: 11, fu: 30, score: 24000, yakus: [] };
      const result = judgeAnswer(question, answer, false, true);

      expect(result.isHanCorrect).toBe(true);
    });

    it("13翻以上は役満バケット", () => {
      const question = makeQuestion({
        han: 26,
        fu: 30,
        scoreLevel: ScoreLevel.DoubleYakuman,
        payment: { type: "ron", amount: 32000 },
      });
      const answer: UserAnswer = { han: 13, fu: 30, score: 32000, yakus: [] };
      const result = judgeAnswer(question, answer, false, true);

      expect(result.isHanCorrect).toBe(true);
    });

    it("4翻以下は簡略化されない", () => {
      const question = makeQuestion({
        han: 3,
        fu: 30,
        payment: { type: "ron", amount: 3900 },
      });
      const answer: UserAnswer = { han: 4, fu: 30, score: 3900, yakus: [] };
      const result = judgeAnswer(question, answer, false, true);

      expect(result.isHanCorrect).toBe(false);
    });

    it("4翻以下の満貫（60符3翻等）で5翻回答も正解", () => {
      const question = makeQuestion({
        han: 3,
        fu: 60,
        scoreLevel: ScoreLevel.Mangan,
        payment: { type: "ron", amount: 8000 },
      });
      const answer: UserAnswer = { han: 5, fu: 60, score: 8000, yakus: [] };
      const result = judgeAnswer(question, answer, false, true);

      expect(result.isHanCorrect).toBe(true);
    });
  });

  describe("requireFuForMangan = false（デフォルト）", () => {
    it("満貫以上では符が不正でも isFuCorrect が true", () => {
      const question = makeQuestion({
        han: 5,
        fu: 30,
        scoreLevel: ScoreLevel.Mangan,
        payment: { type: "ron", amount: 8000 },
      });
      const answer: UserAnswer = { han: 5, fu: undefined, score: 8000, yakus: [] };
      const result = judgeAnswer(question, answer);

      expect(result.isFuCorrect).toBe(true);
    });
  });

  describe("requireFuForMangan = true", () => {
    it("満貫以上でも符が不正なら isFuCorrect が false", () => {
      const question = makeQuestion({
        han: 5,
        fu: 30,
        scoreLevel: ScoreLevel.Mangan,
        payment: { type: "ron", amount: 8000 },
      });
      const answer: UserAnswer = { han: 5, fu: 40, score: 8000, yakus: [] };
      const result = judgeAnswer(question, answer, false, false, true);

      expect(result.isFuCorrect).toBe(false);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe("requireYaku", () => {
    it("requireYaku=false の場合、役は常に正解扱い", () => {
      const question = makeQuestion({
        han: 2,
        fu: 30,
        payment: { type: "ron", amount: 2000 },
        yakuDetails: [{ name: "断么九", han: 1 }, { name: "平和", han: 1 }],
      });
      const answer: UserAnswer = { han: 2, fu: 30, score: 2000, yakus: [] };
      const result = judgeAnswer(question, answer, false);

      expect(result.isYakuCorrect).toBe(true);
    });

    it("requireYaku=true で正しい役を回答した場合 isYakuCorrect が true", () => {
      const question = makeQuestion({
        han: 2,
        fu: 30,
        payment: { type: "ron", amount: 2000 },
        yakuDetails: [{ name: "断么九", han: 1 }, { name: "平和", han: 1 }],
      });
      const answer: UserAnswer = { han: 2, fu: 30, score: 2000, yakus: ["断么九", "平和"] };
      const result = judgeAnswer(question, answer, true);

      expect(result.isYakuCorrect).toBe(true);
    });

    it("requireYaku=true で役が不足する場合 isYakuCorrect が false", () => {
      const question = makeQuestion({
        han: 2,
        fu: 30,
        payment: { type: "ron", amount: 2000 },
        yakuDetails: [{ name: "断么九", han: 1 }, { name: "平和", han: 1 }],
      });
      const answer: UserAnswer = { han: 2, fu: 30, score: 2000, yakus: ["断么九"] };
      const result = judgeAnswer(question, answer, true);

      expect(result.isYakuCorrect).toBe(false);
    });

    it("ドラ等の判定除外役は無視される", () => {
      const question = makeQuestion({
        han: 3,
        fu: 30,
        payment: { type: "ron", amount: 3900 },
        yakuDetails: [
          { name: "断么九", han: 1 },
          { name: "平和", han: 1 },
          { name: "ドラ", han: 1 },
        ],
      });
      // ドラは無視されるので断么九と平和だけで正解
      const answer: UserAnswer = { han: 3, fu: 30, score: 3900, yakus: ["断么九", "平和"] };
      const result = judgeAnswer(question, answer, true);

      expect(result.isYakuCorrect).toBe(true);
    });

    it("yakuDetails が undefined で空の yakus なら正解", () => {
      const question = makeQuestion({
        han: 2,
        fu: 30,
        payment: { type: "ron", amount: 2000 },
        yakuDetails: undefined,
      });
      const answer: UserAnswer = { han: 2, fu: 30, score: 2000, yakus: [] };
      const result = judgeAnswer(question, answer, true);

      expect(result.isYakuCorrect).toBe(true);
    });
  });
});

describe("getScoreLevelName", () => {
  it("Normal は空文字を返す", () => {
    expect(getScoreLevelName(ScoreLevel.Normal)).toBe("");
  });

  it("Mangan は満貫を返す", () => {
    expect(getScoreLevelName(ScoreLevel.Mangan)).toBe("満貫");
  });

  it("Haneman は跳満を返す", () => {
    expect(getScoreLevelName(ScoreLevel.Haneman)).toBe("跳満");
  });

  it("Baiman は倍満を返す", () => {
    expect(getScoreLevelName(ScoreLevel.Baiman)).toBe("倍満");
  });

  it("Sanbaiman は三倍満を返す", () => {
    expect(getScoreLevelName(ScoreLevel.Sanbaiman)).toBe("三倍満");
  });

  it("Yakuman は役満を返す", () => {
    expect(getScoreLevelName(ScoreLevel.Yakuman)).toBe("役満");
  });

  it("DoubleYakuman はダブル役満を返す", () => {
    expect(getScoreLevelName(ScoreLevel.DoubleYakuman)).toBe("ダブル役満");
  });

  it("不明な文字列は空文字を返す", () => {
    expect(getScoreLevelName("Unknown")).toBe("");
  });
});
