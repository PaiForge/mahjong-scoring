import type { JudgementVerdict } from "@mahjong-scoring/features/results/result-schemas";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { borderWidth, colors } from "../../lib/theme";

/** 内訳の表の 1 行 */
export interface DetailTableRow {
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly tone?: JudgementVerdict;
}

const TONE_COLOR: Readonly<Record<JudgementVerdict, string>> = {
  correct: colors.success,
  incorrect: colors.destructive,
};

interface DetailTableProps {
  readonly title?: string;
  readonly rows: readonly DetailTableRow[];
  /** 合計の行（一段濃い灰の線で区切る） */
  readonly total?: Omit<DetailTableRow, "tone">;
  /**
   * 合計の後に出す最終的な値（符の「切り上げ後 40符」）。表の結論なので、
   * 値を表の中でいちばん大きく濃くする（web の `DetailTable` と同じ）
   */
  readonly conclusion?: {
    readonly label: string;
    readonly value: string;
  };
  readonly note?: string;
}

/** 文字列・数はそのまま Text に、要素はそのまま置く */
function Cell({
  value,
  color,
  bold = false,
  align,
}: {
  readonly value: ReactNode;
  readonly color: string;
  readonly bold?: boolean;
  readonly align: "left" | "right";
}) {
  if (typeof value === "string" || typeof value === "number") {
    return (
      <Text
        style={[styles.text, { color, textAlign: align }, bold && styles.bold]}
      >
        {value}
      </Text>
    );
  }
  return (
    <View style={align === "right" ? styles.alignRight : undefined}>
      {value}
    </View>
  );
}

/**
 * ラベルと値の 2 列の表（web の `DetailTable`）
 * 内訳表
 *
 * 答え合わせ（正解とあなたの回答）や符・翻の内訳に使う。
 *
 * 合計がそのまま答えにならないとき（符の切り上げ）は `conclusion` で答えを
 * 合計の下に据える。小さな補足（「32符 → 40符（切り上げ）」）では、内訳の
 * 合計と答えのどちらが正解なのかが一目で読めない。強調は結論の 1 か所だけ。
 */
export function DetailTable({
  title,
  rows,
  total,
  conclusion,
  note,
}: DetailTableProps) {
  return (
    <View style={styles.root}>
      {title !== undefined && <Text style={styles.title}>{title}</Text>}
      <View>
        {rows.map((row, i) => (
          <View key={i} style={[styles.row, i > 0 && styles.rowDivider]}>
            <View style={styles.labelCell}>
              <Cell value={row.label} color={colors.surface500} align="left" />
            </View>
            <View style={styles.valueCell}>
              <Cell
                value={row.value}
                color={row.tone ? TONE_COLOR[row.tone] : colors.surface600}
                align="right"
              />
            </View>
          </View>
        ))}
        {total !== undefined && (
          <View style={[styles.row, styles.totalRow]}>
            <View style={styles.labelCell}>
              <Cell
                value={total.label}
                color={colors.surface700}
                bold
                align="left"
              />
            </View>
            <View style={styles.valueCell}>
              <Cell
                value={total.value}
                color={colors.surface700}
                bold
                align="right"
              />
            </View>
          </View>
        )}
      </View>
      {conclusion !== undefined && (
        <View style={styles.conclusion}>
          <Text style={styles.conclusionLabel}>{conclusion.label}</Text>
          <Text style={styles.conclusionValue}>{conclusion.value}</Text>
        </View>
      )}
      {note !== undefined && <Text style={styles.note}>{note}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface900,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  rowDivider: {
    borderTopWidth: borderWidth.panel,
    borderTopColor: colors.surface100,
  },
  totalRow: {
    borderTopWidth: borderWidth.panel,
    borderTopColor: colors.surface300,
  },
  labelCell: {
    paddingRight: 16,
  },
  valueCell: {
    flex: 1,
    alignItems: "flex-end",
  },
  alignRight: {
    alignItems: "flex-end",
  },
  text: {
    fontSize: 14,
  },
  bold: {
    fontWeight: "700",
  },
  conclusion: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
    gap: 8,
  },
  conclusionLabel: {
    fontSize: 12,
    color: colors.surface500,
  },
  conclusionValue: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.surface900,
  },
  note: {
    textAlign: "right",
    fontSize: 12,
    color: colors.surface500,
  },
});
