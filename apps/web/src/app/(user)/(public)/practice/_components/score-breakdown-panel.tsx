"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useFuHanOrder } from "@/app/_hooks/use-display-settings-store";
import {
  buildScoreBreakdownTabs,
  scoreBreakdownTabLabel,
} from "@mahjong-scoring/features/results/score-breakdown-tabs";
import {
  scoreTableOpeners,
  useScoreTableModal,
} from "@mahjong-scoring/features/score-table/use-score-table-modal";
import { TableIcon } from "@/app/(user)/_components/icons/table-icon";
import { ScoreTableModal } from "@/app/(user)/(public)/reference/score-table/_components/score-table-modal";
import { BreakdownPanel, type BreakdownPanelSection } from "./breakdown-panel";
import { ReferenceLinkButton } from "@/app/(user)/_components/reference-link-button";
import { FuBreakdownTable } from "./fu-breakdown";
import { YakuBreakdownTable } from "./yaku-breakdown";
import type { ScoreBreakdownPanelProps } from "@mahjong-scoring/features/results/breakdown-props";

/**
 * 点数系の答え合わせに添える翻数・符の内訳
 * 点数内訳パネル
 *
 * 符の内訳（{@link FuBreakdownTable}）と翻数の内訳（{@link YakuBreakdownTable}）を
 * 1 つの入口から切り替えて読ませる（器は {@link BreakdownPanel}）。模試と
 * 点数の練習のトレーニングの答え合わせ、結果ページの問題別詳細で使う。以前は 2 つの開閉を縦に積んで
 * いたが、両方開くと手牌・答え合わせの間が内訳で埋まった。
 *
 * 文言は共通の `challenge` 名前空間から引く（翻数の内訳と同じ理由で、練習
 * ごとの辞書に同じ語を持たせない）。
 *
 * `scoreTableFocus` を渡すと、内訳の答えの値（翻数の合計・符）が正解のセルを
 * ハイライトした点数表を開くボタンになり、内訳の下に「点数表を確認」を添える。
 * 内訳で翻・符を数え直した人が、その組から点数を引く次の一歩まで同じ場所で
 * 確かめられる。
 *
 * 開いた表の面（`surface`）は置く側が決める（符・翻数の内訳と同じ）。模試の
 * 答え合わせの資料の面（白い枠）の中では `sunken` にして白い枠を入れ子にしない。
 */
export function ScoreBreakdownPanel({
  fu,
  yakuDetails,
  yakuNote,
  judgement,
  scoreTableFocus,
  surface,
}: ScoreBreakdownPanelProps<ReactNode>) {
  const t = useTranslations("challenge.scoreBreakdown");
  const tScoreTable = useTranslations("scoreTable");
  const scoreTable = useScoreTableModal();
  const { openScoreTable, openHighlighted } = scoreTableOpeners(
    scoreTableFocus,
    scoreTable.open,
  );
  const fuHanOrder = useFuHanOrder();

  const { tabs, initial } = buildScoreBreakdownTabs(
    fuHanOrder,
    fu,
    yakuDetails,
    judgement,
  );

  const sections = tabs.map((tab): BreakdownPanelSection =>
    tab.kind === "fu"
      ? {
          kind: tab.kind,
          tabLabel: scoreBreakdownTabLabel(tab, t),
          content: (
            <FuBreakdownTable
              details={tab.fu.details}
              answer={tab.fu.answer}
              translationNamespace="challenge.fuBreakdown"
              onOpenScoreTable={openHighlighted}
            />
          ),
        }
      : {
          kind: tab.kind,
          tabLabel: scoreBreakdownTabLabel(tab, t),
          content: (
            <YakuBreakdownTable
              yakuDetails={tab.yakuDetails}
              note={yakuNote}
              onOpenScoreTable={openHighlighted}
            />
          ),
        },
  );

  return (
    <>
      <BreakdownPanel
        title={t("toggle")}
        sections={sections}
        initialKind={initial}
        surface={surface}
        action={
          openScoreTable === undefined ? undefined : (
            <ReferenceLinkButton
              icon={<TableIcon className="size-3.5 shrink-0" />}
              label={tScoreTable("viewScoreTable")}
              hitArea="row"
              onClick={() => openScoreTable(false)}
            />
          )
        }
      />
      {scoreTableFocus !== undefined && (
        <ScoreTableModal
          isOpen={scoreTable.isOpen}
          onClose={scoreTable.close}
          tab={scoreTableFocus}
          highlight={scoreTable.highlighted ? scoreTableFocus : undefined}
        />
      )}
    </>
  );
}
