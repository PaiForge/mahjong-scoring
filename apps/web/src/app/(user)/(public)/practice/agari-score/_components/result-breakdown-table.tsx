"use client";

import { useTranslations } from "next-intl";

import { DetailTable } from "../../_components/detail-table";
import { ScoreTableValueButton } from "../../_components/score-table-value-button";

interface DetailItem {
  readonly name: string;
  readonly value: number;
}

interface ResultBreakdownTableProps {
  readonly items: readonly DetailItem[];
  /** 内訳の合計（切り上げの前） */
  readonly total: number;
  /** 値の単位（「翻」「符」） */
  readonly suffix: string;
  /** 切り上げた後の値（符の正解）。合計と同じなら切り上げの行を出さない */
  readonly roundedTotal?: number;
  /**
   * 答えの値（切り上げ後、切り上げが無ければ合計）を押したときの処理。
   * 渡すとその値が点数表を開くボタンになる。切り上げ前の合計は点数表の
   * 行に無いので押せるようにしない
   */
  readonly onOpenScoreTable?: () => void;
}

/**
 * 答え合わせの内訳の表
 * 符詳細・役詳細の表
 *
 * 翻数・符の内訳の行と合計を {@link DetailTable} で並べる。開閉と切り替えは
 * 置く側の `BreakdownPanel` が持つ。符の切り上げは合計の下に「切り上げ後 40符」
 * として据える（理由は {@link DetailTable} の `conclusion`）。
 */
export function ResultBreakdownTable({
  items,
  total,
  suffix,
  roundedTotal,
  onOpenScoreTable,
}: ResultBreakdownTableProps) {
  const t = useTranslations("agariScore");
  const withSuffix = (value: number) => `${value}${suffix}`;
  const answerValue = (value: number) =>
    onOpenScoreTable === undefined ? (
      withSuffix(value)
    ) : (
      <ScoreTableValueButton onClick={onOpenScoreTable}>
        {withSuffix(value)}
      </ScoreTableValueButton>
    );
  const isRounded = roundedTotal !== undefined && total !== roundedTotal;

  return (
    <DetailTable
      rows={items.map((detail) => ({
        label: detail.name,
        value: withSuffix(detail.value),
      }))}
      total={{
        label: t("result.details.total"),
        value: isRounded ? withSuffix(total) : answerValue(total),
      }}
      conclusion={
        isRounded
          ? {
              label: t("result.details.roundedUp"),
              value: answerValue(roundedTotal),
            }
          : undefined
      }
    />
  );
}
