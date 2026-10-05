import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "../lib/theme";

/**
 * テキストリンク（web の `TEXT_LINK_CLASSES` = グレー + 常時下線）
 *
 * 移動するだけの導線に使う。緑はボタン（押して始める）の色なのでリンクには使わない。
 */
export function TextLink({
  onPress,
  children,
}: {
  readonly onPress: () => void;
  readonly children: string;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8}>
      {({ pressed }) => (
        <Text style={[styles.text, pressed && styles.pressed]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    color: colors.mutedForeground,
    textDecorationLine: "underline",
    textDecorationColor: colors.surface300,
    textAlign: "center",
  },
  pressed: {
    color: colors.foreground,
  },
});
