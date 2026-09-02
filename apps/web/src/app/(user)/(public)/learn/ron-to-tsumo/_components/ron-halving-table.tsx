import { getTranslations } from "next-intl/server";

import { TsumoScore } from "@/app/(user)/(public)/reference/score-table/_components/tsumo-score";

import { HanRowsTable } from "../../_components/han-rows-table";

import { buildRonHalvingRows } from "../_lib/ron-halving-rows";

interface RonHalvingTableProps {
  /** 対象の符。ロンとツモが両方ある符を渡すこと（20符には行が無い） */
  readonly fu: number;
  /** 表の上に出す見出し */
  readonly caption: string;
}

/**
 * 子のロンから導いた子ツモと、点数表の子ツモを並べた表
 * 半分ずつの内訳表
 *
 * 導いた側と実際の側を同じ {@link TsumoScore} で描く。片方だけ素の数字に
 * すると、読者は列ごとに読み方を切り替えることになり、肝心の「同じ数字が
 * 並んでいる」が見えにくくなる。
 *
 * 左端にロンを置いて、右へ導出が進む向きに読ませる。図と同じ並びなので、
 * 図で覚えた手順のまま表を1行ずつ追える。
 */
export async function RonHalvingTable({ fu, caption }: RonHalvingTableProps) {
  const t = await getTranslations("learnCurriculum.scoreTable");
  const rows = buildRonHalvingRows(fu);

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-surface-700">{caption}</p>
      <HanRowsTable
        rows={rows}
        columns={[
          {
            header: t("colKoRon"),
            render: (row) => row.ron,
            className: "text-surface-500",
          },
          {
            header: t("colDerived"),
            render: (row) => <TsumoScore payment={row.derived} />,
            className: "font-semibold text-primary-600",
          },
          {
            header: t("colActualPay"),
            render: (row) => <TsumoScore payment={row.actual} />,
            className: "text-surface-700",
          },
        ]}
      />
    </div>
  );
}
