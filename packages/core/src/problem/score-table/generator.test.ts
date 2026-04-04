import { describe, it, expect } from "vitest";
import { generateScoreTableQuestion } from "./generator";
import {
  calculateKoScore,
  calculateOyaScore,
  isInvalidCell,
} from "../../core/score-calculation";

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
        expect(
          isInvalidCell(question.han, question.fu, winType),
        ).toBe(false);
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
      for (let i = 0; i < 200; i++) {
        const question = generateScoreTableQuestion();
        if (!question.isOya && !question.isTsumo) {
          const expected = calculateKoScore(question.han, question.fu);
          expect(question.correctAnswer.type).toBe("ron");
          if (question.correctAnswer.type === "ron") {
            expect(question.correctAnswer.score).toBe(expected.ron);
          }
          return;
        }
      }
      // 確率的テスト: 200回で見つからなければスキップ
      console.warn("子ロンの問題が生成されなかったためスキップ");
    });

    it("親ロンの正解が calculateOyaScore の結果と一致すること", () => {
      for (let i = 0; i < 200; i++) {
        const question = generateScoreTableQuestion();
        if (question.isOya && !question.isTsumo) {
          const expected = calculateOyaScore(question.han, question.fu);
          expect(question.correctAnswer.type).toBe("ron");
          if (question.correctAnswer.type === "ron") {
            expect(question.correctAnswer.score).toBe(expected.ron);
          }
          return;
        }
      }
      console.warn("親ロンの問題が生成されなかったためスキップ");
    });

    it("子ツモの正解が calculateKoScore の結果と一致すること", () => {
      for (let i = 0; i < 200; i++) {
        const question = generateScoreTableQuestion();
        if (!question.isOya && question.isTsumo) {
          const expected = calculateKoScore(question.han, question.fu);
          expect(question.correctAnswer.type).toBe("koTsumo");
          if (question.correctAnswer.type === "koTsumo") {
            const parts = expected.tsumo.split("/");
            expect(question.correctAnswer.scoreFromKo).toBe(
              parseInt(parts[0], 10),
            );
            expect(question.correctAnswer.scoreFromOya).toBe(
              parseInt(parts[1], 10),
            );
          }
          return;
        }
      }
      console.warn("子ツモの問題が生成されなかったためスキップ");
    });

    it("親ツモの正解が calculateOyaScore の結果と一致すること", () => {
      for (let i = 0; i < 200; i++) {
        const question = generateScoreTableQuestion();
        if (question.isOya && question.isTsumo) {
          const expected = calculateOyaScore(question.han, question.fu);
          expect(question.correctAnswer.type).toBe("oyaTsumo");
          if (question.correctAnswer.type === "oyaTsumo") {
            const tsumoNum = parseInt(
              expected.tsumo.replace(/[^\d]/g, ""),
              10,
            );
            expect(question.correctAnswer.scoreAll).toBe(tsumoNum);
          }
          return;
        }
      }
      console.warn("親ツモの問題が生成されなかったためスキップ");
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

  describe("境界値: 3翻60符（満貫未満の最高符）", () => {
    // 3翻60符: base = 60 * 2^5 = 1920 < 2000 なので満貫にはならない
    it("子ロン: 7700 点であること", () => {
      for (let i = 0; i < 100; i++) {
        const question = generateScoreTableQuestion({
          minHan: 3,
          maxHan: 3,
          minFu: 60,
          maxFu: 60,
        });
        if (!question.isOya && !question.isTsumo) {
          expect(question.correctAnswer.type).toBe("ron");
          if (question.correctAnswer.type === "ron") {
            expect(question.correctAnswer.score).toBe(7700);
          }
          return;
        }
      }
      console.warn("3翻60符の子ロンが生成されなかったためスキップ");
    });

    it("親ロン: 11600 点であること", () => {
      for (let i = 0; i < 100; i++) {
        const question = generateScoreTableQuestion({
          minHan: 3,
          maxHan: 3,
          minFu: 60,
          maxFu: 60,
        });
        if (question.isOya && !question.isTsumo) {
          expect(question.correctAnswer.type).toBe("ron");
          if (question.correctAnswer.type === "ron") {
            expect(question.correctAnswer.score).toBe(11600);
          }
          return;
        }
      }
      console.warn("3翻60符の親ロンが生成されなかったためスキップ");
    });

    it("子ツモ: 2000/3900 であること", () => {
      for (let i = 0; i < 100; i++) {
        const question = generateScoreTableQuestion({
          minHan: 3,
          maxHan: 3,
          minFu: 60,
          maxFu: 60,
        });
        if (!question.isOya && question.isTsumo) {
          expect(question.correctAnswer.type).toBe("koTsumo");
          if (question.correctAnswer.type === "koTsumo") {
            expect(question.correctAnswer.scoreFromKo).toBe(2000);
            expect(question.correctAnswer.scoreFromOya).toBe(3900);
          }
          return;
        }
      }
      console.warn("3翻60符の子ツモが生成されなかったためスキップ");
    });

    it("親ツモ: 3900 オールであること", () => {
      for (let i = 0; i < 100; i++) {
        const question = generateScoreTableQuestion({
          minHan: 3,
          maxHan: 3,
          minFu: 60,
          maxFu: 60,
        });
        if (question.isOya && question.isTsumo) {
          expect(question.correctAnswer.type).toBe("oyaTsumo");
          if (question.correctAnswer.type === "oyaTsumo") {
            expect(question.correctAnswer.scoreAll).toBe(3900);
          }
          return;
        }
      }
      console.warn("3翻60符の親ツモが生成されなかったためスキップ");
    });
  });

  describe("境界値: 3翻70符（満貫になるケース）", () => {
    // 3翻70符: base = 70 * 2^5 = 2240 >= 2000 なので満貫
    it("子ロン: 8000 点であること", () => {
      for (let i = 0; i < 100; i++) {
        const question = generateScoreTableQuestion({
          minHan: 3,
          maxHan: 3,
          minFu: 70,
          maxFu: 70,
        });
        if (!question.isOya && !question.isTsumo) {
          expect(question.correctAnswer.type).toBe("ron");
          if (question.correctAnswer.type === "ron") {
            expect(question.correctAnswer.score).toBe(8000);
          }
          return;
        }
      }
      console.warn("3翻70符の子ロンが生成されなかったためスキップ");
    });

    it("親ロン: 12000 点であること", () => {
      for (let i = 0; i < 100; i++) {
        const question = generateScoreTableQuestion({
          minHan: 3,
          maxHan: 3,
          minFu: 70,
          maxFu: 70,
        });
        if (question.isOya && !question.isTsumo) {
          expect(question.correctAnswer.type).toBe("ron");
          if (question.correctAnswer.type === "ron") {
            expect(question.correctAnswer.score).toBe(12000);
          }
          return;
        }
      }
      console.warn("3翻70符の親ロンが生成されなかったためスキップ");
    });

    it("子ツモ: 2000/4000 であること", () => {
      for (let i = 0; i < 100; i++) {
        const question = generateScoreTableQuestion({
          minHan: 3,
          maxHan: 3,
          minFu: 70,
          maxFu: 70,
        });
        if (!question.isOya && question.isTsumo) {
          expect(question.correctAnswer.type).toBe("koTsumo");
          if (question.correctAnswer.type === "koTsumo") {
            expect(question.correctAnswer.scoreFromKo).toBe(2000);
            expect(question.correctAnswer.scoreFromOya).toBe(4000);
          }
          return;
        }
      }
      console.warn("3翻70符の子ツモが生成されなかったためスキップ");
    });

    it("親ツモ: 4000 オールであること", () => {
      for (let i = 0; i < 100; i++) {
        const question = generateScoreTableQuestion({
          minHan: 3,
          maxHan: 3,
          minFu: 70,
          maxFu: 70,
        });
        if (question.isOya && question.isTsumo) {
          expect(question.correctAnswer.type).toBe("oyaTsumo");
          if (question.correctAnswer.type === "oyaTsumo") {
            expect(question.correctAnswer.scoreAll).toBe(4000);
          }
          return;
        }
      }
      console.warn("3翻70符の親ツモが生成されなかったためスキップ");
    });
  });

  describe("buildValidCombinations（間接テスト）", () => {
    it("500回生成しても無効な組み合わせが一度も出ないこと", () => {
      for (let i = 0; i < 500; i++) {
        const question = generateScoreTableQuestion();
        const winType = question.isTsumo ? "tsumo" : "ron";
        expect(
          isInvalidCell(question.han, question.fu, winType),
        ).toBe(false);
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
        expect(
          isInvalidCell(question.han, question.fu, winType),
        ).toBe(false);
      }
    });
  });
});
