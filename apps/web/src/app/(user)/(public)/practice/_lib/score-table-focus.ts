import { isFu } from "@mahjong-scoring/core";
import type { ScoreTableFocus } from "@/app/(user)/(public)/reference/score-table/_lib/score-table-utils";

interface ScoreTableFocusSource {
  readonly isOya: boolean;
  readonly isTsumo: boolean;
  readonly han: number;
  /** 符。満貫以上で符が点数に効かない出題は undefined */
  readonly fu: number | undefined;
}

/**
 * 出題条件から点数表のハイライト位置を組み立てる
 * 点数表位置生成
 *
 * 答え合わせで正解の点数を押したとき、点数早見表のどのセルに着地させるかを
 * 決める。親子・ロンツモはタブの初期値、翻と符はセル（5翻以上は区分行）の
 * 位置になる（{@link import("@/app/(user)/(public)/reference/score-table/_lib/score-table-utils").resolveScoreTableFocus}）。
 *
 * 符は `Fu` に絞ってから渡す。出題側の符は数値のまま持つものがあり、表の
 * 行に無い値（切り上げ前の値など）を渡すとハイライトが宙に浮くため。
 */
export function scoreTableFocusOf({
  isOya,
  isTsumo,
  han,
  fu,
}: ScoreTableFocusSource): ScoreTableFocus {
  return {
    role: isOya ? "oya" : "ko",
    winType: isTsumo ? "tsumo" : "ron",
    han,
    fu: fu !== undefined && isFu(fu) ? fu : undefined,
  };
}
