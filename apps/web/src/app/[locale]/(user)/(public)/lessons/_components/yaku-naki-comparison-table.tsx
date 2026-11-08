import { getLocale, getTranslations } from "next-intl/server";
import type { YakuHanEntry } from "@mahjong-scoring/core";
import { buildNakiComparisonGroups } from "@mahjong-scoring/features/yaku/naki-comparison";
import { yakuHanLabel } from "@mahjong-scoring/features/yaku/yaku-han-label";
import {
  DataTable,
  DataTableHeaderCell,
} from "@/app/[locale]/(user)/_components/data-table";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import type { NavTarget } from "@/app/[locale]/(user)/_components/_lib/locale-links";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import { referenceYakuHref } from "@mahjong-scoring/features/yaku/anchors";
import { hasYakuCheatsheetEntry } from "@mahjong-scoring/features/yaku/examples";
import { YAKU_TO_KEY } from "@mahjong-scoring/features/yaku/yaku-labels";

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
 *
 * 役名は core の名前（日本語）を直接出さず、辞書 `yakuNames`（キーは
 * `YAKU_TO_KEY`、日本語の値は core の名前と同じ文字列）から引く。英語の章に
 * 漢字の役名を残さないため。アンカー（`referenceYakuHref`）は core の名前の
 * まま — 役一覧の id はどの言語でも同じにしてある。
 *
 * 役一覧へのリンクはページの言語で解決する（`resolveNavTargetFor`）。役一覧が
 * その言語で出ていなければ日本語の役一覧へ「日本語のみ」の印付きで張る。
 * 言語は `getLocale()` で取る — 章本文の部品の中から描かれ、言語を props で
 * 渡す経路が無いため。ページの入口（`prepareRouteLocale`）が先に
 * `setRequestLocale` を済ませているので headers を読まない。
 */
export async function YakuNakiComparisonTable() {
  const [t, tYakuNames, tNav, locale] = await Promise.all([
    getTranslations("yaku.learn"),
    getTranslations("yakuNames"),
    getTranslations("nav.language"),
    getLocale(),
  ]);
  const groups = buildNakiComparisonGroups();
  const yakuName = (name: string) => {
    const key = YAKU_TO_KEY[name];
    return key === undefined ? name : tYakuNames(key);
  };

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
                <YakuCheatsheetLink
                  navTarget={resolveNavTargetFor(
                    referenceYakuHref(entry.name),
                    locale,
                  )}
                  label={yakuName(entry.name)}
                  japaneseOnlyLabel={tNav("japaneseOnly")}
                />
              ) : (
                yakuName(entry.name)
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

/** 役一覧の該当カードへのリンク（言語をまたぐときは「日本語のみ」を添える） */
function YakuCheatsheetLink({
  navTarget,
  label,
  japaneseOnlyLabel,
}: {
  readonly navTarget: NavTarget;
  readonly label: string;
  readonly japaneseOnlyLabel: string;
}) {
  return (
    <>
      <LocaleNavLink
        navTarget={navTarget}
        linkKind="plain"
        className={`inline-block ${TEXT_LINK_CLASSES}`}
      >
        {label}
      </LocaleNavLink>
      {navTarget.crossLocale && <JapaneseOnlyMark label={japaneseOnlyLabel} />}
    </>
  );
}
