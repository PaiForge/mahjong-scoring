import type { ScoreTableFocus } from "@mahjong-scoring/features/score-table/focus";
import { useTranslations } from "use-intl";

import { ScoreTable } from "../../../score-table/score-table";
import { ReferenceModal } from "./reference-modal";

/**
 * 点数表参照モーダル（web の `ScoreTableModal`）
 * 点数表モーダル
 *
 * 答え合わせから出題ループを離脱せずに、正解が点数早見表のどこにあるかを
 * 確かめるための導線。ハイライトなしで開くときも親子・ロンツモのタブは
 * その和了に合わせ、探す手間を省く。暗記用の隠す切り替えは参照中の誤タップを
 * 防ぐため無効にする。
 */
export function ScoreTableModal({
  isOpen,
  onClose,
  focus,
  highlighted,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  /** この和了（正解の親子・ロンツモ・翻・符）。タブの初期値に使う */
  readonly focus: ScoreTableFocus;
  /**
   * 正解のセルをハイライトするか
   *
   * 値（点数そのもの・内訳の翻数と符）を押して開いたときだけ真。表への
   * 補助リンクから開いたときは素の表を出す（web と同じ）。
   */
  readonly highlighted: boolean;
}) {
  const tScoreTable = useTranslations("scoreTable");

  return (
    <ReferenceModal
      isOpen={isOpen}
      onClose={onClose}
      title={tScoreTable("pageTitle")}
    >
      {/* 開くたびに作り直し、前回切り替えたタブではなくこの和了のタブから始める */}
      {isOpen && (
        <ScoreTable
          focus={highlighted ? focus : undefined}
          initialRole={focus.role}
          initialWinType={focus.winType}
          blurToggleEnabled={false}
        />
      )}
    </ReferenceModal>
  );
}
