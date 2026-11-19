import { describe, expect, it } from "vitest";

import { DEFAULT_RULE_SETTINGS } from "@mahjong-scoring/core";
import type {
  AgariProblemPayload,
  RuleSettings,
  ScoreQuestion,
  UserAnswer,
} from "@mahjong-scoring/core";

import {
  buildDailyProblemQuestion,
  judgeDailyProblemAnswer,
  ruleConfigOfSettings,
} from "./question";

/**
 * 222m 456p 789s 234s 東東 を 3s の嵌張でツモ。東場の東家で、東の雀頭は連風牌。
 * 連風牌の雀頭を 2 符とするか 4 符とするかで 30 符 / 40 符に割れる。
 */
const RENFONPAI_PAYLOAD: AgariProblemPayload = {
  hand: {
    closed: [1, 1, 1, 12, 13, 14, 19, 20, 21, 24, 25, 26, 27, 27],
    exposed: [],
  },
  agariHai: 20,
  isTsumo: true,
  jikaze: 27,
  bakaze: 27,
  doraMarkers: [30],
  riichi: null,
};

const RENFONPAI_4FU: RuleSettings = {
  ...DEFAULT_RULE_SETTINGS,
  renfonpaiAs4Fu: true,
};

function built(settings: RuleSettings): ScoreQuestion {
  return buildDailyProblemQuestion(RENFONPAI_PAYLOAD, settings)._unsafeUnwrap();
}

/** 問題の正解どおりの解答 */
function correctAnswerOf(question: ScoreQuestion): UserAnswer {
  const { han, fu, payment } = question.answer;
  const score =
    payment.type === "koTsumo"
      ? { scoreFromKo: payment.amount[0], scoreFromOya: payment.amount[1] }
      : { score: payment.amount };
  return { han, fu, yakus: [], ...score };
}

describe("ruleConfigOfSettings", () => {
  it("連風牌の雀頭の符・切り上げ満貫・役満ルールを写す", () => {
    expect(ruleConfigOfSettings(DEFAULT_RULE_SETTINGS)).toMatchObject({
      doubleWindJantouFu: 2,
      kiriageMangan: false,
    });
    const config = ruleConfigOfSettings({
      ...DEFAULT_RULE_SETTINGS,
      renfonpaiAs4Fu: true,
      kiriageMangan: true,
      daisuushiiDouble: true,
    });
    expect(config).toMatchObject({
      doubleWindJantouFu: 4,
      kiriageMangan: true,
      daisuushii: true,
      suuankouTanki: false,
    });
  });
});

describe("buildDailyProblemQuestion", () => {
  it("盤面は閲覧者のルール設定で組み立て直す（連風牌の設定で符が変わる）", () => {
    expect(built(DEFAULT_RULE_SETTINGS).answer.fu).toBe(30);
    expect(built(RENFONPAI_4FU).answer.fu).toBe(40);
  });

  it("和了形として成り立たない盤面は失敗を返す", () => {
    const broken: AgariProblemPayload = {
      ...RENFONPAI_PAYLOAD,
      hand: {
        closed: [1, 1, 1, 12, 13, 14, 19, 20, 21, 24, 25, 26, 27, 28],
        exposed: [],
      },
    };
    expect(
      buildDailyProblemQuestion(broken, DEFAULT_RULE_SETTINGS).isErr(),
    ).toBe(true);
  });
});

describe("judgeDailyProblemAnswer", () => {
  it("組み立てた問題の正解どおりなら正解", () => {
    const question = built(RENFONPAI_4FU);
    const result = judgeDailyProblemAnswer(
      question,
      correctAnswerOf(question),
      RENFONPAI_4FU,
    );
    expect(result.isCorrect).toBe(true);
  });

  it("別のルール設定での正解は、閲覧者の設定で組み立てた問題では不正解", () => {
    const standardAnswer = correctAnswerOf(built(DEFAULT_RULE_SETTINGS));
    const result = judgeDailyProblemAnswer(
      built(RENFONPAI_4FU),
      standardAnswer,
      RENFONPAI_4FU,
    );
    expect(result.isCorrect).toBe(false);
    expect(result.isFuCorrect).toBe(false);
  });

  describe("ダブル役満を採用する設定（四暗刻単騎をダブル役満にする）", () => {
    /** 111m 999p 111s 東東東 に 2m の単騎でツモ（南家）。四暗刻単騎 */
    const SUUANKOU_TANKI_PAYLOAD: AgariProblemPayload = {
      hand: {
        closed: [0, 0, 0, 17, 17, 17, 18, 18, 18, 27, 27, 27, 1, 1],
        exposed: [],
      },
      agariHai: 1,
      isTsumo: true,
      jikaze: 28,
      bakaze: 27,
      doraMarkers: [30],
      riichi: null,
    };
    const DOUBLE_SETTINGS: RuleSettings = {
      ...DEFAULT_RULE_SETTINGS,
      suuankouTankiDouble: true,
    };
    const question = buildDailyProblemQuestion(
      SUUANKOU_TANKI_PAYLOAD,
      DOUBLE_SETTINGS,
    )._unsafeUnwrap();

    it("ダブル役満の翻数で答えれば正解", () => {
      const result = judgeDailyProblemAnswer(
        question,
        correctAnswerOf(question),
        DOUBLE_SETTINGS,
      );
      expect(question.answer.han).toBe(26);
      expect(result.isCorrect).toBe(true);
    });

    it("役満の翻数に丸めて答えると、点数が合っていても翻数の誤りで不正解", () => {
      const result = judgeDailyProblemAnswer(
        question,
        { ...correctAnswerOf(question), han: 13 },
        DOUBLE_SETTINGS,
      );
      expect(result.isHanCorrect).toBe(false);
      expect(result.isCorrect).toBe(false);
    });
  });

  it("役は問わない（標準の判定モード）", () => {
    const question = built(DEFAULT_RULE_SETTINGS);
    const result = judgeDailyProblemAnswer(
      question,
      { ...correctAnswerOf(question), yakus: ["平和"] },
      DEFAULT_RULE_SETTINGS,
    );
    expect(result.isCorrect).toBe(true);
  });
});
