"use client";

import { useTranslations } from "next-intl";
import type { Role, WinType } from "@mahjong-scoring/core";
import type { ScoreTableFocus } from "@mahjong-scoring/features/score-table/focus";
import type { ScoreTableViewMode } from "@mahjong-scoring/features/score-table/score-grid";
import { ReferenceModal } from "@/app/(user)/_components/reference-modal";
import { ScoreTable } from "./score-table";

/** 点数表モーダルを開いたときのタブ */
interface ScoreTableModalTab {
  readonly role: Role;
  readonly winType: WinType;
  /** 表示モード（既定: 符×翻）。`highlight` を渡すとそちらが決める */
  readonly viewMode?: ScoreTableViewMode;
}

interface ScoreTableModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  /**
   * 開いたときの親子・ロンツモのタブ。和了から開くならその和了
   * （{@link ScoreTableFocus} をそのまま渡せる）、レッスンの表から開くなら
   * 直前の表と同じ組にそろえ、探す手間を省く
   */
  readonly tab: ScoreTableModalTab;
  /**
   * ハイライトするセル（省略時はハイライトしない）
   *
   * 値（点数そのもの・内訳の翻数と符）をタップして開いたときだけ渡す。
   * 表への補助リンクから開いたときは、役一覧を一覧として開くのと揃えて
   * 素の表を出す。
   */
  readonly highlight?: ScoreTableFocus;
}

/**
 * 点数表参照モーダル
 * 点数表モーダル
 *
 * 答え合わせやレッスンの本文から、いまの画面を離れずに正解や表の値が
 * 点数早見表のどこにあるかを確かめるための導線。役一覧モーダルと対になる。
 * 暗記用のぼかしトグルは参照中の誤タップ事故を防ぐため無効にする。
 */
export function ScoreTableModal({
  isOpen,
  onClose,
  tab,
  highlight,
}: ScoreTableModalProps) {
  const tScoreTable = useTranslations("scoreTable");

  return (
    <ReferenceModal
      isOpen={isOpen}
      onClose={onClose}
      title={tScoreTable("pageTitle")}
    >
      <ScoreTable
        focus={highlight}
        initialRole={tab.role}
        initialWinType={tab.winType}
        initialViewMode={tab.viewMode}
        blurToggleEnabled={false}
      />
    </ReferenceModal>
  );
}
