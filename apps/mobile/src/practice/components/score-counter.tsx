import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { colors } from "../../lib/theme";
import { JudgementMark } from "./judgement-mark";

interface ScoreCounterProps {
  readonly correct: number;
  readonly incorrect: number;
}

/**
 * 正解 / 不正解のカウンタ（web の `ScoreCounter`）
 *
 * チャレンジとトレーニングで同じ位置（盤面の下）に同じものを置く。
 */
export function ScoreCounter({ correct, incorrect }: ScoreCounterProps) {
  const tc = useTranslations("challenge");
  return (
    <View style={styles.row}>
      <View
        style={styles.item}
        accessible
        accessibilityLabel={`${tc("correct")}: ${correct}`}
      >
        <JudgementMark verdict="correct" variant="badge" />
        <Text style={styles.count}>{correct}</Text>
      </View>
      <View
        style={styles.item}
        accessible
        accessibilityLabel={`${tc("incorrect")}: ${incorrect}`}
      >
        <JudgementMark verdict="incorrect" variant="badge" />
        <Text style={styles.count}>{incorrect}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 48,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  count: {
    minWidth: 30,
    fontSize: 20,
    fontWeight: "700",
    color: colors.surface700,
    fontVariant: ["tabular-nums"],
  },
});
