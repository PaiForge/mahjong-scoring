import type { ScoreQuestion } from "@mahjong-scoring/core";

import type { TehaiContext } from "../_components/tehai-display";

/**
 * ScoreQuestion から手牌表示用のコンテキストを取り出す
 * 出題コンテキスト抽出
 *
 * `ScoreQuestion` は和了状況を `context` で括らず直下に展開している
 * （点数計算のロジック側が個々のフィールドを直接読むため）。
 * 手牌表示に渡す際の組み替えをここに集約する。
 *
 * 裏ドラまで渡すのは、リーチの手では裏ドラが正解の翻数に乗るため。
 * 盤面に出さないと答えが導けない問題になる（表示側はリーチしている
 * 出題でのみ裏ドラを描く）。
 */
export function tehaiContextOf(question: ScoreQuestion): TehaiContext {
  return {
    bakaze: question.bakaze,
    jikaze: question.jikaze,
    agariHai: question.agariHai,
    isTsumo: question.isTsumo,
    isRiichi: question.isRiichi,
    doraMarkers: question.doraMarkers,
    uraDoraMarkers: question.uraDoraMarkers,
  };
}
