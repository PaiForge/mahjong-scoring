import { getTranslations } from "next-intl/server";
import { type Role } from "@mahjong-scoring/core";

import {
  DataTable,
  DataTableHeaderCell,
  DataTableRowHeaderCell,
} from "@/app/(user)/_components/data-table";

import { buildHanDoublingRows } from "../_lib/fu-doubling-rows";

interface HanDoublingTableProps {
  /** 対象の符。4翻でも満貫に届かない符を渡すこと（30符など） */
  readonly fu: number;
  readonly role: Role;
  /** 表の上に出す見出し（「子のロン（30符）」等） */
  readonly caption: string;
}

/**
 * 翻を1つずつ上げたときの点数を、切り上げ前の値と並べた表
 * 倍々の表
 *
 * 表に載る点数（1000 → 2000 → 3900 → 7700）だけを見ると2倍からずれて
 * 見えるため、切り上げる前の値（960 → 1920 → 3840 → 7680）を隣に置く。
 * 「倍々になっていないように見えるのは100点単位に切り上げているからで、
 * 規則そのものは崩れていない」という一点だけを伝えるための表なので、
 * ツモ（子から / 親から の2口）は載せない。
 */
export async function HanDoublingTable({
  fu,
  role,
  caption,
}: HanDoublingTableProps) {
  const t = await getTranslations("learnCurriculum.scoreTable");
  const rows = buildHanDoublingRows(fu, role);

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
              <DataTableHeaderCell>{t("colScore")}</DataTableHeaderCell>
            </>
          }
        >
          {rows.map((row) => (
            <tr key={row.han} className="bg-white">
              <DataTableRowHeaderCell>
                {t("hanUnit", { value: row.han })}
              </DataTableRowHeaderCell>
              <td className="px-4 py-3 text-surface-500">{row.beforeCeil}</td>
              <td className="px-4 py-3 font-semibold text-primary-600">
                {row.ron}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
