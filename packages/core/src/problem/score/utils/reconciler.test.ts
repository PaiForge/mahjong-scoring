import { describe, it, expect } from "vitest";
import {
  HaiKind,
  type Tehai14,
  type ScoreResult,
} from "@pai-forge/riichi-mahjong";
import { applyRiichiAndUraDora } from "./reconciler";

/**
 * テスト用の ScoreResult を構築するヘルパー
 */
function makeScoreResult(overrides: Partial<ScoreResult> = {}): ScoreResult {
  return {
    han: 1,
    fu: 30,
    scoreLevel: "Normal",
    payment: { type: "ron", amount: 1000 },
    ...overrides,
  } as ScoreResult;
}

/**
 * テスト用の門前手牌（刻子含む）を構築するヘルパー
 */
function makeTehaiWithKoutsu(koutsuHai: number, closedRest: number[]): Tehai14 {
  return {
    closed: [koutsuHai, koutsuHai, koutsuHai, ...closedRest],
    exposed: [],
  } as unknown as Tehai14;
}

/**
 * 刻子以外の3面子（123m/123p/123s）と雀頭を並べた残り11牌
 *
 * どのテストも「刻子1つ + 通常の3面子 + 雀頭」の手牌を使い、
 * 検証したいのは刻子の種類と雀頭だけ。定型部分をここにまとめる。
 */
function standardRest(jantou: number): number[] {
  return [
    HaiKind.ManZu1,
    HaiKind.ManZu2,
    HaiKind.ManZu3,
    HaiKind.PinZu1,
    HaiKind.PinZu2,
    HaiKind.PinZu3,
    HaiKind.SouZu1,
    HaiKind.SouZu2,
    HaiKind.SouZu3,
    jantou,
    jantou,
  ];
}

describe("applyRiichiAndUraDora", () => {
  /** 白の暗刻 + 123m/123p/123s + 東の雀頭（門前・14牌） */
  function makeRiichiTehai(): Tehai14 {
    return makeTehaiWithKoutsu(HaiKind.Haku, standardRest(HaiKind.Ton));
  }

  /** 手牌に1枚も当たらない裏ドラ表示牌（索子8 → ドラは索子9） */
  const NO_HIT_MARKER = HaiKind.SouZu8;

  it("立直で1翻が加算される", () => {
    const result = applyRiichiAndUraDora({
      tehai: makeRiichiTehai(),
      currentAnswer: makeScoreResult({ han: 1 }),
      uraDoraMarkers: [NO_HIT_MARKER],
      isDoubleRiichi: false,
      isTsumo: false,
      jikaze: HaiKind.Nan,
    });

    expect(result.answer.han).toBe(2);
    expect(result.additionalYakuDetails).toEqual([{ name: "立直", han: 1 }]);
  });

  it("ダブル立直で2翻が加算される", () => {
    const result = applyRiichiAndUraDora({
      tehai: makeRiichiTehai(),
      currentAnswer: makeScoreResult({ han: 1 }),
      uraDoraMarkers: [NO_HIT_MARKER],
      isDoubleRiichi: true,
      isTsumo: false,
      jikaze: HaiKind.Nan,
    });

    expect(result.answer.han).toBe(3);
    expect(result.additionalYakuDetails).toEqual([
      { name: "ダブル立直", han: 2 },
    ]);
  });

  it("裏ドラ翻数が表示牌と手牌の照合結果に一致する", () => {
    // 中の表示牌 → ドラは白（三元牌はループする）。手牌は白の暗刻なので3枚。
    const result = applyRiichiAndUraDora({
      tehai: makeRiichiTehai(),
      currentAnswer: makeScoreResult({ han: 1 }),
      uraDoraMarkers: [HaiKind.Chun],
      isDoubleRiichi: false,
      isTsumo: false,
      jikaze: HaiKind.Nan,
    });

    expect(result.additionalYakuDetails).toEqual([
      { name: "立直", han: 1 },
      { name: "裏ドラ", han: 3 },
    ]);
    expect(result.answer.han).toBe(1 + 1 + 3);
  });

  it("表示牌が複数（槓子あり）の場合も全ての表示牌を照合する", () => {
    // 1m の表示牌 → ドラは 2m（手牌に1枚）、中の表示牌 → ドラは白（3枚）
    const result = applyRiichiAndUraDora({
      tehai: makeRiichiTehai(),
      currentAnswer: makeScoreResult({ han: 1 }),
      uraDoraMarkers: [HaiKind.ManZu1, HaiKind.Chun],
      isDoubleRiichi: false,
      isTsumo: false,
      jikaze: HaiKind.Nan,
    });

    expect(result.additionalYakuDetails).toContainEqual({
      name: "裏ドラ",
      han: 4,
    });
    expect(result.answer.han).toBe(1 + 1 + 4);
  });

  it("裏ドラが乗らない場合は裏ドラの役詳細を含めない", () => {
    const result = applyRiichiAndUraDora({
      tehai: makeRiichiTehai(),
      currentAnswer: makeScoreResult({ han: 1 }),
      uraDoraMarkers: [NO_HIT_MARKER],
      isDoubleRiichi: false,
      isTsumo: false,
      jikaze: HaiKind.Nan,
    });

    expect(result.additionalYakuDetails.some((d) => d.name === "裏ドラ")).toBe(
      false,
    );
  });
});
