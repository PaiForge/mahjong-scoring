import {
  HaiKind,
  MANGAN_MIN_HAN,
  generateValidScoreQuestion,
} from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { generateOrThrow } from "../test/generate-or-throw";

import { buildDemoScoreQuestion } from "../board/demo-score-question";
import {
  parseQuestionResults,
  restoreScoreQuestion,
  toScoreQuestionResult,
  toScoreQuestionSnapshot,
} from "./score-question-result";

describe("parseQuestionResults", () => {
  const validResult = {
    isOya: true,
    isTsumo: false,
    han: 3,
    fu: 40,
    correctAnswer: { type: "ron", score: 7700 },
    userAnswer: { type: "ron", score: 7700 },
    outcome: "correct",
  };

  it("有効な JSON 文字列をパースできる", () => {
    const raw = [validResult];
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
      outcome: "correct",
    };
    const raw = [validResult, koTsumoResult];
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
      outcome: "correct",
    };
    const raw = [oyaTsumoResult];
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]?.correctAnswer.type).toBe("oyaTsumo");
  });

  it("回答の支払い額が欠落した要素はフィルタされる", () => {
    // 判別子（type）だけを見ていた頃は素通りし、結果ページで点数が
    // undefined として描かれていた
    const invalid = { ...validResult, correctAnswer: { type: "ron" } };
    const raw = [invalid];
    expect(parseQuestionResults(raw)).toEqual([]);
  });

  it("回答の支払い額が判別子と食い違う要素はフィルタされる", () => {
    // koTsumo なのに oyaTsumo の形（all）を持つ行
    const invalid = {
      ...validResult,
      userAnswer: { type: "koTsumo", all: 4000 },
    };
    const raw = [invalid];
    expect(parseQuestionResults(raw)).toEqual([]);
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
    const results = parseQuestionResults({ foo: "bar" });
    expect(results).toEqual([]);
  });

  it("文字列の JSON は空配列を返す", () => {
    const results = parseQuestionResults("hello");
    expect(results).toEqual([]);
  });

  it("isOya が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "isOya");
    const raw = [invalid];
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("isTsumo が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "isTsumo");
    const raw = [invalid];
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("han が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "han");
    const raw = [invalid];
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("fu が欠落した要素は満貫以上として許容される", () => {
    // 満貫以上の問題は符を持たないため、fu の欠落は妥当な結果とみなす。
    const manganPlus = { ...validResult };
    Reflect.deleteProperty(manganPlus, "fu");
    const raw = [manganPlus];
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]!.fu).toBeUndefined();
  });

  it("fu が数値でない（文字列等）要素はフィルタされる", () => {
    const invalid = { ...validResult, fu: "30" };
    const raw = [invalid];
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("outcome が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "outcome");
    const raw = [invalid];
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("correctAnswer が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "correctAnswer");
    const raw = [invalid];
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("userAnswer が欠落した要素は時間切れ（回答なし）として許容される", () => {
    const timeUp = { ...validResult, outcome: "timeUp" };
    Reflect.deleteProperty(timeUp, "userAnswer");
    const results = parseQuestionResults([timeUp]);
    expect(results).toHaveLength(1);
  });

  it("correctAnswer の type が不正な要素はフィルタされる", () => {
    const invalid = {
      ...validResult,
      correctAnswer: { type: "invalid", score: 1000 },
    };
    const raw = [invalid];
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("userAnswer の type が不正な要素はフィルタされる", () => {
    const invalid = {
      ...validResult,
      userAnswer: { type: "unknown", score: 1000 },
    };
    const raw = [invalid];
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("有効な要素と無効な要素が混在する場合、有効な要素のみ返す", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "han");
    const raw = [validResult, invalid];
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });

  it("han が文字列の場合はフィルタされる", () => {
    const invalid = { ...validResult, han: "3" };
    const raw = [invalid];
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("isOya が文字列の場合はフィルタされる", () => {
    const invalid = { ...validResult, isOya: "true" };
    const raw = [invalid];
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("null 要素はフィルタされる", () => {
    const raw = [null, validResult];
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(1);
  });

  it("数値要素はフィルタされる", () => {
    const raw = [42, validResult];
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
      yakuDetails: [
        { name: "立直", han: 1 },
        { name: "清一色", han: 6 },
      ],
      ruleConfig: { doubleWindJantouFu: 2, kiriageMangan: false },
    };

    it("スナップショット付きの結果をパースできる", () => {
      const raw = [{ ...validResult, question: validSnapshot }];
      const results = parseQuestionResults(raw);
      expect(results).toHaveLength(1);
      expect(results[0]?.question).toEqual(validSnapshot);
    });

    it("スナップショットを持たない結果（点数表早引き）もパースできる", () => {
      const results = parseQuestionResults([validResult]);
      expect(results).toHaveLength(1);
      expect(results[0]?.question).toBeUndefined();
    });

    it("uraDoraMarkers が無い（リーチしていない）スナップショットも許容される", () => {
      const { uraDoraMarkers: _omitted, ...snapshot } = validSnapshot;
      const raw = [
        { ...validResult, question: { ...snapshot, isRiichi: false } },
      ];
      const results = parseQuestionResults(raw);
      expect(results).toHaveLength(1);
    });

    it.each(["isRiichi", "yakuDetails", "ruleConfig"] as const)(
      "%s が欠落したスナップショットを持つ要素はフィルタされる",
      (key) => {
        const snapshot = { ...validSnapshot };
        Reflect.deleteProperty(snapshot, key);
        expect(
          parseQuestionResults([{ ...validResult, question: snapshot }]),
        ).toEqual([]);
      },
    );

    it("役の内訳の形が壊れているスナップショットを持つ要素はフィルタされる", () => {
      const invalid = {
        ...validResult,
        question: { ...validSnapshot, yakuDetails: [{ name: "立直" }] },
      };
      const raw = [invalid];
      expect(parseQuestionResults(raw)).toEqual([]);
    });

    it("符の内訳の形が壊れているスナップショットを持つ要素はフィルタされる", () => {
      const invalid = {
        ...validResult,
        question: { ...validSnapshot, fuDetails: [{ reason: "副底" }] },
      };
      expect(parseQuestionResults([invalid])).toEqual([]);
    });

    it("tehai が文字列でないスナップショットを持つ要素はフィルタされる", () => {
      const invalid = {
        ...validResult,
        question: { ...validSnapshot, tehai: 42 },
      };
      const raw = [invalid];
      expect(parseQuestionResults(raw)).toEqual([]);
    });

    it("doraMarkers に文字列以外を含むスナップショットを持つ要素はフィルタされる", () => {
      const invalid = {
        ...validResult,
        question: { ...validSnapshot, doraMarkers: ["1m", 3] },
      };
      const raw = [invalid];
      expect(parseQuestionResults(raw)).toEqual([]);
    });

    it("doraMarkers が欠落したスナップショットを持つ要素はフィルタされる", () => {
      const invalid = { ...validResult, question: { ...validSnapshot } };
      Reflect.deleteProperty(invalid.question, "doraMarkers");
      const raw = [invalid];
      expect(parseQuestionResults(raw)).toEqual([]);
    });
  });
});

describe("toScoreQuestionSnapshot", () => {
  it("出題を MPSZ 文字列のスナップショットに変換する", () => {
    const question = buildDemoScoreQuestion({
      doraMarkers: [HaiKind.ManZu1],
      isRiichi: true,
      uraDoraMarkers: [HaiKind.PinZu9],
    });
    const snapshot = toScoreQuestionSnapshot(question);
    expect(snapshot).toEqual({
      tehai: "234567m345p55678s",
      agariHai: "3p",
      bakaze: "1z",
      jikaze: "2z",
      doraMarkers: ["1m"],
      isRiichi: true,
      uraDoraMarkers: ["9p"],
      // 役の内訳は結果ページの翻数内訳に使う。デモ出題は役一覧を持たないので空
      yakuDetails: [],
    });
  });

  it("採点に使ったルール設定を保存し、復元した出題に引き継ぐ", () => {
    const question = generateOrThrow(() =>
      generateValidScoreQuestion({ renfonpaiAs4Fu: true, kiriageMangan: true }),
    );
    const snapshot = toScoreQuestionSnapshot(question);

    expect(snapshot.ruleConfig).toEqual(question.ruleConfig);
    expect(snapshot.ruleConfig.doubleWindJantouFu).toBe(4);

    const parsed = parseQuestionResults([
      { ...toScoreQuestionResult(question, undefined) },
    ]);
    const restored = parsed[0]?.question;
    expect(restored?.ruleConfig).toEqual(question.ruleConfig);
    expect(restored).toBeDefined();
    expect(
      restoreScoreQuestion(restored!, question.isTsumo)?.ruleConfig,
    ).toEqual(question.ruleConfig);
  });

  it("満貫未満の出題は符の内訳を保存し、パースを経ても残る", () => {
    const question = generateOrThrow(() =>
      generateValidScoreQuestion({ allowedRanges: ["nonMangan"] }),
    );
    const snapshot = toScoreQuestionSnapshot(question);

    expect(snapshot.fuDetails).toEqual(question.fuDetails);
    const parsed = parseQuestionResults([
      { ...toScoreQuestionResult(question, undefined) },
    ]);
    expect(parsed[0]?.question?.fuDetails).toEqual(question.fuDetails);
  });

  it("符で満貫に届いた出題（4翻以下）は満貫になった理由として符の内訳を保存する", () => {
    const question = generateOrThrow(() => {
      const candidate = generateValidScoreQuestion({
        allowedRanges: ["manganPlus"],
      });
      return candidate !== undefined && candidate.answer.han < MANGAN_MIN_HAN
        ? candidate
        : undefined;
    });
    expect(question.fuDetails).toBeDefined();
    expect(toScoreQuestionSnapshot(question).fuDetails).toEqual(
      question.fuDetails,
    );
  });

  it("5翻以上の出題は符が点数に効かないため符の内訳を保存しない", () => {
    const question = generateOrThrow(() =>
      generateValidScoreQuestion({
        allowedRanges: ["manganPlus"],
        minHan: MANGAN_MIN_HAN,
      }),
    );
    expect(question.fuDetails).toBeDefined();
    expect(toScoreQuestionSnapshot(question).fuDetails).toBeUndefined();
  });

  it("変換結果はパーサーのバリデーションを通過する", () => {
    const question = generateOrThrow(() =>
      generateValidScoreQuestion({ allowedRanges: ["manganPlus"] }),
    );
    const result = {
      isOya: false,
      isTsumo: true,
      han: 5,
      correctAnswer: { type: "koTsumo", fromKo: 2000, fromOya: 4000 },
      userAnswer: { type: "koTsumo", fromKo: 2000, fromOya: 4000 },
      outcome: "correct",
      yakumanMultiplier: 0,
      question: toScoreQuestionSnapshot(question),
    };
    // JSON.stringify が undefined の任意項目を落とした形が実際の保存形
    const results = parseQuestionResults([JSON.parse(JSON.stringify(result))]);
    expect(results).toHaveLength(1);
    expect(results[0]?.question?.tehai).toBe(result.question.tehai);
  });
});

describe("toScoreQuestionResult", () => {
  it("正解の支払いを答えれば正解として記録し、出題を残す", () => {
    const question = generateOrThrow(() => generateValidScoreQuestion());
    const correct = toScoreQuestionResult(question, undefined).correctAnswer;
    const result = toScoreQuestionResult(question, correct);

    expect(result.outcome).toBe("correct");
    expect(result.userAnswer).toEqual(correct);
    expect(result.han).toBe(question.answer.han);
    expect(result.question?.tehai).toBeDefined();
    expect(parseQuestionResults([result])).toHaveLength(1);
  });

  it("違う支払いを答えれば不正解として記録する", () => {
    const question = generateOrThrow(() => generateValidScoreQuestion());
    const result = toScoreQuestionResult(question, { type: "ron", score: 1 });

    expect(result.outcome).toBe("incorrect");
  });

  it("回答なし（時間切れ）は outcome=timeUp で記録し、パースを通過する", () => {
    const question = generateOrThrow(() => generateValidScoreQuestion());
    const result = toScoreQuestionResult(question, undefined);

    expect(result.outcome).toBe("timeUp");
    expect(result.userAnswer).toBeUndefined();
    expect(parseQuestionResults([result])).toHaveLength(1);
  });
});
