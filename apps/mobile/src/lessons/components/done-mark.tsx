import { StyleSheet, View } from "react-native";

import { CheckIcon } from "../../components/icons/icons";
import { colors } from "../../lib/theme";

/**
 * 済みの印（web の `DoneMark` = 緑の丸に白抜きのチェック）
 * 完了マーク
 *
 * @param label 読み上げる名前（「完了済み」）
 */
export function DoneMark({ label }: { readonly label: string }) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={styles.circle}
    >
      <CheckIcon size={14} color={colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
});
