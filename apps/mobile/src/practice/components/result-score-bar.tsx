import { Pressable, StyleSheet, Text, View } from "react-native";
import { scoreBarFigures } from "@mahjong-scoring/features/results/score-bar";
import { useTranslations } from "use-intl";

import { linkStyles } from "../../lib/link-styles";
import { colors, radius } from "../../lib/theme";
import { useMistakeReveal } from "./mistake-reveal";

/**
 * 正解・不正解の割合の帯（web の `ResultScoreBar`）
 *
 * 凡例の「不正解: N」は、下の問題別一覧が間違えた問題を開く処理を登録して
 * いれば、押すとそこへ送る文字の操作になる（{@link useMistakeReveal}）。
 * 全問正解のときや一覧が出ないときは送る先が無いので文字のまま。
 */
export function ResultScoreBar({
  correct,
  total,
}: {
  readonly correct: number;
  readonly total: number;
}) {
  const tc = useTranslations("challenge");
  const {
    correct: safeCorrect,
    incorrect,
    accuracy,
  } = scoreBarFigures(correct, total);
  const reveal = useMistakeReveal();
  const incorrectLabel = `${tc("incorrect")}: ${incorrect}`;

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
              { flex: safeCorrect, backgroundColor: colors.success },
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
              style={[styles.swatch, { backgroundColor: colors.success }]}
            />
            <Text style={styles.legendText}>
              {tc("correct")}: <Text style={styles.strong}>{safeCorrect}</Text>
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.swatch, { backgroundColor: colors.destructive }]}
            />
            {incorrect > 0 && reveal !== undefined ? (
              <Pressable
                onPress={reveal}
                accessibilityRole="button"
                accessibilityLabel={incorrectLabel}
                accessibilityHint={tc("revealMistakesHint")}
                hitSlop={12}
              >
                {({ pressed }) => (
                  <Text
                    style={[
                      styles.legendText,
                      linkStyles.textButton,
                      pressed && linkStyles.textButtonPressed,
                    ]}
                  >
                    {tc("incorrect")}: {incorrect}
                  </Text>
                )}
              </Pressable>
            ) : (
              <Text style={styles.legendText}>
                {tc("incorrect")}:{" "}
                <Text style={styles.strong}>{incorrect}</Text>
              </Text>
            )}
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
