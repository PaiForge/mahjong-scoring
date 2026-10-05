import { memo } from "react";
import {
  formatTimerClock,
  timerColorOf,
} from "@mahjong-scoring/features/session/timer-display";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { colors } from "../../lib/theme";

interface QuizTimerProps {
  readonly timeRemaining: number;
  /** 経過の割合（0〜1） */
  readonly progress: number;
  readonly size?: number;
  readonly strokeWidth?: number;
}

/**
 * 円形タイマー
 * 円形タイマー
 *
 * web の `quiz-timer.tsx` と同じ形（経過に応じて伸びる円弧と中央の残り時間）。
 */
export const QuizTimer = memo(function QuizTimerComponent({
  timeRemaining,
  progress,
  size = 48,
  strokeWidth = 4,
}: QuizTimerProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const color = timerColorOf(clamped);
  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: "-90deg" }] }]}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={strokeWidth}
          fill="none"
          stroke={colors.surface200}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
          strokeLinecap="round"
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.label, { color }]}>
          {formatTimerClock(timeRemaining)}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
