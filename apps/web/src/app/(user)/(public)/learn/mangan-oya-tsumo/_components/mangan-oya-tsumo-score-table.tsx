import {
  formatPoints,
  ManganTableShell,
  type ManganTableColumn,
} from "../../_components/mangan-table-shell";

const COLUMNS: readonly ManganTableColumn[] = [
  { headerKey: "colKoEach", align: "right", cellClassName: "text-surface-700" },
  {
    headerKey: "colTotal",
    align: "right",
    cellClassName: "font-semibold text-primary-600",
  },
];

/**
 * 親ツモ（満貫以上）の点数早見表（種類×翻数×1人あたり×合計）
 * 親ツモ満貫以上早見表
 *
 * 親ツモは全員が同額を払う（オール）。合計はロンと等しい。
 */
export function ManganOyaTsumoScoreTable() {
  return (
    <ManganTableShell
      columns={COLUMNS}
      showHan={false}
      renderCells={(row) => {
        const each = row.tsumoOya.all;
        return [formatPoints(each), formatPoints(each * 3)];
      }}
    />
  );
}
