import { Pressable, StyleSheet, Text, View } from "react-native";

import { CheckIcon } from "../../../components/icons/icons";
import { colors, radius } from "../../../lib/theme";

/**
 * 設定カードの中の小さなチェックボックス（web の `SmallCheckbox`）
 * 小チェックボックス
 *
 * 行全体を押すと切り替わる（web の `<label>` と同じ当たり判定）。
 */
export function SmallCheckbox({
  checked,
  onChange,
  label,
}: {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <CheckIcon size={14} color={colors.white} />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.lg,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  pressed: {
    backgroundColor: colors.surface50,
  },
  box: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface400,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  boxChecked: {
    borderColor: colors.action,
    backgroundColor: colors.action,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.surface700,
  },
});
