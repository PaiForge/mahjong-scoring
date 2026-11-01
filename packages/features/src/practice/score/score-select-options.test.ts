import type { KoTsumoPayment } from "@mahjong-scoring/core";
import { describe, expect, it, vi } from "vitest";

import type { SingleInputScores } from "./get-available-scores";
import { applyScoreTileChoice, scoreTileValue } from "./score-select-options";

const PAYMENT_300_500: KoTsumoPayment = {
  type: "koTsumo",
  fromKo: 300,
  fromOya: 500,
};
const PAYMENT_500_1000: KoTsumoPayment = {
  type: "koTsumo",
  fromKo: 500,
  fromOya: 1000,
};

const single: SingleInputScores = { type: "single", scores: [1000, 2000] };
const combined: SingleInputScores = {
  type: "koTsumoCombined",
  payments: [PAYMENT_300_500, PAYMENT_500_1000],
};

describe("scoreTileValue", () => {
  it("1 つの点数で答えるときは点数の文字列", () => {
    expect(scoreTileValue(single, 2000, undefined)).toBe("2000");
    expect(scoreTileValue(single, undefined, undefined)).toBeUndefined();
  });

  it("子ツモをまとめて答えるときは組の key", () => {
    expect(scoreTileValue(combined, undefined, PAYMENT_300_500)).toBe(
      "300/500",
    );
    expect(scoreTileValue(combined, 1000, undefined)).toBeUndefined();
  });
});

describe("applyScoreTileChoice", () => {
  it("1 つの点数で答えるときは点数を渡す", () => {
    const onScore = vi.fn();
    const onKoTsumoPayment = vi.fn();
    applyScoreTileChoice(single, "2000", { onScore, onKoTsumoPayment });
    expect(onScore).toHaveBeenCalledWith(2000);
    expect(onKoTsumoPayment).not.toHaveBeenCalled();
  });

  it("子ツモをまとめて答えるときは key の組を渡す", () => {
    const onScore = vi.fn();
    const onKoTsumoPayment = vi.fn();
    applyScoreTileChoice(combined, "500/1000", { onScore, onKoTsumoPayment });
    expect(onKoTsumoPayment).toHaveBeenCalledWith(PAYMENT_500_1000);
    expect(onScore).not.toHaveBeenCalled();
  });

  it("選択肢に無い組の key では何も渡さない", () => {
    const onScore = vi.fn();
    const onKoTsumoPayment = vi.fn();
    applyScoreTileChoice(combined, "400/700", { onScore, onKoTsumoPayment });
    expect(onScore).not.toHaveBeenCalled();
    expect(onKoTsumoPayment).not.toHaveBeenCalled();
  });
});
