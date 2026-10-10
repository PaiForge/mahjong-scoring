import type { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

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
  /**
   * 見出しのセルに足す体裁（列の番号を受ける）。表の中の 1 か所を指す
   * ハイライト（点数早見表の正解の列）に使う
   */
  readonly headerCellStyle?: (column: number) =>
    | {
        readonly cell?: StyleProp<ViewStyle>;
        readonly text?: StyleProp<TextStyle>;
      }
    | undefined;
  /** 本体のセルに足す体裁（行と列の番号を受ける）。ハイライトに使う */
  readonly cellStyle?: (row: number, column: number) => StyleProp<ViewStyle>;
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
  headerCellStyle,
  cellStyle: extraCellStyle,
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
        {columns.map((col, i) => {
          const extra = headerCellStyle?.(i);
          return (
            <View
              key={i}
              style={[
                cellStyle,
                sizeOf(i),
                { alignItems: justify(i) },
                extra?.cell,
              ]}
            >
              <Text style={[styles.headerText, extra?.text]}>{col.label}</Text>
            </View>
          );
        })}
      </View>
      {rows.map((cells, r) => (
        <View key={r} style={[styles.row, r > 0 && styles.divider]}>
          {cells.map((cell, i) => (
            <View
              key={i}
              style={[
                cellStyle,
                sizeOf(i),
                { alignItems: justify(i) },
                extraCellStyle?.(r, i),
              ]}
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
    // セルを行の高さいっぱいに伸ばす（中身はセルの justifyContent で縦中央）。
    // 伸ばさないとハイライトの塗りが行の途中で切れる
    alignItems: "stretch",
  },
  header: {
    backgroundColor: colors.surface50,
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
