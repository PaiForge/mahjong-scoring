"use client";

import { Suspense } from "react";
import { useScoreTableQuerySelection } from "../_hooks/use-score-table-query-selection";
import { FULL_SELECTION, type ScoreTableSelection } from "../_lib/options";
import { ScoreTablePrompt } from "./score-table-prompt";

interface ScoreTableHowToPlayDemoProps {
  /** 出題条件。デモの提示内容（親子・ツモロン・翻符）をこれに合わせる */
  readonly selection: ScoreTableSelection;
}

/**
 * 出題条件に合わせたデモの本体
 *
 * 実際の出題（親子・ツモロン・翻・符の提示）を静的に再現し、出題形式を端的に示す。
 * 満貫以上は符に依存しないため符を表示しない。
 */
function ScoreTableHowToPlayDemo({ selection }: ScoreTableHowToPlayDemoProps) {
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

function ScoreTableHowToPlayFromQuery() {
  const { selection } = useScoreTableQuerySelection();
  return <ScoreTableHowToPlayDemo selection={selection} />;
}

/**
 * 点数表早引き練習の「問題方式」ビジュアルデモ
 * 点数表 遊び方デモ
 *
 * ガイドから条件付きで遷移した場合（例: 子・ロン・満貫以上）は、URL の条件に
 * 即したサンプルを表示する。条件は `useSearchParams()` で読むため静的ルートでは
 * クライアント描画になる。プリレンダー HTML には fallback として全選択時の
 * デモ（子・ロン・3翻30符）を出しておき、条件無しの通常表示ではクライアント
 * 描画後も見た目が変わらないようにする。
 */
export function ScoreTableHowToPlay() {
  return (
    <Suspense fallback={<ScoreTableHowToPlayDemo selection={FULL_SELECTION} />}>
      <ScoreTableHowToPlayFromQuery />
    </Suspense>
  );
}
