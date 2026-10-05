import type { Role } from "@mahjong-scoring/core";

import {
  formatPoints,
  ManganTableShell,
  type ManganTableColumn,
} from "./mangan-table-shell";

interface ManganScoreTableProps {
  /** 子・親のどちらの点数を表示するか */
  readonly role: Role;
}

/** nameKey から manganScoreTable 名前空間の備考キーを導出する */
function noteKeyOf(nameKey: string): string {
  return `note${nameKey.charAt(0).toUpperCase()}${nameKey.slice(1)}`;
}

const COLUMNS: readonly ManganTableColumn[] = [
  {
    headerKey: "colScore",
    align: "right",
    cellClassName: "font-semibold text-primary-600",
  },
  { headerKey: "colNote", align: "left", cellClassName: "text-surface-500" },
];

/**
 * 満貫以上の点数早見表（種類×翻数×点数×備考）
 * 満貫以上早見表
 *
 * 満貫以上は翻数だけで点数が決まるため符の列は持たない。点数は core の
 * HIGH_SCORES（ロン）から導出し、子・親で共有する。
 */
export function ManganScoreTable({ role }: ManganScoreTableProps) {
  return (
    <ManganTableShell
      columns={COLUMNS}
      renderCells={(row, t) => [
        formatPoints(role === "ko" ? row.ronKo : row.ronOya),
        t(noteKeyOf(row.nameKey)),
      ]}
    />
  );
}
