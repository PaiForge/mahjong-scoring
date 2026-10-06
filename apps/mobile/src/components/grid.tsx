import { Children, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

/**
 * 列数を決めて並べるグリッド（web の `grid grid-cols-N gap-3`）
 * グリッド
 *
 * React Native の flexWrap は「幅 % + gap」で列数がずれる（端数で 1 列減る）
 * ため、行ごとに分けて各セルを等幅にする。最後の行の空きは空のセルで埋め、
 * セルの幅を他の行と揃える（web のグリッドと同じく、余りのセルが伸びない）。
 */
export function Grid({
  columns,
  gap = 12,
  children,
}: {
  readonly columns: number;
  readonly gap?: number;
  readonly children: ReactNode;
}) {
  const cells = Children.toArray(children);
  const rows: ReactNode[][] = [];
  for (let i = 0; i < cells.length; i += columns) {
    rows.push(cells.slice(i, i + columns));
  }
  return (
    <View style={{ gap }}>
      {rows.map((row, r) => (
        <View key={r} style={[styles.row, { gap }]}>
          {row.map((cell, c) => (
            <View key={c} style={styles.cell}>
              {cell}
            </View>
          ))}
          {Array.from({ length: columns - row.length }, (_, i) => (
            <View key={`empty-${i}`} style={styles.cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    minWidth: 0,
  },
});
