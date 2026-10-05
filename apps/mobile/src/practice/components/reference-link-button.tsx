import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "../../lib/theme";

/**
 * 盤面に添える参照の小さなリンク（web の `ReferenceLinkButton`）
 *
 * 「面子分解」「符の内訳」など、答え合わせを開く小さな入口。グレーの下線の
 * テキストリンクと同じ見た目で、押せる高さだけを確保する。
 */
export function ReferenceLinkButton({
  icon,
  label,
  onPress,
  expanded,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly onPress: () => void;
  readonly expanded?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      hitSlop={8}
      style={styles.button}
    >
      {({ pressed }) => (
        <>
          {icon}
          <Text style={[styles.label, pressed && styles.pressed]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: colors.mutedForeground,
    textDecorationLine: "underline",
    textDecorationColor: colors.surface300,
  },
  pressed: {
    color: colors.foreground,
  },
});
