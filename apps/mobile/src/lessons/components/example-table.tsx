import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";

import { DataTable } from "../../components/data-table";
import { SectionTitle } from "../../components/section-title";
import { TableCaption } from "./guide-text";
import { MutedCell, PlainCell, StrongCell } from "./table-cells";
import { CellTiles } from "./tile-row";

/** 例示表の 1 行 */
export interface ExampleTableRow {
  /** 牌のセルの中身（`TileSet` / `MentsuSet` / `MachiTiles` を `xs` で） */
  readonly tiles: ReactNode;
  /** 翻訳済みの種類ラベル */
  readonly label: string;
  /** 符数（0 のときは控えめなスタイルで表示） */
  readonly fu: number;
}

/**
 * 符の章の翻訳と例示表の列見出し（web の `loadExampleTableColumns`）
 * 例示表列定義
 *
 * 列見出しは `learnCurriculum.exampleTable` を章をまたいで共有し、符の書式
 * （`fuUnit`）だけ章の名前空間から引く。
 *
 * @param namespace 章の辞書の名前空間
 * @param colTilesKey 牌の列の見出しを章の辞書で差し替えるときのキー
 */
export function useExampleTableColumns(
  namespace: string,
  colTilesKey?: string,
) {
  const t = useTranslations(namespace);
  const tTable = useTranslations("learnCurriculum.exampleTable");
  return {
    colTiles: colTilesKey === undefined ? tTable("colTiles") : t(colTilesKey),
    colKind: tTable("colKind"),
    colFu: tTable("colFu"),
    formatFu: (value: number) => t("fuUnit", { value }),
  };
}

/** 例示表と早見表が受け取る列見出しと符の書式 */
export type ExampleTableColumns = ReturnType<typeof useExampleTableColumns>;

/**
 * 教本の例示表（牌×種類×符の3列テーブル）（web の `ExampleTable`）
 * 例示表
 */
export function ExampleTable({
  title,
  columns,
  rows,
}: {
  readonly title: string;
  readonly columns: ExampleTableColumns;
  readonly rows: readonly ExampleTableRow[];
}) {
  return (
    <View style={styles.block}>
      <TableCaption>{title}</TableCaption>
      <DataTable
        columns={[
          { label: columns.colTiles, flex: 1.6 },
          { label: columns.colKind, flex: 1.5 },
          { label: columns.colFu, align: "right", flex: 0.7 },
        ]}
        rows={rows.map((row) => [
          <CellTiles key="tiles">{row.tiles}</CellTiles>,
          row.fu > 0 ? (
            <PlainCell key="label">{row.label}</PlainCell>
          ) : (
            <MutedCell key="label" tone={500}>
              {row.label}
            </MutedCell>
          ),
          row.fu > 0 ? (
            <StrongCell key="fu">{columns.formatFu(row.fu)}</StrongCell>
          ) : (
            <MutedCell key="fu">{columns.formatFu(row.fu)}</MutedCell>
          ),
        ])}
      />
    </View>
  );
}

/** 符の早見表の 1 行 */
export interface FuSummaryRow {
  readonly label: string;
  readonly fu: number;
}

/**
 * 符の早見表（種類×符の2列テーブル）（web の `FuSummaryTable`）
 * 符早見表
 */
export function FuSummaryTable({
  title,
  colType,
  colFu,
  formatFu,
  rows,
}: {
  readonly title: string;
  readonly colType: string;
  readonly colFu: string;
  readonly formatFu: (value: number) => string;
  readonly rows: readonly FuSummaryRow[];
}) {
  return (
    <View style={styles.section}>
      <SectionTitle>{title}</SectionTitle>
      <DataTable
        columns={[
          { label: colType, flex: 3 },
          { label: colFu, align: "right", flex: 1 },
        ]}
        rows={rows.map((row) => [
          row.fu > 0 ? (
            <PlainCell key="label">{row.label}</PlainCell>
          ) : (
            <MutedCell key="label" tone={500}>
              {row.label}
            </MutedCell>
          ),
          row.fu > 0 ? (
            <StrongCell key="fu">{formatFu(row.fu)}</StrongCell>
          ) : (
            <MutedCell key="fu">{formatFu(row.fu)}</MutedCell>
          ),
        ])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  section: {
    gap: 16,
  },
});
