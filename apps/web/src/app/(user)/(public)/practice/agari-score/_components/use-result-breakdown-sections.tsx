"use client";

import { useTranslations } from "next-intl";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import type { ScoreResultBreakdownTab } from "@mahjong-scoring/features/results/score-result-display";
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
  return tabs.map(({ kind, breakdown }): BreakdownPanelSection =>
    kind === "han"
      ? {
          kind,
          tabLabel: `${t("form.labels.han")} ${hanDisplay(answer.han)}`,
          content: (
            <ResultBreakdownTable
              items={breakdown.items}
              total={breakdown.total}
              suffix={t("form.options.hanSuffix")}
              onOpenScoreTable={onOpenScoreTable}
              onOpenYakuList={onOpenYakuList}
            />
          ),
        }
      : {
          kind,
          tabLabel: `${t("form.labels.fu")} ${answer.fu}${t("form.options.fuSuffix")}`,
          content: (
            <ResultBreakdownTable
              items={breakdown.items}
              total={breakdown.total}
              suffix={t("form.options.fuSuffix")}
              roundedTotal={answer.fu}
              onOpenScoreTable={onOpenScoreTable}
            />
          ),
        },
  );
}
