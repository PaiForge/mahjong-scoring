import { getTranslations } from "next-intl/server";

import {
  DataTable,
  DataTableHeaderCell,
} from "@/app/(user)/_components/data-table";

import { buildExtraFuRows } from "../_lib/extra-fu-rows";

/**
 * 積み上げた符から符を引く対応表
 * 積み上げ符対応表
 *
 * 行は `buildExtraFuRows`（core の `menzenFu` 由来）が組み立てるので、
 * 符も行のまとまりもここには書かない。読む向きは他の章の点数表と揃えて
 * 左の見出しが条件・右へ結果が伸びる形にしている。
 */
export async function ExtraFuTable() {
  const t = await getTranslations("menzenScore.learn");
  const rows = buildExtraFuRows();

  return (
    <div className="w-full overflow-x-auto">
      <DataTable
        tableClassName="text-center"
        header={
          <>
            <DataTableHeaderCell align="left">
              {t("colExtraFu")}
            </DataTableHeaderCell>
            <DataTableHeaderCell>{t("colTsumo")}</DataTableHeaderCell>
            <DataTableHeaderCell>{t("colRon")}</DataTableHeaderCell>
          </>
        }
      >
        {rows.map((row) => (
          <tr key={row.from} className="bg-white">
            <td className="px-4 py-3 text-left font-medium whitespace-nowrap text-surface-600">
              {row.from === row.to
                ? t("fuUnit", { value: row.from })
                : t("fuRange", { from: row.from, to: row.to })}
            </td>
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
