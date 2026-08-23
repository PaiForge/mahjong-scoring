import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  YAKU_HAN_ENTRIES,
  YAKUMAN_HAN,
  groupYakuHanEntriesByMenzenHan,
} from "@mahjong-scoring/core";
import {
  DataTable,
  DataTableHeaderCell,
} from "@/app/(user)/_components/data-table";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { referenceYakuHref } from "@/app/(user)/(public)/reference/yaku/_lib/anchors";
import { hasYakuCheatsheetEntry } from "@/app/(user)/(public)/reference/yaku/_lib/yaku-examples";

/**
 * 翻数別の役まとめ表
 * 翻数別役一覧表
 *
 * 役と翻数は core の YAKU_HAN_ENTRIES を単一ソースとし、辞書側に役名を
 * 持たない（早見表と食い違わないようにするため）。各役名は役一覧
 * （/reference/yaku）の該当カードへのリンクで、押すとその役が開いた状態で
 * 着地する。早見表に載らない状況役（立直・門前清自摸和）だけは素のテキスト。
 *
 * 役名は指で押せる間隔を空けて折り返す。表のセルに詰めて並べると
 * リンクだと気付きにくく、隣の役を誤タップしやすいため。
 */
export async function YakuHanTable() {
  const t = await getTranslations("yaku.learn");

  const groups = groupYakuHanEntriesByMenzenHan(YAKU_HAN_ENTRIES);

  const hanLabel = (han: number) =>
    han === YAKUMAN_HAN ? t("yakuman") : t("hanUnit", { count: han });

  return (
    <DataTable
      header={
        <>
          <DataTableHeaderCell align="left">
            <span className="whitespace-nowrap">{t("colHan")}</span>
          </DataTableHeaderCell>
          <DataTableHeaderCell align="left">
            {t("colYakuList")}
          </DataTableHeaderCell>
        </>
      }
    >
      {groups.map((group) => (
        <tr key={group.han} className="bg-white">
          <td className="whitespace-nowrap px-4 py-3 align-top font-semibold text-primary-600">
            {hanLabel(group.han)}
          </td>
          <td className="px-4 py-3 text-surface-700">
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {group.entries.map((entry) => (
                <li key={entry.name}>
                  {hasYakuCheatsheetEntry(entry.name) ? (
                    <Link
                      href={referenceYakuHref(entry.name)}
                      className={`inline-block py-1 ${TEXT_LINK_CLASSES}`}
                    >
                      {entry.name}
                    </Link>
                  ) : (
                    <span className="inline-block py-1">{entry.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
