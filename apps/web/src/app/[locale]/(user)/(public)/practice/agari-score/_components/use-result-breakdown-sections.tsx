"use client";

import { useTranslations } from "next-intl";
import type { FuDetail, ScoreQuestion } from "@mahjong-scoring/core";
import { fuReasonLabel } from "@mahjong-scoring/features/results/fu-reason-label";
import { yakuLabel } from "@mahjong-scoring/features/yaku/yaku-labels";
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
 *
 * 行の文言は今の言語の辞書で引く。共有の組み立て（`buildScoreResultBreakdownSections`）は
 * core の日本語（役名・符の理由）を `name` に載せるので、役名は `yakuNames`
 * （{@link yakuLabel}）、符の理由は `fuDetails` の構造から `challenge.fuBreakdown`
 * （{@link fuReasonLabel}）で引き直す。符の行は出題の `fuDetails` と同じ順・同じ数で
 * 組まれるため添字で対応させる。日本語の辞書の値は core の文言と同じなので日本語の
 * 表示は変わらない。`fuDetails` を渡さないときは符の理由を core の文言のまま出す。
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
