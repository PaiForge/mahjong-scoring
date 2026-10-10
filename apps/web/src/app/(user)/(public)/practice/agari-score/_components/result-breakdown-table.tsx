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
 * 置く側の `BreakdownPanel` が持つ。
 *
 * 符の切り上げは合計の下に「切り上げ後 40符」として最後の計算に据え、
 * 正解の符だけを一段大きく濃くする。小さな補足（「32符 → 40符（切り上げ）」）
 * では、内訳の合計 32符と答えの 40符のどちらが正解なのかが一目で読めず、
 * 切り上げを忘れた人ほど 32符 のほうを答えだと読む。行ごとに色分けしたり
 * カードにしたりはしない — 強調するのは結論の 1 か所だけにして、表の丈を
 * 増やさない。
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
      note={
        roundedTotal !== undefined && total !== roundedTotal ? (
          <span className="inline-flex items-baseline gap-2">
            {t("result.details.roundedUp")}
            <span className="text-base font-bold text-surface-900">
              {withSuffix(roundedTotal)}
            </span>
          </span>
        ) : undefined
      }
    />
  );
}
