import { describe, it, expect } from "vitest";
import { generateScoreTableQuestion } from "./generator";
import type { ScoreTableGeneratorOptions, ScoreTableQuestion } from "./types";
import {
  calculateKoScore,
  calculateOyaScore,
  isInvalidCell,
} from "../../core/score-calculation";

/**
 * 条件に合う問題が生成されるまで試行する
 *
 * 親子・ツモロンはランダムに決まるため、特定の組み合わせを検証するには
 * 引き当てるまで試す必要がある。見つからなければ失敗させる
 * （以前は console.warn して return していたため、生成されないと
 * テストが無言で pass していた）。
 */
function findQuestion(
  options: Readonly<ScoreTableGeneratorOptions>,
  predicate: (question: ScoreTableQuestion) => boolean,
  attempts = 200,
): ScoreTableQuestion {
  for (let i = 0; i < attempts; i++) {
    const question = generateScoreTableQuestion(options);
    if (predicate(question)) return question;
  }
  throw new Error(`${attempts} 回試行しても条件に合う問題が生成されなかった`);
}

describe("generateScoreTableQuestion", () => {
  describe("デフォルトオプションでの問題生成", () => {
    it("問題が生成できること", () => {
      const question = generateScoreTableQuestion();
      expect(question).toBeDefined();
    });

    it("id が UUID 文字列であること", () => {
      const question = generateScoreTableQuestion();
      expect(typeof question.id).toBe("string");
      expect(question.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it("isOya が boolean であること", () => {
      const question = generateScoreTableQuestion();
      expect(typeof question.isOya).toBe("boolean");
    });

    it("isTsumo が boolean であること", () => {
      const question = generateScoreTableQuestion();
      expect(typeof question.isTsumo).toBe("boolean");
    });

    it("han が 1〜3 の範囲であること", () => {
      for (let i = 0; i < 100; i++) {
        const question = generateScoreTableQuestion();
        expect(question.han).toBeGreaterThanOrEqual(1);
        expect(question.han).toBeLessThanOrEqual(3);
      }
    });

    it("fu が ALL_FU_VALUES のいずれかで 20〜60 の範囲であること", () => {
      const validFu = [20, 25, 30, 40, 50, 60];
      for (let i = 0; i < 100; i++) {
        const question = generateScoreTableQuestion();
        expect(validFu).toContain(question.fu);
      }
    });
  });

  describe("無効な組み合わせが生成されないこと", () => {
    it("100回生成しても isInvalidCell に該当する組み合わせが出ないこと", () => {
      for (let i = 0; i < 100; i++) {
        const question = generateScoreTableQuestion();
        const winType = question.isTsumo ? "tsumo" : "ron";
        expect(question.fu).toBeDefined();
        if (question.fu === undefined) continue;
        expect(isInvalidCell(question.han, question.fu, winType)).toBe(false);
      }
    });

    it("1翻20符が生成されないこと（統計的確認）", () => {
      for (let i = 0; i < 200; i++) {
        const question = generateScoreTableQuestion();
        if (question.han === 1) {
          expect(question.fu).not.toBe(20);
        }
      }
    });

    it("ロン20符が生成されないこと（統計的確認）", () => {
      for (let i = 0; i < 200; i++) {
        const question = generateScoreTableQuestion();
        if (!question.isTsumo) {
          expect(question.fu).not.toBe(20);
        }
      }
    });

    it("1翻25符が生成されないこと（統計的確認）", () => {
      for (let i = 0; i < 200; i++) {
        const question = generateScoreTableQuestion();
        if (question.han === 1) {
          expect(question.fu).not.toBe(25);
        }
      }
    });

    it("ツモ2翻25符が生成されないこと（統計的確認）", () => {
      for (let i = 0; i < 200; i++) {
        const question = generateScoreTableQuestion();
        if (question.isTsumo && question.han === 2) {
          expect(question.fu).not.toBe(25);
        }
      }
    });
  });

  describe("正解が正しく算出されること", () => {
    it("子ロンの正解が calculateKoScore の結果と一致すること", () => {
      const question = findQuestion(
        {},
        (q) => !q.isOya && !q.isTsumo && q.fu !== undefined,
      );
      const expected = calculateKoScore(question.han, question.fu!);

      expect(question.correctAnswer).toEqual({
        type: "ron",
        score: expected.ron,
      });
    });

    it("親ロンの正解が calculateOyaScore の結果と一致すること", () => {
      const question = findQuestion(
        {},
        (q) => q.isOya && !q.isTsumo && q.fu !== undefined,
      );
      const expected = calculateOyaScore(question.han, question.fu!);

      expect(question.correctAnswer).toEqual({
        type: "ron",
        score: expected.ron,
      });
    });

    it("子ツモの正解が calculateKoScore の結果と一致すること", () => {
      const question = findQuestion(
        {},
        (q) => !q.isOya && q.isTsumo && q.fu !== undefined,
      );
      const expected = calculateKoScore(question.han, question.fu!);

      expect(question.correctAnswer).toEqual({
        type: "koTsumo",
        fromKo: (expected.tsumo as { fromKo: number }).fromKo,
        fromOya: (expected.tsumo as { fromOya: number }).fromOya,
      });
    });

    it("親ツモの正解が calculateOyaScore の結果と一致すること", () => {
      const question = findQuestion(
        {},
        (q) => q.isOya && q.isTsumo && q.fu !== undefined,
      );
      const expected = calculateOyaScore(question.han, question.fu!);

      expect(question.correctAnswer).toEqual({
        type: "oyaTsumo",
        all: (expected.tsumo as { all: number }).all,
      });
    });
  });

  describe("カスタムオプション", () => {
    it("minHan/maxHan/minFu/maxFu を固定すると常にその値が生成されること", () => {
      for (let i = 0; i < 50; i++) {
        const question = generateScoreTableQuestion({
          minHan: 2,
          maxHan: 2,
          minFu: 30,
          maxFu: 30,
        });
        expect(question.han).toBe(2);
        expect(question.fu).toBe(30);
      }
    });

    it("翻数範囲を広げた場合その範囲内で生成されること", () => {
      for (let i = 0; i < 100; i++) {
        const question = generateScoreTableQuestion({
          minHan: 1,
          maxHan: 3,
          minFu: 30,
          maxFu: 50,
        });
        expect(question.han).toBeGreaterThanOrEqual(1);
        expect(question.han).toBeLessThanOrEqual(3);
        expect(question.fu).toBeGreaterThanOrEqual(30);
        expect(question.fu).toBeLessThanOrEqual(50);
      }
    });
  });

  describe.each([
    {
      label: "3翻60符（満貫未満の最高符）",
      // base = 60 * 2^5 = 1920 < 2000 なので満貫にはならない
      fu: 60,
      koRon: 7700,
      oyaRon: 11600,
      koTsumo: [2000, 3900] as const,
      oyaTsumoAll: 3900,
    },
    {
      label: "3翻70符（満貫になるケース）",
      // base = 70 * 2^5 = 2240 >= 2000 なので満貫
      fu: 70,
      koRon: 8000,
      oyaRon: 12000,
      koTsumo: [2000, 4000] as const,
      oyaTsumoAll: 4000,
    },
  ])("境界値: $label", ({ fu, koRon, oyaRon, koTsumo, oyaTsumoAll }) => {
    const options = { minHan: 3, maxHan: 3, minFu: fu, maxFu: fu };

    it("子ロン", () => {
      const question = findQuestion(options, (q) => !q.isOya && !q.isTsumo);
      expect(question.correctAnswer).toEqual({ type: "ron", score: koRon });
    });

    it("親ロン", () => {
      const question = findQuestion(options, (q) => q.isOya && !q.isTsumo);
      expect(question.correctAnswer).toEqual({ type: "ron", score: oyaRon });
    });

    it("子ツモ", () => {
      const question = findQuestion(options, (q) => !q.isOya && q.isTsumo);
      expect(question.correctAnswer).toEqual({
        type: "koTsumo",
        fromKo: koTsumo[0],
        fromOya: koTsumo[1],
      });
    });

    it("親ツモ", () => {
      const question = findQuestion(options, (q) => q.isOya && q.isTsumo);
      expect(question.correctAnswer).toEqual({
        type: "oyaTsumo",
        all: oyaTsumoAll,
      });
    });
  });

  describe("役割・和了方法の絞り込み", () => {
    it("roles を ko に限定すると常に子が生成されること", () => {
      for (let i = 0; i < 100; i++) {
        const question = generateScoreTableQuestion({ roles: ["ko"] });
        expect(question.isOya).toBe(false);
      }
    });

    it("wins を ron に限定すると常にロンが生成されること", () => {
      for (let i = 0; i < 100; i++) {
        const question = generateScoreTableQuestion({ wins: ["ron"] });
        expect(question.isTsumo).toBe(false);
      }
    });
  });

  describe("満貫以上の出題（ranges: manganPlus）", () => {
    it("翻数が 5〜13、符は undefined であること", () => {
      for (let i = 0; i < 100; i++) {
        const question = generateScoreTableQuestion({ ranges: ["manganPlus"] });
        expect(question.han).toBeGreaterThanOrEqual(5);
        expect(question.han).toBeLessThanOrEqual(13);
        expect(question.fu).toBeUndefined();
      }
    });

    it("子ロン満貫(5翻)は 8000、跳満(6翻)は 12000 であること", () => {
      const scores = new Map<number, number>();
      for (let i = 0; i < 500 && scores.size < 2; i++) {
        const q = generateScoreTableQuestion({
          roles: ["ko"],
          wins: ["ron"],
          ranges: ["manganPlus"],
        });
        if (q.correctAnswer.type === "ron" && (q.han === 5 || q.han === 6)) {
          scores.set(q.han, q.correctAnswer.score);
        }
      }
      expect(scores.get(5)).toBe(8000);
      expect(scores.get(6)).toBe(12000);
    });

    it("親ツモ満貫(5翻)は 4000 オールであること", () => {
      const question = findQuestion(
        { roles: ["oya"], wins: ["tsumo"], ranges: ["manganPlus"] },
        (q) => q.han === 5,
        500,
      );

      expect(question.correctAnswer).toEqual({
        type: "oyaTsumo",
        all: 4000,
      });
    });

    it("子ツモ倍満(8翻)は 4000/8000 であること", () => {
      const question = findQuestion(
        { roles: ["ko"], wins: ["tsumo"], ranges: ["manganPlus"] },
        (q) => q.han === 8,
        500,
      );

      expect(question.correctAnswer).toEqual({
        type: "koTsumo",
        fromKo: 4000,
        fromOya: 8000,
      });
    });
  });

  describe("buildValidCombinations（間接テスト）", () => {
    it("500回生成しても無効な組み合わせが一度も出ないこと", () => {
      for (let i = 0; i < 500; i++) {
        const question = generateScoreTableQuestion();
        const winType = question.isTsumo ? "tsumo" : "ron";
        expect(question.fu).toBeDefined();
        if (question.fu === undefined) continue;
        expect(isInvalidCell(question.han, question.fu, winType)).toBe(false);
      }
    });

    it("カスタム範囲でも無効な組み合わせが出ないこと", () => {
      for (let i = 0; i < 200; i++) {
        const question = generateScoreTableQuestion({
          minHan: 1,
          maxHan: 3,
          minFu: 20,
          maxFu: 110,
        });
        const winType = question.isTsumo ? "tsumo" : "ron";
        expect(question.fu).toBeDefined();
        if (question.fu === undefined) continue;
        expect(isInvalidCell(question.han, question.fu, winType)).toBe(false);
      }
    });
  });
});
