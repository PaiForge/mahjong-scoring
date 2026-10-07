import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { panelFrame } from "../lib/panel-styles";
import { colors } from "../lib/theme";

/** 表の列 */
export interface DataTableColumn {
  readonly label: string;
  readonly align?: "left" | "right" | "center";
  /** 列幅の比（flex）。省略時は 1 */
  readonly flex?: number;
  /** 固定幅（px）。指定すると flex より優先し、残りを他の列が分ける */
  readonly width?: number;
}

/** セルの余白の段階（web の `DataTableHeaderCell` の `density`） */
export type DataTableDensity = "regular" | "dense";

interface DataTableProps {
  readonly columns: readonly DataTableColumn[];
  /** 行ごとのセル。文字列・数はそのまま Text にする */
  readonly rows: readonly (readonly ReactNode[])[];
  /** セルの余白。列が多く狭い表（点数表など）は "dense" で詰める */
  readonly density?: DataTableDensity;
}

/**
 * データテーブル（web の `DataTable` = 細枠・淡い緑の見出し行・淡い実線の行区切り）
 *
 * 表を作るときは直接 View を並べずこれを使う。
 */
export function DataTable({
  columns,
  rows,
  density = "regular",
}: DataTableProps) {
  const sizeOf = (i: number) => {
    const col = columns[i];
    return col?.width === undefined
      ? { flex: col?.flex ?? 1 }
      : { width: col.width, flexGrow: 0, flexShrink: 0 };
  };
  const cellStyle = density === "dense" ? styles.cellDense : styles.cell;
  const alignOf = (i: number) => columns[i]?.align ?? "left";
  const justify = (i: number) =>
    alignOf(i) === "right"
      ? "flex-end"
      : alignOf(i) === "center"
        ? "center"
        : "flex-start";
  return (
    <View style={styles.frame}>
      <View style={[styles.row, styles.header]}>
        {columns.map((col, i) => (
          <View
            key={i}
            style={[cellStyle, sizeOf(i), { alignItems: justify(i) }]}
          >
            <Text style={styles.headerText}>{col.label}</Text>
          </View>
        ))}
      </View>
      {rows.map((cells, r) => (
        <View key={r} style={[styles.row, r > 0 && styles.divider]}>
          {cells.map((cell, i) => (
            <View
              key={i}
              style={[cellStyle, sizeOf(i), { alignItems: justify(i) }]}
            >
              {typeof cell === "string" || typeof cell === "number" ? (
                <Text style={[styles.text, { textAlign: alignOf(i) }]}>
                  {cell}
                </Text>
              ) : (
                cell
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: panelFrame,
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  header: {
    backgroundColor: colors.primary50,
    borderBottomWidth: 1,
    borderBottomColor: colors.panel,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.surface100,
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
  },
  cellDense: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    justifyContent: "center",
  },
  headerText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.surface600,
  },
  text: {
    fontSize: 14,
    color: colors.surface700,
  },
});
