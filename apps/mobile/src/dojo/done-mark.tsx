import { StyleSheet, View } from "react-native";

import { CheckIcon } from "../components/icons/icons";
import { colors } from "../lib/theme";

const SIZES = {
  sm: { circle: 16, check: 10 },
  md: { circle: 24, check: 14 },
} as const;

/**
 * 済みの印 — 緑の丸に白抜きのチェック（web の `DoneMark`）
 * 済みマーク
 *
 * 道場の行程（レッスンの完了）と級の進み具合の段で、同じ「済んだ」を同じ形で
 * 示す。
 *
 * @param label 読み上げの名前（「完了」等）。省略すると装飾として読み上げから外す
 * @param size md は行の末尾に添える既定の大きさ。sm は 1 行の文字に並べる大きさ
 */
export function DoneMark({
  label,
  size = "md",
}: {
  readonly label?: string;
  readonly size?: keyof typeof SIZES;
}) {
  const { circle, check } = SIZES[size];
  return (
    <View
      accessible={label !== undefined}
      accessibilityRole={label === undefined ? undefined : "image"}
      accessibilityLabel={label}
      importantForAccessibility={
        label === undefined ? "no-hide-descendants" : "auto"
      }
      style={[
        styles.circle,
        { width: circle, height: circle, borderRadius: circle / 2 },
      ]}
    >
      <CheckIcon size={check} color={colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary500,
  },
});
