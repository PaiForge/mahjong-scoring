import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "../lib/theme";

/**
 * 「押すと説明が出る」入口の「?」（web の `HelpIconButton`）
 *
 * 緑の塗りの丸に白抜きの太字。大きさは添える文字の大きさ（`fontSize`）に合わせる。
 */
export function HelpIconButton({
  onPress,
  label,
  fontSize = 14,
}: {
  readonly onPress: () => void;
  readonly label: string;
  readonly fontSize?: number;
}) {
  const size = fontSize * 1.5;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.mark, { fontSize: fontSize * 1.2, lineHeight: size }]}
      >
        ?
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary500,
  },
  pressed: {
    backgroundColor: colors.primary600,
  },
  mark: {
    fontWeight: "700",
    color: colors.white,
    textAlign: "center",
  },
});
