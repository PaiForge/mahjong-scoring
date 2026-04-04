import { describe, expect, it } from "vitest";

import type { Payment } from "@mahjong-scoring/core";
import { paymentToScoreTableAnswer } from "../types";

describe("paymentToScoreTableAnswer", () => {
  describe("ron", () => {
    it("ロン支払いを ScoreTableAnswer に変換する", () => {
      const payment: Payment = { type: "ron", amount: 3900 };
      const result = paymentToScoreTableAnswer(payment);
      expect(result).toEqual({ type: "ron", score: 3900 });
    });

    it("ロン 1000点", () => {
      const payment: Payment = { type: "ron", amount: 1000 };
      const result = paymentToScoreTableAnswer(payment);
      expect(result).toEqual({ type: "ron", score: 1000 });
    });

    it("ロン 12000点（満貫）", () => {
      const payment: Payment = { type: "ron", amount: 12000 };
      const result = paymentToScoreTableAnswer(payment);
      expect(result).toEqual({ type: "ron", score: 12000 });
    });
  });

  describe("oyaTsumo", () => {
    it("親ツモ支払いを ScoreTableAnswer に変換する", () => {
      const payment: Payment = { type: "oyaTsumo", amount: 4000 };
      const result = paymentToScoreTableAnswer(payment);
      expect(result).toEqual({ type: "oyaTsumo", scoreAll: 4000 });
    });

    it("親ツモ 2000オール", () => {
      const payment: Payment = { type: "oyaTsumo", amount: 2000 };
      const result = paymentToScoreTableAnswer(payment);
      expect(result).toEqual({ type: "oyaTsumo", scoreAll: 2000 });
    });
  });

  describe("koTsumo", () => {
    it("子ツモ支払いを ScoreTableAnswer に変換する", () => {
      const payment: Payment = { type: "koTsumo", amount: [1000, 2000] };
      const result = paymentToScoreTableAnswer(payment);
      expect(result).toEqual({
        type: "koTsumo",
        scoreFromKo: 1000,
        scoreFromOya: 2000,
      });
    });

    it("子ツモ 2000/4000（満貫）", () => {
      const payment: Payment = { type: "koTsumo", amount: [2000, 4000] };
      const result = paymentToScoreTableAnswer(payment);
      expect(result).toEqual({
        type: "koTsumo",
        scoreFromKo: 2000,
        scoreFromOya: 4000,
      });
    });

    it("子ツモ 700/1300", () => {
      const payment: Payment = { type: "koTsumo", amount: [700, 1300] };
      const result = paymentToScoreTableAnswer(payment);
      expect(result).toEqual({
        type: "koTsumo",
        scoreFromKo: 700,
        scoreFromOya: 1300,
      });
    });
  });

  describe("型の対応関係", () => {
    it("ron の amount が score にマッピングされる", () => {
      const payment: Payment = { type: "ron", amount: 5200 };
      const result = paymentToScoreTableAnswer(payment);
      expect(result.type).toBe("ron");
      if (result.type === "ron") {
        expect(result.score).toBe(5200);
      }
    });

    it("oyaTsumo の amount が scoreAll にマッピングされる", () => {
      const payment: Payment = { type: "oyaTsumo", amount: 4000 };
      const result = paymentToScoreTableAnswer(payment);
      expect(result.type).toBe("oyaTsumo");
      if (result.type === "oyaTsumo") {
        expect(result.scoreAll).toBe(4000);
      }
    });

    it("koTsumo の amount[0] が scoreFromKo, amount[1] が scoreFromOya にマッピングされる", () => {
      const payment: Payment = { type: "koTsumo", amount: [1300, 2600] };
      const result = paymentToScoreTableAnswer(payment);
      expect(result.type).toBe("koTsumo");
      if (result.type === "koTsumo") {
        expect(result.scoreFromKo).toBe(1300);
        expect(result.scoreFromOya).toBe(2600);
      }
    });
  });
});
