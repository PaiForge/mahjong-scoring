import { describe, it, expect } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";
import { generateScoreQuestion, generateValidScoreQuestion } from "./generator";
import { SCORE_FILTERABLE_YAKU } from "./filterable-yaku";
import { ScoreLevel } from "../../core/constants";
import { isMangan, MANGAN_MIN_HAN } from "../../score/tiers";
import { expectGeneratesEventually, expectSampled } from "../../test/sampling";

describe("generateScoreQuestion", () => {
  it("試行すれば問題が生成される", () => {
    expectGeneratesEventually(generateScoreQuestion);
  });

  it("生成された問題が正しい構造を持つ", () => {
    const question = generateValidScoreQuestion();
    expect(question).toBeDefined();
    if (!question) return;

    expect(question.tehai).toBeDefined();
    expect(question.tehai.closed).toBeDefined();
    expect(question.tehai.exposed).toBeDefined();
    expect(typeof question.agariHai).toBe("number");
    expect(question.agariHai).toBeGreaterThanOrEqual(0);
    expect(question.agariHai).toBeLessThanOrEqual(33);
    expect(typeof question.isTsumo).toBe("boolean");
    expect(typeof question.jikaze).toBe("number");
    expect(typeof question.bakaze).toBe("number");
    expect(Array.isArray(question.doraMarkers)).toBe(true);
    expect(question.doraMarkers.length).toBeGreaterThanOrEqual(1);
  });

  it("answer に有効な翻数・符・支払い情報が含まれる", () => {
    const question = generateValidScoreQuestion();
    expect(question).toBeDefined();
    if (!question) return;

    expect(question.answer.han).toBeGreaterThanOrEqual(1);
    expect(question.answer.fu).toBeGreaterThanOrEqual(20);
    expect(question.answer.scoreLevel).toBeDefined();
    expect(question.answer.payment).toBeDefined();
    expect(["ron", "oyaTsumo", "koTsumo"]).toContain(
      question.answer.payment.type,
    );
  });

  it("yakuDetails が定義されている場合、少なくとも1つの役がある", () => {
    const questions = expectSampled(generateScoreQuestion, {
      attempts: 200,
      where: (q) => q.yakuDetails !== undefined,
    });

    for (const question of questions) {
      expect(question.yakuDetails!.length).toBeGreaterThan(0);
      for (const yaku of question.yakuDetails!) {
        expect(yaku.name).toBeTruthy();
        expect(yaku.han).toBeGreaterThanOrEqual(1);
      }
    }
  });

  describe("オプション: includeParent / includeChild", () => {
    it("includeParent=false の場合、自風が東にならない", () => {
      const questions = expectSampled(
        () =>
          generateScoreQuestion({ includeParent: false, includeChild: true }),
        { attempts: 200 },
      );

      for (const question of questions) {
        expect(question.jikaze).not.toBe(HaiKind.Ton);
      }
    });

    it("includeChild=false の場合、自風が東になる", () => {
      const questions = expectSampled(
        () =>
          generateScoreQuestion({ includeParent: true, includeChild: false }),
        { attempts: 200 },
      );

      for (const question of questions) {
        expect(question.jikaze).toBe(HaiKind.Ton);
      }
    });
  });

  describe("オプション: allowedRanges", () => {
    it("nonMangan のみの場合、通常点数の問題のみ生成される", () => {
      const questions = expectSampled(
        () => generateScoreQuestion({ allowedRanges: ["nonMangan"] }),
        { attempts: 300, need: 5 },
      );

      for (const question of questions) {
        expect(question.answer.scoreLevel).toBe(ScoreLevel.Normal);
      }
    });

    it("manganPlus のみの場合、満貫以上の問題のみ生成される", () => {
      const questions = expectSampled(
        () => generateScoreQuestion({ allowedRanges: ["manganPlus"] }),
        { attempts: 300, need: 5 },
      );

      for (const question of questions) {
        expect(isMangan(question.answer.scoreLevel)).toBe(true);
      }
    });
  });

  describe("オプション: minHan", () => {
    it("minHan 以上の翻数の問題のみ生成される", () => {
      const questions = expectSampled(
        () =>
          generateScoreQuestion({
            allowedRanges: ["manganPlus"],
            minHan: MANGAN_MIN_HAN,
          }),
        { attempts: 1000, need: 5 },
      );

      for (const question of questions) {
        expect(question.answer.han).toBeGreaterThanOrEqual(MANGAN_MIN_HAN);
      }
    });

    it("minHan 未指定の場合、manganPlus には符由来の満貫（4翻以下）も含まれる", () => {
      // minHan が存在する理由の裏付け: 絞らなければ 4翻以下の満貫が出題される
      const questions = expectSampled(
        () => generateScoreQuestion({ allowedRanges: ["manganPlus"] }),
        {
          attempts: 3000,
          need: 1,
          where: (q) => q.answer.han < MANGAN_MIN_HAN,
        },
      );

      expect(questions.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("generateValidScoreQuestion", () => {
  it("デフォルトオプションで有効な問題を生成する", () => {
    const question = generateValidScoreQuestion();
    expect(question).toBeDefined();
  });

  it("maxRetries=1 でも生成を試みる", () => {
    // 1回で生成できない場合もあるが、undefined か ScoreQuestion のいずれかを返す
    const question = generateValidScoreQuestion({}, 1);
    // 型チェックのみ（undefined or ScoreQuestion）
    expect(question === undefined || typeof question === "object").toBe(true);
  });

  it("リーチフラグが true の問題は必ず立直の翻と裏ドラ表示牌を持つ", () => {
    // 出題（isRiichi の表示）と正解（yakuDetails・点数）が食い違わないこと。
    // リーチの抽選が generator の1箇所に閉じている限り、例外は無い。
    const riichiQuestions = expectSampled(generateValidScoreQuestion, {
      need: 5,
      attempts: 1000,
      where: (q) => q.isRiichi === true,
    });

    for (const question of riichiQuestions) {
      expect(
        question.yakuDetails?.some(
          (y) => y.name === "立直" || y.name === "ダブル立直",
        ),
      ).toBe(true);
      expect(question.uraDoraMarkers).toBeDefined();
    }
  });

  it("ドラ表示牌は有効な HaiKindId（0-33）である", () => {
    const questions = expectSampled(generateValidScoreQuestion);

    for (const question of questions) {
      for (const marker of question.doraMarkers) {
        expect(marker).toBeGreaterThanOrEqual(0);
        expect(marker).toBeLessThanOrEqual(33);
      }
    }
  });
});

describe("オプション: requiredYaku", () => {
  it("指定した役が成立する問題のみ生成される", () => {
    for (let i = 0; i < 20; i++) {
      const question = generateValidScoreQuestion(
        { requiredYaku: ["平和"] },
        500,
      );
      expect(question).toBeDefined();
      const names = (question?.yakuDetails ?? []).map((yaku) => yaku.name);
      expect(names).toContain("平和");
    }
  });

  it("複数指定は OR で解釈される（いずれかが成立していれば通る）", () => {
    const targets = ["平和", "対々和"] as const;
    for (let i = 0; i < 20; i++) {
      const question = generateValidScoreQuestion(
        { requiredYaku: [...targets] },
        500,
      );
      expect(question).toBeDefined();
      const names = new Set(
        (question?.yakuDetails ?? []).map((yaku) => yaku.name),
      );
      expect(targets.some((target) => names.has(target))).toBe(true);
    }
  });

  it("七対子は includeChiitoi 無しでも requiredYaku だけで出せる", () => {
    // 七対子は既定の生成対象外（面子手しか作らない）。名指しされたときだけ
    // 生成経路が開く、という generator.ts の分岐がここで固定される。
    for (let i = 0; i < 20; i++) {
      const question = generateValidScoreQuestion(
        { requiredYaku: ["七対子"] },
        500,
      );
      expect(question).toBeDefined();
      const names = (question?.yakuDetails ?? []).map((yaku) => yaku.name);
      expect(names).toContain("七対子");
    }
  });

  it("成立し得ない役名を指定すると生成に失敗する", () => {
    const question = generateValidScoreQuestion(
      { requiredYaku: ["存在しない役"] },
      50,
    );
    expect(question).toBeUndefined();
  });

  it("空配列は「絞り込まない」として扱う", () => {
    const question = generateValidScoreQuestion({ requiredYaku: [] });
    expect(question).toBeDefined();
  });

  it("SCORE_FILTERABLE_YAKU のすべての役はリトライ500回以内に生成できる", () => {
    // allowlist の収録基準（既定条件で出現率2%以上）の実効性を担保する。
    // 生成器の分布を変えてこのテストが落ちた場合は filterable-yaku.ts の
    // 実測を取り直して収録役を見直すこと。
    for (const yaku of SCORE_FILTERABLE_YAKU) {
      const question = generateValidScoreQuestion(
        { requiredYaku: [yaku] },
        500,
      );
      expect(question, `役「${yaku}」の問題を生成できない`).toBeDefined();
    }
  });
});
