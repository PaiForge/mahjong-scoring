"use client";

import { useTranslations } from "next-intl";
import { ScoreTable } from "@/app/(user)/(public)/reference/score-table/_components/score-table";
import type { ScoreTableFocus } from "@/app/(user)/(public)/reference/score-table/_lib/score-table-utils";
import { ReferenceModal } from "./reference-modal";

interface ScoreTableModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  /** この和了（正解の親子・ロンツモ・翻・符）。タブの初期値に使う */
  readonly focus: ScoreTableFocus;
  /**
   * 正解のセルをハイライトするか
   *
   * 点数そのものをタップして開いたときだけ真。表への補助リンクから開いた
   * ときは、役一覧を一覧として開くのと揃えて素の表を出す。
   */
  readonly highlighted: boolean;
}

/**
 * 点数表参照モーダル
 * 点数表モーダル
 *
 * 答え合わせから出題ループを離脱せずに、正解が点数早見表のどこにあるかを
 * 確かめるための導線。役一覧モーダルと対になる。ハイライトなしで開くときも
 * 親子・ロンツモのタブはその和了に合わせ、探す手間を省く。暗記用のぼかし
 * トグルは参照中の誤タップ事故を防ぐため無効にする。
 */
export function ScoreTableModal({
  isOpen,
  onClose,
  focus,
  highlighted,
}: ScoreTableModalProps) {
  const tScoreTable = useTranslations("scoreTable");

  return (
    <ReferenceModal
      isOpen={isOpen}
      onClose={onClose}
      title={tScoreTable("pageTitle")}
    >
      <ScoreTable
        focus={highlighted ? focus : undefined}
        initialRole={focus.role}
        initialWinType={focus.winType}
        blurToggleEnabled={false}
      />
    </ReferenceModal>
  );
}
