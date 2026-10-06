import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius } from "../lib/theme";

/**
 * 隠せる点数（点数表のセルの中身）
 * 点数マスク
 *
 * web はセルのタップでぼかし（`blur-md`）を掛けて暗記に使う。React Native には
 * 文字のぼかしが無いため、数字を透明にして同じ大きさの灰色の帯で覆う
 * （セルの大きさが変わらず、隠れていることが見て分かる）。
 * `onToggle` を渡さないときはタップを受けない（答え合わせの参照用など）。
 */
export function HideableScore({
  hidden,
  onToggle,
  accessibilityLabel,
  children,
}: {
  readonly hidden: boolean;
  readonly onToggle: (() => void) | undefined;
  readonly accessibilityLabel?: string;
  readonly children: ReactNode;
}) {
  const content = (
    <View style={[styles.box, hidden && styles.hiddenBox]}>
      <View style={hidden ? styles.invisible : undefined}>{children}</View>
    </View>
  );
  if (onToggle === undefined) return content;
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: hidden }}
      hitSlop={6}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.sm,
    paddingHorizontal: 2,
  },
  hiddenBox: {
    backgroundColor: colors.surface200,
  },
  invisible: {
    opacity: 0,
  },
});
