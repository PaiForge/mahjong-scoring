import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { YakuHanEntry } from "@mahjong-scoring/core";
import { buildNakiComparisonGroups } from "@mahjong-scoring/features/yaku/naki-comparison";
import { yakuHanLabel } from "@mahjong-scoring/features/yaku/yaku-han-label";
import {
  DataTable,
  DataTableHeaderCell,
} from "@/app/(user)/_components/data-table";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { referenceYakuHref } from "@mahjong-scoring/features/yaku/anchors";
import { hasYakuCheatsheetEntry } from "@mahjong-scoring/features/yaku/examples";

/**
 * 門前と鳴きの翻数の比較表
 * 門前鳴き比較表
 *
 * 役ごとに門前と鳴いたときの翻数を並べ、門前限定・食い下がり・鳴いても同じの
 * 3 区分を区切りの行で分ける。載せるのは本文で例に挙げた役だけで、残りは
 * 表の下のリンクから役一覧に任せる（区分と役の選び方は
 * `buildNakiComparisonGroups`）。
 *
 * 各役名は役一覧（/reference/yaku）の該当カードへのリンクで、押すとその役が
 * 開いた状態で着地する。早見表に載らない状況役（立直）だけは素のテキスト。
 */
export async function YakuNakiComparisonTable() {
  const t = await getTranslations("yaku.learn");
  const groups = buildNakiComparisonGroups();

  const nakiCell = (entry: YakuHanEntry) =>
    entry.nakiHan === undefined ? (
      <>
        <span aria-hidden className="text-surface-400">
          {t("notEstablished")}
        </span>
        <span className="sr-only">{t("notEstablishedLabel")}</span>
      </>
    ) : (
      yakuHanLabel(entry.nakiHan, t)
    );

  return (
    <DataTable
      header={
        <>
          <DataTableHeaderCell align="left">{t("colYaku")}</DataTableHeaderCell>
          <DataTableHeaderCell>{t("colMenzen")}</DataTableHeaderCell>
          <DataTableHeaderCell>{t("colNaki")}</DataTableHeaderCell>
        </>
      }
    >
      {groups.map((group) => [
        <tr key={group.kind} className="bg-surface-50">
          <th
            colSpan={3}
            scope="colgroup"
            className="px-4 py-2 text-left text-xs font-semibold text-surface-600"
          >
            {t(`nakiKinds.${group.kind}`)}
          </th>
        </tr>,
        ...group.entries.map((entry) => (
          <tr key={entry.name} className="bg-white">
            <td className="px-4 py-3 text-left text-surface-700">
              {hasYakuCheatsheetEntry(entry.name) ? (
                <Link
                  href={referenceYakuHref(entry.name)}
                  className={`inline-block ${TEXT_LINK_CLASSES}`}
                >
                  {entry.name}
                </Link>
              ) : (
                entry.name
              )}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-center text-foreground">
              {yakuHanLabel(entry.menzenHan, t)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-center text-foreground">
              {nakiCell(entry)}
            </td>
          </tr>
        )),
      ])}
    </DataTable>
  );
}
