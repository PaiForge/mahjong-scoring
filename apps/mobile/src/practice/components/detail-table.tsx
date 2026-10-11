import type { JudgementVerdict } from "@mahjong-scoring/features/results/result-schemas";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { linkStyles } from "../../lib/link-styles";
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
  /**
   * 答えの値（`conclusion` があればその値、無ければ合計の値）を押したときの
   * 処理。渡すとその値に点線の下線を敷き、押すと点数表が開く（web では
   * 置く側が値をボタンにする）。切り上げ前の合計は点数表の行に無いので、
   * 結論があるときは合計を押せるようにしない
   */
  readonly answerLink?: {
    readonly onPress: () => void;
    /** 押すと何が起きるか（「点数表で見る」） */
    readonly accessibilityHint: string;
  };
}

/** Maestro のフローで引く、押すと点数表が開く答えの値の印 */
const ANSWER_LINK_TEST_ID = "detail-table-answer-link";

/** 文字列・数はそのまま Text に、要素はそのまま置く */
function Cell({
  value,
  color,
  bold = false,
  align,
  link,
}: {
  readonly value: ReactNode;
  readonly color: string;
  readonly bold?: boolean;
  readonly align: "left" | "right";
  readonly link?: DetailTableProps["answerLink"];
}) {
  if (typeof value === "string" || typeof value === "number") {
    return (
      <Text
        onPress={link?.onPress}
        accessibilityRole={link === undefined ? undefined : "button"}
        accessibilityHint={link?.accessibilityHint}
        testID={link === undefined ? undefined : ANSWER_LINK_TEST_ID}
        style={[
          styles.text,
          { color, textAlign: align },
          bold && styles.bold,
          link !== undefined && linkStyles.scoreTableValue,
        ]}
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
  answerLink,
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
                link={conclusion === undefined ? answerLink : undefined}
              />
            </View>
          </View>
        )}
      </View>
      {conclusion !== undefined && (
        <View style={styles.conclusion}>
          <Text style={styles.conclusionLabel}>{conclusion.label}</Text>
          <Text
            onPress={answerLink?.onPress}
            accessibilityRole={answerLink === undefined ? undefined : "button"}
            accessibilityHint={answerLink?.accessibilityHint}
            testID={answerLink === undefined ? undefined : ANSWER_LINK_TEST_ID}
            style={[
              styles.conclusionValue,
              answerLink !== undefined && linkStyles.scoreTableValue,
            ]}
          >
            {conclusion.value}
          </Text>
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
