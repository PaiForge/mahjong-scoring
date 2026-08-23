import {
  formatPoints,
  ManganTableShell,
  type ManganTableColumn,
} from "../../_components/mangan-table-shell";

const COLUMNS: readonly ManganTableColumn[] = [
  { headerKey: "colKoEach", align: "right", cellClassName: "text-surface-700" },
  { headerKey: "colOya", align: "right", cellClassName: "text-surface-700" },
  {
    headerKey: "colTotal",
    align: "right",
    cellClassName: "font-semibold text-primary-600",
  },
];

/**
 * 子ツモ（満貫以上）の点数早見表（種類×翻数×子の支払い×親の支払い×合計）
 * 子ツモ満貫以上早見表
 *
 * 子ツモは「子・子・親」で分担し、親だけが倍額を払う。合計はロンと等しく、
 * それを 3 人で分け合っているだけであることを示すため合計列を持つ。
 */
export function ManganKoTsumoScoreTable() {
  return (
    <ManganTableShell
      columns={COLUMNS}
      showHan={false}
      renderCells={(row) => {
        const { fromKo, fromOya } = row.tsumoKo;
        return [
          formatPoints(fromKo),
          formatPoints(fromOya),
          formatPoints(fromKo * 2 + fromOya),
        ];
      }}
    />
  );
}
