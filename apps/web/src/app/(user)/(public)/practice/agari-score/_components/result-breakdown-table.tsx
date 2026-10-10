"use client";

import { useTranslations } from "next-intl";

import { DetailTable } from "../../_components/detail-table";

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
}: ResultBreakdownTableProps) {
  const t = useTranslations("agariScore");
  const withSuffix = (value: number) => `${value}${suffix}`;

  return (
    <DetailTable
      rows={items.map((detail) => ({
        label: detail.name,
        value: withSuffix(detail.value),
      }))}
      total={{
        label: t("result.details.total"),
        value: withSuffix(total),
      }}
      conclusion={
        roundedTotal !== undefined && total !== roundedTotal
          ? {
              label: t("result.details.roundedUp"),
              value: withSuffix(roundedTotal),
            }
          : undefined
      }
    />
  );
}
