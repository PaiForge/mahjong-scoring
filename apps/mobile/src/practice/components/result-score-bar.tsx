import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { colors, radius } from "../../lib/theme";

/**
 * 正解・不正解の割合の帯（web の `ResultScoreBar`）
 */
export function ResultScoreBar({
  correct,
  total,
}: {
  readonly correct: number;
  readonly total: number;
}) {
  const tc = useTranslations("challenge");
  const safeTotal = Math.max(total, 0);
  const safeCorrect = Math.max(Math.min(correct, safeTotal), 0);
  const incorrect = safeTotal - safeCorrect;
  const accuracy =
    safeTotal > 0 ? Math.round((safeCorrect / safeTotal) * 100) : 0;

  return (
    <View style={styles.root}>
      <View
        style={styles.bar}
        accessible
        accessibilityLabel={tc("resultAccuracy", { accuracy })}
      >
        {safeCorrect > 0 && (
          <View
            style={[
              styles.segment,
              { flex: safeCorrect, backgroundColor: colors.primary500 },
            ]}
          >
            <Text style={styles.segmentText}>{safeCorrect}</Text>
          </View>
        )}
        {incorrect > 0 && (
          <View
            style={[
              styles.segment,
              { flex: incorrect, backgroundColor: colors.destructive },
            ]}
          >
            <Text style={styles.segmentText}>{incorrect}</Text>
          </View>
        )}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View
              style={[styles.swatch, { backgroundColor: colors.primary500 }]}
            />
            <Text style={styles.legendText}>
              {tc("correct")}: <Text style={styles.strong}>{safeCorrect}</Text>
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.swatch, { backgroundColor: colors.destructive }]}
            />
            <Text style={styles.legendText}>
              {tc("incorrect")}: <Text style={styles.strong}>{incorrect}</Text>
            </Text>
          </View>
        </View>
        <Text style={[styles.legendText, styles.strong]}>
          {tc("resultAccuracy", { accuracy })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  bar: {
    flexDirection: "row",
    height: 32,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surface100,
  },
  segment: {
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  legendItems: {
    flexDirection: "row",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: colors.surface600,
  },
  strong: {
    fontWeight: "600",
    color: colors.surface800,
  },
});
