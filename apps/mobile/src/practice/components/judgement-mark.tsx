import type { JudgementVerdict } from "@mahjong-scoring/features/results/result-schemas";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { colors } from "../../lib/theme";

const MARK_PATHS: Readonly<Record<JudgementVerdict, string>> = {
  correct: "M5 13l4 4L19 7",
  incorrect: "M6 6l12 12M18 6L6 18",
};

const INLINE_COLOR: Readonly<Record<JudgementVerdict, string>> = {
  correct: colors.success,
  incorrect: colors.destructive,
};

const BADGE: Readonly<Record<JudgementVerdict, { bg: string; fg: string }>> = {
  correct: { bg: colors.successSubtle, fg: "#034621" },
  incorrect: { bg: colors.destructiveSubtle, fg: "#7f1d1d" },
};

interface JudgementMarkProps {
  readonly verdict: JudgementVerdict;
  /** `badge` は丸い枠付き（正誤カウンタ）、`inline` は文字の横に添える印 */
  readonly variant?: "inline" | "badge";
  readonly size?: number;
  readonly accessibilityLabel?: string;
}

/**
 * 正誤の印（✓ / ✗）
 * 正誤マーク
 *
 * web の `JudgementMark` と同じ path・同じ配色。
 */
export function JudgementMark({
  verdict,
  variant = "inline",
  size = 16,
  accessibilityLabel,
}: JudgementMarkProps) {
  const color = variant === "badge" ? BADGE[verdict].fg : INLINE_COLOR[verdict];
  const svg = (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d={MARK_PATHS[verdict]} />
    </Svg>
  );
  if (variant === "inline") {
    return (
      <View
        accessible={accessibilityLabel !== undefined}
        accessibilityLabel={accessibilityLabel}
      >
        {svg}
      </View>
    );
  }
  return (
    <View
      accessible={accessibilityLabel !== undefined}
      accessibilityLabel={accessibilityLabel}
      style={{
        borderRadius: 9999,
        borderWidth: 2,
        borderColor: colors.ink,
        padding: 8,
        backgroundColor: BADGE[verdict].bg,
      }}
    >
      {svg}
    </View>
  );
}
