import type { ScoreQuestion } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { buildScoreResultDisplay } from "./score-result-display";

/** 答え合わせに要る項目だけを持つ出題（手牌・点数は組み立てに関与しない） */
function questionOf(
  overrides: Pick<Partial<ScoreQuestion>, "yakuDetails" | "fuDetails">,
): ScoreQuestion {
  return {
    tehai: { closed: [], exposed: [] },
    agariHai: 0,
    isTsumo: false,
    jikaze: 28,
    bakaze: 27,
    doraMarkers: [],
    answer: {
      han: 4,
      fu: 30,
      scoreLevel: "Normal",
      payment: { type: "ron", amount: 7700 },
    },
    ...overrides,
  } as unknown as ScoreQuestion;
}

const YAKU_DETAILS = [
  { name: "断么九", han: 1 },
  { name: "ドラ", han: 2 },
  { name: "立直", han: 1 },
];

const ORDER = ["立直", "断么九", "平和"];

describe("buildScoreResultDisplay の役", () => {
  it("余分な役は回答側だけ、選び忘れた役は正解側だけに振り分ける", () => {
    const display = buildScoreResultDisplay(
      questionOf({ yakuDetails: YAKU_DETAILS }),
      ["断么九", "平和"],
      ORDER,
    );

    expect(display.answeredYakuJudgements).toEqual([
      { name: "断么九", state: "correct" },
      { name: "平和", state: "incorrect" },
    ]);
    expect(display.correctYakuJudgements).toEqual([
      { name: "断么九", state: "correct" },
      { name: "立直", state: "missed" },
    ]);
  });

  it("無回答（undefined）は何も選んでいない扱いで、正解側は全て選び忘れになる", () => {
    const display = buildScoreResultDisplay(
      questionOf({ yakuDetails: YAKU_DETAILS }),
      undefined,
      ORDER,
    );

    expect(display.answeredYakuJudgements).toEqual([]);
    expect(display.correctYakuJudgements).toEqual([
      { name: "断么九", state: "missed" },
      { name: "立直", state: "missed" },
    ]);
  });
});

describe("buildScoreResultDisplay の内訳", () => {
  it("翻数の内訳は役の並び順の設定どおりに並べ、ドラを最後に置いて合計する", () => {
    const display = buildScoreResultDisplay(
      questionOf({ yakuDetails: YAKU_DETAILS }),
      [],
      ORDER,
    );

    expect(display.yakuBreakdown).toEqual({
      items: [
        { name: "立直", value: 1 },
        { name: "断么九", value: 1 },
        { name: "ドラ", value: 2 },
      ],
      total: 4,
    });
  });

  it("翻数の内訳が無い・空のときは出さない", () => {
    expect(
      buildScoreResultDisplay(questionOf({}), [], ORDER).yakuBreakdown,
    ).toBeUndefined();
    expect(
      buildScoreResultDisplay(questionOf({ yakuDetails: [] }), [], ORDER)
        .yakuBreakdown,
    ).toBeUndefined();
  });

  it("符の内訳は出題の順のまま合計する（切り上げ前）", () => {
    const display = buildScoreResultDisplay(
      questionOf({
        fuDetails: [
          { reason: "副底", fu: 20 },
          { reason: "中張牌の暗刻", fu: 4 },
          { reason: "嵌張待ち", fu: 2 },
        ],
      }),
      [],
      ORDER,
    );

    expect(display.fuBreakdown).toEqual({
      items: [
        { name: "副底", value: 20 },
        { name: "中張牌の暗刻", value: 4 },
        { name: "嵌張待ち", value: 2 },
      ],
      total: 26,
    });
  });

  it("符の内訳は出題が持たないときだけ出さず、空の内訳は合計 0 で出す", () => {
    expect(
      buildScoreResultDisplay(questionOf({}), [], ORDER).fuBreakdown,
    ).toBeUndefined();
    expect(
      buildScoreResultDisplay(questionOf({ fuDetails: [] }), [], ORDER)
        .fuBreakdown,
    ).toEqual({ items: [], total: 0 });
  });
});
