import type { YakuSelectionState } from "@mahjong-scoring/core";

/**
 * 役の答え合わせの配色
 * 役別判定配色
 *
 * 緑 = 選んで合っていた / 赤 = 選んだが成立していない / 黄 = 選び忘れ。
 * 役判定練習（`practice/yaku`）と点数計算の結果（`practice/score`）で
 * チップの形は違う（前者は丸いピル、後者は記号付きで押せる）が、色の
 * 意味づけまで別々に決めると同じ「選び忘れ」が画面によって違う色になる。
 * 意味と色の対応はここ 1 箇所で持つ。
 */
export const YAKU_SELECTION_CLASSES: Readonly<
  Record<YakuSelectionState, string>
> = {
  correct: "border-primary-500 bg-primary-50 text-primary-700",
  incorrect: "border-destructive bg-destructive-subtle text-destructive-strong",
  missed: "border-warning bg-warning-subtle text-warning-strong",
};
