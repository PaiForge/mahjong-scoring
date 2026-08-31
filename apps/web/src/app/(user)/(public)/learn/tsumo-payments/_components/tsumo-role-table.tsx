import { getTranslations } from "next-intl/server";

import {
  DataTable,
  DataTableHeaderCell,
  DataTableRowHeaderCell,
} from "@/app/(user)/_components/data-table";
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
 * 右の親ツモと同じ色で塗る。子ツモのセルは上下2段なので、そのまま隣の
 * 親ツモと見比べると下段だけを目で拾う必要があるが、抜き出した列を挟めば
 * 同じ数字が横に並ぶ。色の付いた2列が常に同じ数字になっている、という形が
 * この章の主張そのものになる。
 *
 * 青は早見表で「参照している場所」を指す色で、頻出符の琥珀や正解の緑とは
 * 役割が違う。色だけに頼らないよう、表の下に凡例を添える文言を章側が持つ。
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
              <DataTableHeaderCell className="bg-blue-100 text-blue-700">
                {t("colOyaPays")}
              </DataTableHeaderCell>
              <DataTableHeaderCell className="bg-blue-100 text-blue-700">
                {t("colOyaTsumo")}
              </DataTableHeaderCell>
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
              <td className="bg-blue-100 px-4 py-3 font-semibold text-primary-600">
                {row.fromOya}
              </td>
              <td className="bg-blue-100 px-4 py-3 font-semibold text-primary-600">
                <TsumoScore payment={row.oya} />
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
