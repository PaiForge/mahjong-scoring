"use client";

import type { ScoreTableSelection } from "../_lib/options";
import { ScoreTablePrompt } from "./score-table-prompt";

interface ScoreTableHowToPlayProps {
  /** 出題条件。デモの提示内容（親子・ツモロン・翻符）をこれに合わせる */
  readonly selection: ScoreTableSelection;
}

/**
 * 点数表早引き練習の「問題方式」ビジュアルデモ
 * 点数表 遊び方デモ
 *
 * 実際の出題（親子・ツモロン・翻・符の提示）を静的に再現し、出題形式を端的に示す。
 * ガイドから条件付きで遷移した場合（例: 子・ロン・満貫以上）は、その条件に
 * 即したサンプルを表示する。満貫以上は符に依存しないため符を表示しない。
 */
export function ScoreTableHowToPlay({ selection }: ScoreTableHowToPlayProps) {
  // どちらの軸も含む場合は代表値（子・ロン・満貫未満）を既定とする。
  const isOya = selection.includeOya && !selection.includeKo;
  const isTsumo = selection.includeTsumo && !selection.includeRon;
  // 満貫以上のみの指定なら満貫の例（符なし）、それ以外は 3翻30符。
  const isManganOnly =
    selection.includeManganPlus && !selection.includeNonMangan;
  const han = isManganOnly ? 5 : 3;
  const fu = isManganOnly ? undefined : 30;

  return (
    <div className="space-y-4">
      <ScoreTablePrompt isOya={isOya} isTsumo={isTsumo} han={han} fu={fu} />
    </div>
  );
}
