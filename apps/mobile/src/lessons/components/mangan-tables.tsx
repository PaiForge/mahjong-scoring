import type { ReactNode } from "react";
import { useTranslations } from "use-intl";
import { HIGH_SCORES, type Role } from "@mahjong-scoring/core";
import { HAN_DISPLAY } from "@mahjong-scoring/features/curriculum/han-display";

import { DataTable, type DataTableColumn } from "../../components/data-table";
import { formatPoints } from "./format-points";
import { MutedCell, PlainCell, StrongCell } from "./table-cells";

/** 満貫以上早見表の1行分のデータ */
type ManganTableRow = (typeof HIGH_SCORES)[number];

/** 種類・翻数に続く列の定義 */
interface ManganTableColumn {
  /** manganScoreTable 名前空間のヘッダーキー */
  readonly headerKey: string;
  readonly align: "left" | "right";
  /** セルの強調 */
  readonly tone: "strong" | "plain" | "muted";
  readonly flex?: number;
}

/**
 * 満貫以上早見表の外殻（web の `ManganTableShell`）
 * 満貫早見表シェル
 *
 * どの表も「種類・翻数」の2列で始まる。各表は続く列の定義とセルの値だけを持つ。
 */
function ManganTableShell({
  columns,
  showHan = true,
  renderCells,
}: {
  readonly columns: readonly ManganTableColumn[];
  readonly showHan?: boolean;
  readonly renderCells: (
    row: ManganTableRow,
    t: (key: string) => string,
  ) => readonly string[];
}) {
  const t = useTranslations("manganScoreTable");
  const tScore = useTranslations("scoreTable");

  const header: DataTableColumn[] = [
    { label: t("colType"), flex: 1.1 },
    ...(showHan
      ? [{ label: t("colHan"), align: "right" as const, flex: 1 }]
      : []),
    ...columns.map((column) => ({
      label: t(column.headerKey),
      align: column.align,
      flex: column.flex ?? 1,
    })),
  ];

  return (
    <DataTable
      columns={header}
      rows={HIGH_SCORES.map((row) => {
        const cells: ReactNode[] = [
          <PlainCell key="type" medium>
            {tScore(row.nameKey)}
          </PlainCell>,
        ];
        if (showHan) {
          cells.push(
            <MutedCell key="han" tone={500}>
              {HAN_DISPLAY[row.nameKey]}
            </MutedCell>,
          );
        }
        renderCells(row, t).forEach((value, index) => {
          const tone = columns[index]?.tone ?? "plain";
          cells.push(
            tone === "strong" ? (
              <StrongCell key={index}>{value}</StrongCell>
            ) : tone === "muted" ? (
              <MutedCell key={index} tone={500}>
                {value}
              </MutedCell>
            ) : (
              <PlainCell key={index}>{value}</PlainCell>
            ),
          );
        });
        return cells;
      })}
    />
  );
}

/** nameKey から manganScoreTable 名前空間の備考キーを導出する */
function noteKeyOf(nameKey: string): string {
  return `note${nameKey.charAt(0).toUpperCase()}${nameKey.slice(1)}`;
}

const SCORE_COLUMNS: readonly ManganTableColumn[] = [
  { headerKey: "colScore", align: "right", tone: "strong" },
  { headerKey: "colNote", align: "left", tone: "muted", flex: 1.3 },
];

/**
 * 満貫以上の点数早見表（種類×翻数×点数×備考）（web の `ManganScoreTable`）
 * 満貫以上早見表
 *
 * @param role 子・親のどちらの点数を表示するか
 */
export function ManganScoreTable({ role }: { readonly role: Role }) {
  return (
    <ManganTableShell
      columns={SCORE_COLUMNS}
      renderCells={(row, t) => [
        formatPoints(role === "ko" ? row.ronKo : row.ronOya),
        t(noteKeyOf(row.nameKey)),
      ]}
    />
  );
}

const KO_TSUMO_COLUMNS: readonly ManganTableColumn[] = [
  { headerKey: "colKoEach", align: "right", tone: "plain" },
  { headerKey: "colOya", align: "right", tone: "plain" },
  { headerKey: "colTotal", align: "right", tone: "strong" },
];

/**
 * 子ツモ（満貫以上）の点数早見表（web の `ManganKoTsumoScoreTable`）
 * 子ツモ満貫以上早見表
 */
export function ManganKoTsumoScoreTable() {
  return (
    <ManganTableShell
      columns={KO_TSUMO_COLUMNS}
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

const OYA_TSUMO_COLUMNS: readonly ManganTableColumn[] = [
  { headerKey: "colKoEach", align: "right", tone: "plain" },
  { headerKey: "colTotal", align: "right", tone: "strong" },
];

/**
 * 親ツモ（満貫以上）の点数早見表（web の `ManganOyaTsumoScoreTable`）
 * 親ツモ満貫以上早見表
 */
export function ManganOyaTsumoScoreTable() {
  return (
    <ManganTableShell
      columns={OYA_TSUMO_COLUMNS}
      showHan={false}
      renderCells={(row) => {
        const each = row.tsumoOya.all;
        return [formatPoints(each), formatPoints(each * 3)];
      }}
    />
  );
}
