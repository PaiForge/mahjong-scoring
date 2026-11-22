/**
 * 保存問題の属性のテスト用の盤面
 * 問題属性テスト盤面
 *
 * 保存形式の固定値。牌は牌種 ID（0〜8 萬子・9〜17 筒子・18〜26 索子・27〜30 東南西北・
 * 31〜33 白發中）。和了形の基本の盤面は本日の問題のテスト盤面
 * （`daily-problem/test-fixtures.ts`）を使い、ここには属性の境界だけを足す。
 *
 * このモジュールはテスト専用。アプリ本体から import しないこと。web の DB を使う
 * テストも同じ盤面を読む（盤面の定義を 2 つ持たない）。
 */
import type {
  AgariProblemPayload,
  TenpaiProblemPayload,
} from "@mahjong-scoring/core";

import type { ProblemFacetInput } from "./compute";

/** 和了形の盤面を属性の計算の入力にする */
export function agariInput(payload: AgariProblemPayload): ProblemFacetInput {
  return { kind: "agari-score", schemaVersion: 1, payload };
}

/** 聴牌形の盤面を属性の計算の入力にする */
export function tenpaiInput(payload: TenpaiProblemPayload): ProblemFacetInput {
  return { kind: "tenpai-score", schemaVersion: 1, payload };
}

/**
 * 連風牌 4 符のときにだけ切り上げ満貫が効く手（親のロン）
 *
 * 999p 456s 13s 白白白 + 東東（東場の東家）で嵌 2s のロン。白 + リーチ + ドラ 1（2s）で 3 翻。
 * 符は 副底 20 + 門前ロン 10 + 么九の暗刻 8 × 2 + 嵌張 2 + 雀頭で、連風牌 2 符なら
 * 50 符（9600 点）、4 符なら 52 → 60 符（11600 点。切り上げ満貫で 12000 点）。
 * 標準ルールとの比較だけでは切り上げ満貫の印が立たない。
 */
export function kiriageOnlyWithRenfonpaiAgariPayload(): AgariProblemPayload {
  return {
    hand: {
      closed: [17, 17, 17, 18, 19, 20, 21, 22, 23, 27, 27, 31, 31, 31],
      exposed: [],
    },
    agariHai: 19,
    isTsumo: false,
    jikaze: 27,
    bakaze: 27,
    doraMarkers: [18],
    riichi: { uraDoraMarkers: [8] },
  };
}

/**
 * ルールによっては組み立てられない手: 大四喜 + 字一色 + 四暗刻単騎（ツモ）
 *
 * 標準ルール（複合なし・ダブルなし）では役満 1 つ分。役満ルールをすべて有効にすると
 * 役満 3 個分以上になり、回答の選択肢に無いので組み立てられない。
 */
export function tripleYakumanAgariPayload(): AgariProblemPayload {
  return {
    hand: {
      closed: [27, 27, 27, 28, 28, 28, 29, 29, 29, 30, 30, 30, 31, 31],
      exposed: [],
    },
    agariHai: 31,
    isTsumo: true,
    jikaze: 28,
    bakaze: 27,
    doraMarkers: [0],
    riichi: null,
  };
}

/** 四暗刻の単騎待ち（ツモ）。単騎をダブル役満とするルールで正解が変わる */
export function suuankouTankiAgariPayload(): AgariProblemPayload {
  return {
    hand: {
      closed: [0, 0, 0, 2, 2, 2, 6, 6, 6, 23, 23, 26, 26, 26],
      exposed: [],
    },
    agariHai: 23,
    isTsumo: true,
    jikaze: 30,
    bakaze: 28,
    doraMarkers: [28],
    riichi: null,
  };
}

/** 役が無い和了形（門前のロン・リーチなし）。標準ルールで組み立てられない */
export function noYakuAgariPayload(): AgariProblemPayload {
  return {
    hand: {
      closed: [1, 1, 1, 12, 13, 14, 15, 16, 17, 20, 20, 20, 26, 26],
      exposed: [],
    },
    agariHai: 20,
    isTsumo: false,
    jikaze: 28,
    bakaze: 27,
    doraMarkers: [30],
    riichi: null,
  };
}

/**
 * 役なしのロン待ちを持つ門前の聴牌形（リーチなし）
 *
 * 222m 456p 789p 33s 99s の 3s・9s の双碰。ツモは門前清自摸和、ロンはどちらも役なし。
 */
export function noYakuRonTenpaiPayload(): TenpaiProblemPayload {
  return {
    hand: {
      closed: [1, 1, 1, 12, 13, 14, 15, 16, 17, 20, 20, 26, 26],
      exposed: [],
    },
    jikaze: 28,
    bakaze: 27,
    doraMarkers: [30],
    riichi: null,
  };
}

/** リーチした門前の三面待ち（234m 34567p 678s 55s。2・5・8p 待ち）の聴牌形。親 */
export function riichiTenpaiPayload(): TenpaiProblemPayload {
  return {
    hand: {
      closed: [1, 2, 3, 11, 12, 13, 14, 15, 22, 22, 23, 24, 25],
      exposed: [],
    },
    jikaze: 27,
    bakaze: 27,
    doraMarkers: [32],
    riichi: { uraDoraMarkers: [8] },
  };
}

/** 待ちが 1 つの聴牌形（123m 456p 789p 13s 白白 の嵌 2s）。聴牌形として保存できない */
export function singleWaitTenpaiPayload(): TenpaiProblemPayload {
  return {
    hand: {
      closed: [0, 1, 2, 12, 13, 14, 15, 16, 17, 18, 20, 31, 31],
      exposed: [],
    },
    jikaze: 28,
    bakaze: 27,
    doraMarkers: [30],
    riichi: null,
  };
}

/** 役満の和了形（ツモ・子）を、純手牌と和了牌から作る */
function yakumanPayload(
  closed: number[],
  agariHai: number,
  exposed: AgariProblemPayload["hand"]["exposed"] = [],
): AgariProblemPayload {
  return {
    hand: { closed, exposed },
    agariHai,
    isTsumo: true,
    jikaze: 28,
    bakaze: 27,
    doraMarkers: [4],
    riichi: null,
  };
}

/** 大三元 + 四暗刻（双碰のツモ）。複合を合算するルールでだけ正解が変わる */
export function fukugouYakumanAgariPayload(): AgariProblemPayload {
  return yakumanPayload(
    [0, 0, 0, 8, 8, 31, 31, 31, 32, 32, 32, 33, 33, 33],
    33,
  );
}

/** 大四喜（東をポン。1m の単騎）。大四喜をダブル役満とするルールでだけ正解が変わる */
export function daisuushiiAgariPayload(): AgariProblemPayload {
  return yakumanPayload([0, 0, 28, 28, 28, 29, 29, 29, 30, 30, 30], 0, [
    { type: "pon", hais: [27, 27, 27], from: "toimen" },
  ]);
}

/** 国士無双の十三面待ち（1m を引く）。十三面をダブル役満とするルールでだけ正解が変わる */
export function kokushiJuusanmenAgariPayload(): AgariProblemPayload {
  return yakumanPayload(
    [0, 0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33],
    0,
  );
}

/** 純正九蓮宝燈（1112345678999m に 4m）。純正をダブル役満とするルールでだけ正解が変わる */
export function junseiChuurenAgariPayload(): AgariProblemPayload {
  return yakumanPayload([0, 0, 0, 1, 2, 3, 3, 4, 5, 6, 7, 8, 8, 8], 3);
}

/**
 * 待ちによって切り上げ満貫の印が違う聴牌形（リーチ・タンヤオ・平和。子）
 *
 * 234m 567m 345p 88p 45s の 3s・6s の両面待ちで、6s がドラ。6s のロンだけが
 * 4 翻 30 符（切り上げ満貫で変わる）になる。3s のロンは 3 翻 30 符、ツモは平和ツモの
 * 20 符（3s は 4 翻、6s は 5 翻で満貫）で、どれも切り上げ満貫では変わらない。
 */
export function mixedKiriageTenpaiPayload(): TenpaiProblemPayload {
  return {
    hand: {
      closed: [1, 2, 3, 4, 5, 6, 11, 12, 13, 16, 16, 21, 22],
      exposed: [],
    },
    jikaze: 28,
    bakaze: 27,
    doraMarkers: [22],
    riichi: { uraDoraMarkers: [27] },
  };
}
