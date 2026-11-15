import { useTranslations } from "use-intl";
import type { FuDetail, ScoreQuestion } from "@mahjong-scoring/core";
import { fuReasonLabel } from "@mahjong-scoring/features/results/fu-reason-label";
import { yakuLabel } from "@mahjong-scoring/features/yaku/yaku-labels";
import {
  buildScoreResultBreakdownSections,
  type ScoreResultBreakdownTab,
} from "@mahjong-scoring/features/results/score-result-display";
import type { BreakdownPanelSection } from "../../components/breakdown-panel";
import { ResultBreakdownTable } from "./result-breakdown-table";

/**
 * 翻数・符の内訳の切り替えを展開エリア（`BreakdownPanel`）の区画に組む
 * （web の `useResultBreakdownSections`）
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
  fuDetails,
}: {
  readonly tabs: readonly ScoreResultBreakdownTab[];
  readonly answer: Pick<ScoreQuestion["answer"], "han" | "fu">;
  readonly hanDisplay: (han: number) => string;
  readonly onOpenScoreTable: () => void;
  readonly onOpenYakuList: (yakuName?: string) => void;
  /** 出題の符の内訳（符の行の文言を辞書で引き直すため） */
  readonly fuDetails?: readonly FuDetail[];
}): readonly BreakdownPanelSection[] {
  const t = useTranslations("agariScore");
  const tYakuNames = useTranslations("yakuNames");
  const tFuReason = useTranslations("challenge.fuBreakdown");
  return buildScoreResultBreakdownSections(tabs, answer, hanDisplay, t).map(
    ({ kind, tabLabel, table }): BreakdownPanelSection => ({
      kind,
      tabLabel,
      content: (
        <ResultBreakdownTable
          items={table.items.map((item, index) => {
            // 例: yakuNames.riichi
            if (kind === "han")
              return { ...item, label: yakuLabel(item.name, tYakuNames) };
            const detail = fuDetails?.[index];
            return detail === undefined
              ? item
              : { ...item, label: fuReasonLabel(detail, tFuReason) };
          })}
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
