import { StyleSheet, Text } from "react-native";

import { colors } from "../lib/theme";

/**
 * フォームの下に出す 1 行の知らせ（失敗の理由・送信の結果）
 * フォームメッセージ
 *
 * 読み上げにも届くよう、出た時点で読ませる（`accessibilityLiveRegion`）。
 */
export function FormMessage({
  tone,
  children,
}: {
  readonly tone: "error" | "success";
  readonly children: string;
}) {
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={[styles.text, tone === "error" ? styles.error : styles.success]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    color: colors.destructiveStrong,
  },
  success: {
    color: colors.successStrong,
  },
});
