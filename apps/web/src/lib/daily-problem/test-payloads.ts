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
import type { TenpaiProblemPayload } from "@mahjong-scoring/core";

// 和了形の盤面は適格判定のテスト（features）と同じものを使う
export {
  eligibleAgariPayload,
  kiriageBoundaryAgariPayload,
  otherEligibleAgariPayload,
  renfonpaiAgariPayload,
  yakumanAgariPayload,
} from "@mahjong-scoring/features/daily-problem/test-fixtures";

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
