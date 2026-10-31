import type { ReactNode } from "react";
import { ScoreInputToggleButton } from "./score-input-toggle-button";

interface ScoreLabelRowProps {
  /** 欄のラベル（`<label>` / `<span>`）。下の余白は行が持つので `mb-*` を付けない */
  readonly children: ReactNode;
  /** 切り替えボタンを押せなくする（回答フォームの `disabled`） */
  readonly disabled?: boolean;
  /** 切り替えボタンの `data-tour-id`（ヘルプツアーが照らす欄だけ渡す） */
  readonly tourId?: string;
}

/**
 * 点数の欄のラベル行
 * 点数ラベル行
 *
 * 点数の欄のラベルと、その右端の入力方式の切り替えボタン
 * （{@link ScoreInputToggleButton}）を 1 行に並べる。「役」のラベル行に
 * 「役なし」を添える `YakuLabelRow` と同じ置き方なので、行は増えない。
 *
 * 点数の欄のすべての変種（`ScoreAnswerForm` の各分岐、和了形の点数計算の
 * `ScoreField`）に置く。回答欄に無いと見つからず、ゲストは設定ページ
 * （会員限定）に入れないので、ここが入力方式を変える唯一の入口になる。
 * 初回だけのヒントやトーストは一度消えると二度と見つからないので採らない。
 *
 * 切り替えると欄の高さが変わり、下の「回答する / 次の問題へ」が一度動く。
 * 設定ページで変えたときと同じ一回限りの動きなので許容する — タイル側の
 * 高さの確保（`ScoreTilePicker` の min-height）は方式をまたいで揃えない。
 */
export function ScoreLabelRow({
  children,
  disabled,
  tourId,
}: ScoreLabelRowProps) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      {children}
      <ScoreInputToggleButton disabled={disabled} tourId={tourId} />
    </div>
  );
}
