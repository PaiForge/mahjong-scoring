import { HaiKind } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { buildDemoScoreQuestion } from "../demo-score-question";
import {
  parseQuestionResults,
  toScoreQuestionSnapshot,
} from "../score-question-result";

describe("parseQuestionResults", () => {
  const validResult = {
    isOya: true,
    isTsumo: false,
    han: 3,
    fu: 40,
    correctAnswer: { type: "ron", score: 7700 },
    userAnswer: { type: "ron", score: 7700 },
    isCorrect: true,
  };

  it("有効な JSON 文字列をパースできる", () => {
    const raw = JSON.stringify([validResult]);
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });

  it("複数件の結果をパースできる", () => {
    const koTsumoResult = {
      isOya: false,
      isTsumo: true,
      han: 2,
      fu: 30,
      correctAnswer: { type: "koTsumo", fromKo: 1000, fromOya: 2000 },
      userAnswer: { type: "koTsumo", fromKo: 1000, fromOya: 2000 },
      isCorrect: true,
    };
    const raw = JSON.stringify([validResult, koTsumoResult]);
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(2);
  });

  it("oyaTsumo タイプの回答を含む結果をパースできる", () => {
    const oyaTsumoResult = {
      isOya: true,
      isTsumo: true,
      han: 3,
      fu: 30,
      correctAnswer: { type: "oyaTsumo", all: 4000 },
      userAnswer: { type: "oyaTsumo", all: 4000 },
      isCorrect: true,
    };
    const raw = JSON.stringify([oyaTsumoResult]);
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]?.correctAnswer.type).toBe("oyaTsumo");
  });

  it("undefined を渡すと空配列を返す", () => {
    const results = parseQuestionResults(undefined);
    expect(results).toEqual([]);
  });

  it("空配列の JSON 文字列は空配列を返す", () => {
    const results = parseQuestionResults("[]");
    expect(results).toEqual([]);
  });

  it("不正な JSON 文字列は空配列を返す", () => {
    const results = parseQuestionResults("not-json");
    expect(results).toEqual([]);
  });

  it("配列でない JSON は空配列を返す", () => {
    const results = parseQuestionResults(JSON.stringify({ foo: "bar" }));
    expect(results).toEqual([]);
  });

  it("文字列の JSON は空配列を返す", () => {
    const results = parseQuestionResults(JSON.stringify("hello"));
    expect(results).toEqual([]);
  });

  it("isOya が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "isOya");
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("isTsumo が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "isTsumo");
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("han が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "han");
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("fu が欠落した要素は満貫以上として許容される", () => {
    // 満貫以上の問題は符を持たないため、fu の欠落は妥当な結果とみなす。
    const manganPlus = { ...validResult };
    Reflect.deleteProperty(manganPlus, "fu");
    const raw = JSON.stringify([manganPlus]);
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]!.fu).toBeUndefined();
  });

  it("fu が数値でない（文字列等）要素はフィルタされる", () => {
    const invalid = { ...validResult, fu: "30" };
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("isCorrect が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "isCorrect");
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("correctAnswer が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "correctAnswer");
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("userAnswer が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "userAnswer");
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("correctAnswer の type が不正な要素はフィルタされる", () => {
    const invalid = {
      ...validResult,
      correctAnswer: { type: "invalid", score: 1000 },
    };
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("userAnswer の type が不正な要素はフィルタされる", () => {
    const invalid = {
      ...validResult,
      userAnswer: { type: "unknown", score: 1000 },
    };
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("有効な要素と無効な要素が混在する場合、有効な要素のみ返す", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "han");
    const raw = JSON.stringify([validResult, invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });

  it("han が文字列の場合はフィルタされる", () => {
    const invalid = { ...validResult, han: "3" };
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("isOya が文字列の場合はフィルタされる", () => {
    const invalid = { ...validResult, isOya: "true" };
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("null 要素はフィルタされる", () => {
    const raw = JSON.stringify([null, validResult]);
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(1);
  });

  it("数値要素はフィルタされる", () => {
    const raw = JSON.stringify([42, validResult]);
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(1);
  });

  describe("question スナップショット", () => {
    const validSnapshot = {
      tehai: "234567m345p55678s",
      agariHai: "3p",
      bakaze: "1z",
      jikaze: "2z",
      doraMarkers: ["1m"],
      isRiichi: true,
      uraDoraMarkers: ["5s"],
    };

    it("スナップショット付きの結果をパースできる", () => {
      const raw = JSON.stringify([{ ...validResult, question: validSnapshot }]);
      const results = parseQuestionResults(raw);
      expect(results).toHaveLength(1);
      expect(results[0]?.question).toEqual(validSnapshot);
    });

    it("isRiichi と uraDoraMarkers が無いスナップショットも許容される", () => {
      const snapshot = {
        tehai: validSnapshot.tehai,
        agariHai: validSnapshot.agariHai,
        bakaze: validSnapshot.bakaze,
        jikaze: validSnapshot.jikaze,
        doraMarkers: validSnapshot.doraMarkers,
      };
      const raw = JSON.stringify([{ ...validResult, question: snapshot }]);
      const results = parseQuestionResults(raw);
      expect(results).toHaveLength(1);
    });

    it("役の内訳を持つスナップショットをパースできる", () => {
      const snapshot = {
        ...validSnapshot,
        yakuDetails: [
          { name: "立直", han: 1 },
          { name: "清一色", han: 6 },
        ],
      };
      const raw = JSON.stringify([{ ...validResult, question: snapshot }]);
      const results = parseQuestionResults(raw);
      expect(results[0]?.question?.yakuDetails).toEqual(snapshot.yakuDetails);
    });

    it("役の内訳が無いスナップショット（旧データ）も許容される", () => {
      const raw = JSON.stringify([{ ...validResult, question: validSnapshot }]);
      const results = parseQuestionResults(raw);
      expect(results).toHaveLength(1);
      expect(results[0]?.question?.yakuDetails).toBeUndefined();
    });

    it("役の内訳の形が壊れているスナップショットを持つ要素はフィルタされる", () => {
      const invalid = {
        ...validResult,
        question: { ...validSnapshot, yakuDetails: [{ name: "立直" }] },
      };
      const raw = JSON.stringify([invalid]);
      expect(parseQuestionResults(raw)).toEqual([]);
    });

    it("tehai が文字列でないスナップショットを持つ要素はフィルタされる", () => {
      const invalid = {
        ...validResult,
        question: { ...validSnapshot, tehai: 42 },
      };
      const raw = JSON.stringify([invalid]);
      expect(parseQuestionResults(raw)).toEqual([]);
    });

    it("doraMarkers に文字列以外を含むスナップショットを持つ要素はフィルタされる", () => {
      const invalid = {
        ...validResult,
        question: { ...validSnapshot, doraMarkers: ["1m", 3] },
      };
      const raw = JSON.stringify([invalid]);
      expect(parseQuestionResults(raw)).toEqual([]);
    });

    it("doraMarkers が欠落したスナップショットを持つ要素はフィルタされる", () => {
      const invalid = { ...validResult, question: { ...validSnapshot } };
      Reflect.deleteProperty(invalid.question, "doraMarkers");
      const raw = JSON.stringify([invalid]);
      expect(parseQuestionResults(raw)).toEqual([]);
    });
  });
});

describe("toScoreQuestionSnapshot", () => {
  it("出題を MSPZ 文字列のスナップショットに変換する", () => {
    const question = buildDemoScoreQuestion({
      doraMarkers: [HaiKind.ManZu1],
      isRiichi: true,
    });
    const snapshot = toScoreQuestionSnapshot(question);
    expect(snapshot).toEqual({
      tehai: "234567m345p55678s",
      agariHai: "3p",
      bakaze: "1z",
      jikaze: "2z",
      doraMarkers: ["1m"],
      isRiichi: true,
      uraDoraMarkers: undefined,
      // 役の内訳は結果ページの翻数内訳に使う。持たない出題では空配列
      yakuDetails: question.yakuDetails ?? [],
    });
  });

  it("変換結果はパーサーのバリデーションを通過する", () => {
    const question = buildDemoScoreQuestion({
      doraMarkers: [HaiKind.SouZu1],
      isRiichi: false,
    });
    const result = {
      isOya: false,
      isTsumo: true,
      han: 5,
      correctAnswer: { type: "koTsumo", fromKo: 2000, fromOya: 4000 },
      userAnswer: { type: "koTsumo", fromKo: 2000, fromOya: 4000 },
      isCorrect: true,
      question: toScoreQuestionSnapshot(question),
    };
    // JSON.stringify が undefined の任意項目を落とした形が実際の保存形
    const results = parseQuestionResults(JSON.stringify([result]));
    expect(results).toHaveLength(1);
    expect(results[0]?.question?.tehai).toBe("234567m345p55678s");
  });
});
