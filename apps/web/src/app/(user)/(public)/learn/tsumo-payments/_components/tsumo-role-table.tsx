import { getTranslations } from "next-intl/server";

import {
  DataTable,
  DataTableHeaderCell,
  DataTableRowHeaderCell,
} from "@/app/(user)/_components/data-table";
import { TABLE_HIGHLIGHT_CELL_CLASS } from "@/app/(user)/_components/_lib/table-highlight";
import { TsumoScore } from "@/app/(user)/(public)/reference/score-table/_components/tsumo-score";

import { buildTsumoRoleRows } from "../_lib/tsumo-payment-rows";

interface TsumoRoleTableProps {
  /** 対象の符 */
  readonly fu: number;
  /** 表の上に出す見出し */
  readonly caption: string;
}

/**
 * 子のツモと親のツモを突き合わせた表
 * ツモの親子対応表
 *
 * 中央に「子ツモのうち親が払う額」だけを素の数字で抜き出した列を置き、
 * 右の親ツモと同じ色で塗る。塗るのは値のセルだけで、列見出しには広げない
 * （見出しまで塗ると列そのものを選んでいるように見え、「この2列の値が一致
 * している」という話が読み取りにくくなる）。子ツモのセルは上下2段なので、そのまま隣の
 * 親ツモと見比べると下段だけを目で拾う必要があるが、抜き出した列を挟めば
 * 同じ数字が横に並ぶ。色の付いた2列が常に同じ数字になっている、という形が
 * この章の主張そのものになる。
 *
 * 塗りは早見表と同じ `_lib/table-highlight`（「ここに注目」の琥珀）を使う。
 * 色だけに頼らないよう、表の下に凡例を添える文言を章側が持つ。
 */
export async function TsumoRoleTable({ fu, caption }: TsumoRoleTableProps) {
  const t = await getTranslations("learnCurriculum.scoreTable");
  const rows = buildTsumoRoleRows(fu);

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
              <DataTableHeaderCell>{t("colKoTsumo")}</DataTableHeaderCell>
              <DataTableHeaderCell>{t("colOyaPays")}</DataTableHeaderCell>
              <DataTableHeaderCell>{t("colOyaTsumo")}</DataTableHeaderCell>
            </>
          }
        >
          {rows.map((row) => (
            <tr key={row.han} className="bg-white">
              <DataTableRowHeaderCell>
                {t("hanUnit", { value: row.han })}
              </DataTableRowHeaderCell>
              <td className="px-4 py-3 font-semibold text-primary-600">
                <TsumoScore payment={row.ko} />
              </td>
              <td
                className={`px-4 py-3 font-semibold text-primary-600 ${TABLE_HIGHLIGHT_CELL_CLASS}`}
              >
                {row.fromOya}
              </td>
              <td
                className={`px-4 py-3 font-semibold text-primary-600 ${TABLE_HIGHLIGHT_CELL_CLASS}`}
              >
                <TsumoScore payment={row.oya} />
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
