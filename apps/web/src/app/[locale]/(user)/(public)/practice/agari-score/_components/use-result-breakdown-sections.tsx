"use client";

import { useTranslations } from "next-intl";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import {
  buildScoreResultBreakdownSections,
  type ScoreResultBreakdownTab,
} from "@mahjong-scoring/features/results/score-result-display";
import type { BreakdownPanelSection } from "../../_components/breakdown-panel";
import { ResultBreakdownTable } from "./result-breakdown-table";

/**
 * 翻数・符の内訳の切り替え（{@link ScoreResultBreakdownTab}）を、展開エリア
 * （`BreakdownPanel`）の区画に組む
 * 内訳の区画
 *
 * 見出しは「翻数 3翻」「符 40符」のように正解の値を添える。内訳の答えの値を
 * 押すと点数表を正解のセルで開き、役の名前を押すと役一覧をその役で開く。
 */
export function useResultBreakdownSections({
  tabs,
  answer,
  hanDisplay,
  onOpenScoreTable,
  onOpenYakuList,
}: {
  readonly tabs: readonly ScoreResultBreakdownTab[];
  readonly answer: Pick<ScoreQuestion["answer"], "han" | "fu">;
  readonly hanDisplay: (han: number) => string;
  readonly onOpenScoreTable: () => void;
  readonly onOpenYakuList: (yakuName?: string) => void;
}): readonly BreakdownPanelSection[] {
  const t = useTranslations("agariScore");
  return buildScoreResultBreakdownSections(tabs, answer, hanDisplay, t).map(
    ({ kind, tabLabel, table }): BreakdownPanelSection => ({
      kind,
      tabLabel,
      content: (
        <ResultBreakdownTable
          items={table.items}
          total={table.total}
          suffix={table.suffix}
          roundedTotal={table.roundedTotal}
          onOpenScoreTable={onOpenScoreTable}
          onOpenYakuList={table.opensYakuList ? onOpenYakuList : undefined}
        />
      ),
    }),
  );
}
