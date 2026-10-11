import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";

import { InsetRing } from "../../components/inset-ring";
import { borderWidth, colors } from "../../lib/theme";

const CIRCLE_SIZE = 32;

interface LessonQuizStepsProps {
  /** 今解いている問題（0 始まり） */
  readonly current: number;
  readonly total: number;
  /** 読み上げる進み具合（「2 / 5 問目」）。丸の並びは 1 つの要素として読む */
  readonly label: string;
}

/**
 * 確認問題の進み具合を 1 → 2 → 3 … の丸と線で示すステップ表示
 * （web の `LessonQuizSteps`）
 * 確認問題ステップ
 *
 * 確認問題の見出しの下に置く。残りが何問かは数字の「n / m 問目」より並びの
 * ほうが一目で読めるので、数字の表示は持たない（読み上げの名前に残す）。
 *
 * 済んだ問題は緑の塗り（`success` — 完了の記号）、今の問題は淡緑の面に
 * 緑のリング（`brandSubtle`）、まだの問題は灰の枠。ここは「どこにいるか」
 * より「どこまで済んだか」を見せる場所で、済みの印と同じ緑で積み上がる
 * ほうが進んだ手応えになるため、現在地の墨（`selected`）にしない。
 * 主操作の `action` は使わない（丸は押せない）。済んだ問題を正誤で
 * 塗り分けない — 途中で正答数を意識させない（正答数は完了画面で添える）。
 */
export function LessonQuizSteps({
  current,
  total,
  label,
}: LessonQuizStepsProps) {
  const steps = Array.from({ length: total }, (_, i) => i);
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={styles.row}
      testID="lesson-quiz-steps"
    >
      {steps.map((step) => {
        const isDone = step < current;
        const isCurrent = step === current;
        return (
          <Fragment key={step}>
            {step > 0 && (
              // 前の丸からこの丸へ伸びる線。ここまで来ていれば緑
              <View
                style={[
                  styles.line,
                  step <= current ? styles.lineReached : undefined,
                ]}
              />
            )}
            <View
              style={[
                styles.circle,
                isDone
                  ? styles.circleDone
                  : isCurrent
                    ? styles.circleCurrent
                    : undefined,
              ]}
            >
              {isCurrent && (
                <InsetRing color={colors.success} borderRadius={CIRCLE_SIZE} />
              )}
              <Text
                style={[
                  styles.number,
                  isDone
                    ? styles.numberDone
                    : isCurrent
                      ? styles.numberCurrent
                      : undefined,
                ]}
              >
                {step + 1}
              </Text>
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  line: {
    flex: 1,
    height: borderWidth.panel,
    backgroundColor: colors.surface300,
  },
  lineReached: {
    backgroundColor: colors.success,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: borderWidth.panel,
    borderColor: colors.surface300,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  circleDone: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  circleCurrent: {
    borderColor: colors.success,
    backgroundColor: colors.brandSubtle,
  },
  number: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    color: colors.surface400,
  },
  numberDone: {
    color: colors.white,
  },
  numberCurrent: {
    color: colors.successStrong,
  },
});
