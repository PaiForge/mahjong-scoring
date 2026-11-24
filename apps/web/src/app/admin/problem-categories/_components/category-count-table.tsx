import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { NUMBER_CELL_CLASSES } from "@/app/admin/_components/stats-table-cells";
import { TableHead } from "@/app/admin/_components/table-head";
import { ARCHIVE_KINDS } from "@mahjong-scoring/core";

/** 表の 1 行（分類 1 つ、または印 1 つ） */
export interface CategoryCountTableRow {
  readonly key: string;
  readonly label: string;
  /** 該当する問題の一覧への URL */
  readonly href: string;
  /** いま一覧に出している行か */
  readonly current: boolean;
  /** 種別（`ARCHIVE_KINDS`）→ 当てはまる問題の数 */
  readonly counts: Readonly<Record<string, number>>;
}

/**
 * 分類（またはルールで変わる印）ごとの問題数の表
 * 問題分類件数テーブル
 *
 * 列は左から 名前 / 和了形 / 聴牌形 / 合計。名前は該当する問題の一覧への
 * リンクで、いま一覧に出している行は `aria-current` で示す。数えているのは問題の数で、
 * 和了の数ではない（待ちを複数持つ聴牌形も 1 問）。
 */
export async function CategoryCountTable({
  rows,
  nameLabel,
}: {
  readonly rows: readonly CategoryCountTableRow[];
  /** 名前の列の見出し（「分類」/「ルール」） */
  readonly nameLabel: string;
}) {
  const t = await getTranslations("admin.problemCategories.counts");
  const tKinds = await getTranslations("admin.practiceProblemStats.kinds");

  return (
    <div className="admin-table">
      <table className="w-full text-left text-sm">
        <TableHead
          labels={[
            nameLabel,
            // 例: admin.practiceProblemStats.kinds.agari-score
            ...ARCHIVE_KINDS.map((kind) => tKinds(kind)),
            t("total"),
          ]}
        />
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-surface-200">
              <td className="px-4 py-3 whitespace-nowrap">
                <Link
                  href={row.href}
                  aria-current={row.current ? "true" : undefined}
                  className={`${TEXT_LINK_CLASSES} ${row.current ? "font-bold" : ""}`}
                >
                  {row.label}
                </Link>
              </td>
              {ARCHIVE_KINDS.map((kind) => (
                <td key={kind} className={NUMBER_CELL_CLASSES}>
                  {(row.counts[kind] ?? 0).toLocaleString("ja-JP")}
                </td>
              ))}
              <td className={NUMBER_CELL_CLASSES}>
                {ARCHIVE_KINDS.reduce(
                  (sum, kind) => sum + (row.counts[kind] ?? 0),
                  0,
                ).toLocaleString("ja-JP")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
