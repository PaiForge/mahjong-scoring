import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  evaluateExamOutcome,
  type ExamOutcomeInput,
} from "@mahjong-scoring/features/exam/exam-outcome";

import { linkStyles } from "../../lib/link-styles";
import { colors, radius } from "../../lib/theme";
import { useMistakeReveal } from "../components/mistake-reveal";

/** 秒を小数 1 桁で出す（"7.5"）。web と同じく桁を固定する */
function formatSeconds(seconds: number): string {
  return seconds.toFixed(1);
}

/**
 * 昇級試験の結果サマリ（web の `ExamResultSummary`）
 * 試験結果サマリ
 *
 * 練習の正解・不正解の帯の代わりに置く。棒の全長を合格ラインにして正解数を
 * 埋め、「あとどれだけ足りなかったか」を長さで見せる（試験はミス 1 回で
 * 終わるので、正解・不正解の比率はほとんど何も伝えない）。合否は棒の上の
 * 1 行で、色は答え合わせと同じ success / destructive。凡例の右端は終わり方で、
 * 誤答・時間切れで終わったときは押すと問題別の結果でその問題を開く。
 * 判定の分岐は {@link evaluateExamOutcome} が持つ。
 */
export function ExamResultSummary(input: ExamOutcomeInput) {
  const t = useTranslations("examResult");
  const reveal = useMistakeReveal();
  const outcome = evaluateExamOutcome(input);
  const { correct, total, minScore } = input;
  const barLength = Math.max(minScore, correct, 1);
  const filled = Math.max(correct, 0);

  const endingLabel =
    outcome.ending === "goal"
      ? t("endedByGoal")
      : outcome.ending === "mistake"
        ? t("endedByMistake", { n: total })
        : t("endedByTime");

  return (
    <View style={styles.root}>
      <View style={styles.verdictRow} testID="exam-verdict">
        <Text
          style={[
            styles.verdict,
            outcome.passed ? styles.passed : styles.failed,
          ]}
        >
          {outcome.passed ? t("pass") : t("fail")}
        </Text>
        {!outcome.passed && (
          <Text style={styles.remaining}>
            {t("remaining", { count: outcome.remaining })}
          </Text>
        )}
      </View>

      <View
        style={styles.bar}
        accessible
        accessibilityLabel={t("scoreLine", { correct, minScore })}
      >
        {filled > 0 && (
          <View style={[styles.fill, { flex: filled }]}>
            <Text style={styles.fillText}>{correct}</Text>
          </View>
        )}
        {barLength - filled > 0 && (
          <View style={{ flex: barLength - filled }} />
        )}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={styles.swatch} />
            <Text style={styles.legendText}>
              {t("correctLegend")}: <Text style={styles.strong}>{correct}</Text>
            </Text>
          </View>
          <Text style={styles.legendText}>
            {t("minScoreLegend")}: <Text style={styles.strong}>{minScore}</Text>
          </Text>
        </View>
        {outcome.ending !== "goal" && reveal !== undefined ? (
          <Pressable onPress={reveal} accessibilityRole="button" hitSlop={12}>
            {({ pressed }) => (
              <Text
                style={[
                  styles.legendText,
                  linkStyles.textButton,
                  pressed && linkStyles.textButtonPressed,
                ]}
              >
                {endingLabel}
              </Text>
            )}
          </Pressable>
        ) : (
          <Text style={styles.legendText}>{endingLabel}</Text>
        )}
      </View>

      <View style={styles.figures}>
        <View style={styles.figure}>
          <Text style={styles.figureLabel}>{t("averageTimeLabel")}</Text>
          <Text style={styles.figureValue}>
            {outcome.averageSeconds === undefined
              ? t("averageTimeNone")
              : t("averageTimeValue", {
                  seconds: formatSeconds(outcome.averageSeconds),
                })}
          </Text>
        </View>
        {outcome.showRequiredPace && (
          <View style={styles.figure}>
            <Text style={styles.figureLabel}>{t("requiredPaceLabel")}</Text>
            <Text style={styles.figureValue}>
              {t("requiredPaceValue", {
                seconds: formatSeconds(outcome.requiredPaceSeconds),
              })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  verdictRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 12,
  },
  verdict: {
    fontSize: 20,
    fontWeight: "700",
  },
  passed: {
    color: colors.successStrong,
  },
  failed: {
    color: colors.destructiveStrong,
  },
  remaining: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.destructiveStrong,
  },
  bar: {
    flexDirection: "row",
    height: 32,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surface100,
  },
  fill: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
  },
  fillText: {
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
    alignItems: "center",
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
    backgroundColor: colors.success,
  },
  legendText: {
    fontSize: 12,
    color: colors.surface600,
  },
  strong: {
    fontWeight: "600",
    color: colors.surface800,
  },
  figures: {
    gap: 8,
  },
  figure: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  figureLabel: {
    fontSize: 14,
    color: colors.surface600,
  },
  figureValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.surface900,
  },
});
