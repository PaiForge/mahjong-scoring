import { describe, expect, it } from "vitest";
import type { KoTsumoPayment } from "@mahjong-scoring/core";

import type { AvailableScores } from "./get-available-scores";
import { resolveScoreSelection, type ScoreInput } from "./score-selection";

const EMPTY: ScoreInput = {
  score: undefined,
  scoreFromKo: undefined,
  scoreFromOya: undefined,
};

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

describe("resolveScoreSelection（1 つの点数で答えるとき）", () => {
  const available: AvailableScores = { type: "single", scores: [1000, 2000] };

  it("選択肢にある点数は選択として残り、送れる", () => {
    expect(resolveScoreSelection(available, { ...EMPTY, score: 2000 })).toEqual(
      {
        score: 2000,
        scoreFromKo: undefined,
        scoreFromOya: undefined,
        koTsumoPayment: undefined,
        isComplete: true,
      },
    );
  });

  it("選択肢に無い点数・未入力は未選択になり、送れない", () => {
    for (const score of [1500, undefined]) {
      const selection = resolveScoreSelection(available, { ...EMPTY, score });
      expect(selection.score).toBeUndefined();
      expect(selection.isComplete).toBe(false);
    }
  });

  it("子ツモの入力値が残っていても使わない", () => {
    const selection = resolveScoreSelection(available, {
      score: 1000,
      scoreFromKo: 300,
      scoreFromOya: 500,
    });
    expect(selection.scoreFromKo).toBeUndefined();
    expect(selection.scoreFromOya).toBeUndefined();
  });
});

describe("resolveScoreSelection（子ツモを 2 つの select で答えるとき）", () => {
  const available: AvailableScores = {
    type: "koTsumoSplit",
    koScores: [300, 500],
    oyaScores: [500, 1000],
  };

  it("子からと親からの両方が選択肢にあれば送れる", () => {
    expect(
      resolveScoreSelection(available, {
        score: 8000,
        scoreFromKo: 500,
        scoreFromOya: 500,
      }),
    ).toEqual({
      score: undefined,
      scoreFromKo: 500,
      scoreFromOya: 500,
      koTsumoPayment: undefined,
      isComplete: true,
    });
  });

  it("片側だけ選んだ・片側が選択肢に無いときは、その側を未選択にして送れない", () => {
    const koOnly = resolveScoreSelection(available, {
      ...EMPTY,
      scoreFromKo: 300,
    });
    expect(koOnly.scoreFromKo).toBe(300);
    expect(koOnly.isComplete).toBe(false);

    const oyaOnly = resolveScoreSelection(available, {
      ...EMPTY,
      scoreFromOya: 1000,
    });
    expect(oyaOnly.scoreFromOya).toBe(1000);
    expect(oyaOnly.isComplete).toBe(false);

    const missing = resolveScoreSelection(available, {
      ...EMPTY,
      scoreFromKo: 300,
      scoreFromOya: 700,
    });
    expect(missing.scoreFromOya).toBeUndefined();
    expect(missing.isComplete).toBe(false);
  });
});

describe("resolveScoreSelection（子ツモをまとめた select で答えるとき）", () => {
  const available: AvailableScores = {
    type: "koTsumoCombined",
    payments: [PAYMENT_300_500, PAYMENT_500_1000],
  };

  it("実在する組なら、その組を選択として返して送れる", () => {
    expect(
      resolveScoreSelection(available, {
        ...EMPTY,
        scoreFromKo: 500,
        scoreFromOya: 1000,
      }),
    ).toEqual({
      score: undefined,
      scoreFromKo: 500,
      scoreFromOya: 1000,
      koTsumoPayment: PAYMENT_500_1000,
      isComplete: true,
    });
  });

  it("どちらの値も選択肢にあっても、組として実在しなければ未選択になる", () => {
    const selection = resolveScoreSelection(available, {
      ...EMPTY,
      scoreFromKo: 300,
      scoreFromOya: 1000,
    });
    expect(selection).toEqual({
      score: undefined,
      scoreFromKo: undefined,
      scoreFromOya: undefined,
      koTsumoPayment: undefined,
      isComplete: false,
    });
  });

  it("片側が未入力なら未選択になる", () => {
    expect(
      resolveScoreSelection(available, { ...EMPTY, scoreFromKo: 300 })
        .isComplete,
    ).toBe(false);
  });
});
