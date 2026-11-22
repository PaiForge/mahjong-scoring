import { getTranslations } from "next-intl/server";

import { NUMBER_CELL_CLASSES } from "@/app/admin/_components/stats-table-cells";
import { TableHead } from "@/app/admin/_components/table-head";
import type { ProblemFacetCoverage } from "@/lib/practice-problems/facets";
import { ARCHIVE_KINDS } from "@mahjong-scoring/core";

/** 列の並び（左から）。見出しの辞書キー `admin.problemCategories.coverage.columns.<key>` と同じ */
const COLUMNS = ["kind", "total", "ok", "failed", "missing"] as const;

/** 数の列（`COLUMNS` の 2 列目以降） */
const COUNTS = ["total", "ok", "failed", "missing"] as const;

/**
 * 属性の網羅の状況の表（種別ごと + 合計）
 * 属性網羅テーブル
 *
 * 「計算済み」をひとまとめにせず、成功・失敗・未計算と全件数を分けて出す。分類の件数は
 * 成功の列の問題だけを数えているので、この表が分類の表の分母になる。行は
 * `ARCHIVE_KINDS` の順で、DB に行が無い種別も 0 で並べる。
 */
export async function CoverageTable({
  rows,
}: {
  readonly rows: readonly ProblemFacetCoverage[];
}) {
  const t = await getTranslations("admin.problemCategories");
  const tKinds = await getTranslations("admin.practiceProblemStats.kinds");
  const rowByKind = new Map(rows.map((row) => [row.kind, row]));
  const totals = Object.fromEntries(
    COUNTS.map((key) => [
      key,
      ARCHIVE_KINDS.reduce(
        (sum, kind) => sum + (rowByKind.get(kind)?.[key] ?? 0),
        0,
      ),
    ]),
  );

  return (
    <div className="admin-table">
      <table className="w-full text-left text-sm">
        {/* 例: admin.problemCategories.coverage.columns.missing */}
        <TableHead
          labels={COLUMNS.map((key) => t(`coverage.columns.${key}`))}
        />
        <tbody>
          {ARCHIVE_KINDS.map((kind) => (
            <tr key={kind} className="border-t border-surface-200">
              <td className="px-4 py-3 whitespace-nowrap">
                {/* 例: admin.practiceProblemStats.kinds.tenpai-score */}
                {tKinds(kind)}
              </td>
              {COUNTS.map((key) => (
                <td key={key} className={NUMBER_CELL_CLASSES}>
                  {(rowByKind.get(kind)?.[key] ?? 0).toLocaleString("ja-JP")}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t border-surface-200 font-semibold">
            <td className="px-4 py-3 whitespace-nowrap">
              {t("coverage.totalRow")}
            </td>
            {COUNTS.map((key) => (
              <td key={key} className={NUMBER_CELL_CLASSES}>
                {(totals[key] ?? 0).toLocaleString("ja-JP")}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
