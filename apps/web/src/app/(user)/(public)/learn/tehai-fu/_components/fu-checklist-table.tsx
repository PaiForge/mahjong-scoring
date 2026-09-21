import { getTranslations } from "next-intl/server";

import {
  DataTable,
  DataTableHeaderCell,
} from "@/app/(user)/_components/data-table";

/**
 * 符が付く場所
 *
 * 和了の状況だけで決まる符（副底・門前ロンの加符・ツモ符）を先に置き、
 * 手牌を見て数える符（待ち・雀頭・面子）を後に置く。数える順番そのものは
 * 読者に委ねているので、この並びは覚える順の目安でしかない。
 */
const CHECKLIST_ROWS = [
  "futei",
  "menzenRon",
  "tsumo",
  "machi",
  "jantou",
  "mentsu",
] as const;

/**
 * 符を数える場所のチェックリスト
 * 符チェックリスト
 *
 * 数える順番は手順ではなく読者の好みなので、番号を振らず「場所」を並べる。
 * 各行は場所・付く条件・符の3つを持つが、条件は狭い画面で折り返すと表が
 * 縦に伸びるため、列を足さず場所の下に小さく添える。
 */
export async function FuChecklistTable() {
  const t = await getTranslations("tehaiFu.learn");

  return (
    <DataTable
      header={
        <>
          <DataTableHeaderCell align="left">
            {t("checklistColPlace")}
          </DataTableHeaderCell>
          <DataTableHeaderCell align="right">
            {t("checklistColFu")}
          </DataTableHeaderCell>
        </>
      }
    >
      {CHECKLIST_ROWS.map((key) => (
        <tr key={key} className="bg-white">
          <td className="px-4 py-3">
            <span className="font-medium text-surface-900">
              {t(`checklistRows.${key}.label`)}
            </span>
            <span className="mt-0.5 block text-xs text-surface-500">
              {t(`checklistRows.${key}.condition`)}
            </span>
          </td>
          <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-primary-600">
            {t(`checklistRows.${key}.fu`)}
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
