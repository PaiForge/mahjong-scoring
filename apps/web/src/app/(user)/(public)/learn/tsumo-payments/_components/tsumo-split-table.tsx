import { getTranslations } from "next-intl/server";

import {
  DataTable,
  DataTableHeaderCell,
  DataTableRowHeaderCell,
} from "@/app/(user)/_components/data-table";
import { TsumoScore } from "@/app/(user)/(public)/reference/score-table/_components/tsumo-score";

import { buildTsumoSplitRows } from "../_lib/tsumo-payment-rows";

interface TsumoSplitTableProps {
  /** 対象の符。4翻でも満貫に届かない符を渡すこと（30符など） */
  readonly fu: number;
  /** 表の上に出す見出し */
  readonly caption: string;
}

/**
 * 子ツモの2つの数字を切り上げ前後で並べた表
 * 子ツモの内訳表
 *
 * 切り上げる前の欄も実際の欄も同じ {@link TsumoScore} で描く。上段＝子から /
 * 下段＝親から という読み方が2つの欄で揃うので、「切り上げ前は下段が上段の
 * ちょうど2倍」「切り上げ後はそうならない行がある」を同じ目の動きで比べられる。
 * 片方だけ素の数字にすると、読者は列ごとに読み方を切り替える羽目になる。
 */
export async function TsumoSplitTable({ fu, caption }: TsumoSplitTableProps) {
  const t = await getTranslations("learnCurriculum.scoreTable");
  const rows = buildTsumoSplitRows(fu);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wider text-surface-400 uppercase">
        {caption}
      </h3>
      <div className="w-full overflow-x-auto">
        <DataTable
          tableClassName="text-center"
          header={
            <>
              <DataTableHeaderCell align="left">
                {t("colHan")}
              </DataTableHeaderCell>
              <DataTableHeaderCell>{t("colBeforeCeil")}</DataTableHeaderCell>
              <DataTableHeaderCell>{t("colActualPay")}</DataTableHeaderCell>
            </>
          }
        >
          {rows.map((row) => (
            <tr key={row.han} className="bg-white">
              <DataTableRowHeaderCell>
                {t("hanUnit", { value: row.han })}
              </DataTableRowHeaderCell>
              <td className="px-4 py-3 text-surface-500">
                <TsumoScore payment={row.beforeCeil} />
              </td>
              <td className="px-4 py-3 font-semibold text-primary-600">
                <TsumoScore payment={row.actual} />
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
