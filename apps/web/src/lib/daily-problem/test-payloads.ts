/**
 * 本日の問題のテスト用の盤面
 * 本日の問題テスト盤面
 *
 * 保存形式（`AgariProblemPayload`）の固定値。牌は牌種 ID（0〜8 萬子・9〜17 筒子・
 * 18〜26 索子・27〜30 東南西北・31〜33 白發中）。どれも保存時の検証（標準ルール）は
 * 通る盤面で、本日の問題の適格判定で通るか落ちるかだけが違う。
 *
 * このモジュールはテスト専用。アプリ本体から import しないこと。
 */
import type {
  AgariProblemPayload,
  TenpaiProblemPayload,
} from "@mahjong-scoring/core";

/** 適格: 門前リーチのツモ（789m 456p 222s 456s + 22m の雀頭）。どのルールでも 2 翻 30 符 */
export function eligibleAgariPayload(): AgariProblemPayload {
  return {
    hand: {
      closed: [1, 1, 6, 7, 8, 12, 13, 14, 19, 19, 19, 21, 22, 23],
      exposed: [],
    },
    agariHai: 22,
    isTsumo: true,
    jikaze: 29,
    bakaze: 27,
    doraMarkers: [32],
    riichi: { uraDoraMarkers: [23] },
  };
}

/** 適格（もう 1 つ）: 白の暗刻を含む門前ツモ。どのルールでも 3 翻 30 符 */
export function otherEligibleAgariPayload(): AgariProblemPayload {
  return {
    hand: {
      closed: [1, 2, 3, 4, 5, 6, 10, 11, 12, 12, 12, 31, 31, 31],
      exposed: [],
    },
    agariHai: 6,
    isTsumo: true,
    jikaze: 27,
    bakaze: 28,
    doraMarkers: [9],
    riichi: null,
  };
}

/** 切り上げ満貫で割れる: 30 符 4 翻（切り上げ満貫の有無で点数が変わる） */
export function kiriageBoundaryAgariPayload(): AgariProblemPayload {
  return {
    hand: {
      closed: [11, 12, 13, 13, 14, 15, 17, 17, 17, 24, 25, 25, 25, 26],
      exposed: [],
    },
    agariHai: 17,
    isTsumo: true,
    jikaze: 30,
    bakaze: 28,
    doraMarkers: [12],
    riichi: { uraDoraMarkers: [9] },
  };
}

/** 連風牌の符で割れる: 東場の東家で東の雀頭（2 符 / 4 符で符が変わる） */
export function renfonpaiAgariPayload(): AgariProblemPayload {
  return {
    hand: {
      closed: [10, 10, 10, 15, 16, 17, 21, 22, 23, 27, 27, 29, 29, 29],
      exposed: [],
    },
    agariHai: 17,
    isTsumo: true,
    jikaze: 27,
    bakaze: 27,
    doraMarkers: [8],
    riichi: null,
  };
}

/** 役満: 四暗刻（ツモ）。ルールに依らず役満 1 つ分だが、役満は出さない */
export function yakumanAgariPayload(): AgariProblemPayload {
  return {
    hand: {
      closed: [0, 0, 0, 2, 2, 2, 6, 6, 6, 23, 23, 26, 26, 26],
      exposed: [],
    },
    agariHai: 26,
    isTsumo: true,
    jikaze: 30,
    bakaze: 28,
    doraMarkers: [28],
    riichi: null,
  };
}

/** 聴牌形（234m 34567p 678s 55s のリーチ）。本日の問題の候補にならない種別 */
export function tenpaiPayload(): TenpaiProblemPayload {
  return {
    hand: {
      closed: [1, 2, 3, 11, 12, 13, 14, 15, 23, 24, 25, 22, 22],
      exposed: [],
    },
    jikaze: 27,
    bakaze: 27,
    doraMarkers: [32],
    riichi: { uraDoraMarkers: [8] },
  };
}
