import { getTranslations } from "next-intl/server";

import {
  DataTable,
  DataTableHeaderCell,
  DataTableRowHeaderCell,
} from "@/app/(user)/_components/data-table";

import type { FixedHandShape } from "@/app/(user)/(public)/practice/score/_lib/hand-shape-param";

import { buildExtraFuRows } from "../_lib/extra-fu-rows";

interface ExtraFuTableProps {
  /** 門前手 / 副露した手のどちらの表か */
  readonly handShape: FixedHandShape;
}

/**
 * 積み上げた符から符を引く対応表
 * 積み上げ符対応表
 *
 * 行は `buildExtraFuRows`（core の `mentsuTehaiFu` 由来）が組み立てるので、
 * 符も行のまとまりもここには書かない。読む向きは点数表と揃えて左の見出しが
 * 条件・右へ結果が伸びる形にしている。
 */
export async function ExtraFuTable({ handShape }: ExtraFuTableProps) {
  const t = await getTranslations("learnCurriculum.scoreTable");
  const rows = buildExtraFuRows(handShape);

  return (
    <div className="w-full overflow-x-auto">
      <DataTable
        tableClassName="text-center"
        header={
          <>
            <DataTableHeaderCell align="left">
              {t("colExtraFu")}
            </DataTableHeaderCell>
            <DataTableHeaderCell>{t("tsumo")}</DataTableHeaderCell>
            <DataTableHeaderCell>{t("ron")}</DataTableHeaderCell>
          </>
        }
      >
        {rows.map((row) => (
          <tr key={row.from} className="bg-white">
            <DataTableRowHeaderCell>
              {row.from === row.to
                ? t("fuUnit", { value: row.from })
                : t("fuRange", { from: row.from, to: row.to })}
            </DataTableRowHeaderCell>
            <td className="px-4 py-3 font-semibold text-primary-600">
              {t("fuUnit", { value: row.tsumoFu })}
            </td>
            <td className="px-4 py-3 font-semibold text-primary-600">
              {t("fuUnit", { value: row.ronFu })}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
