import { StyleSheet, Text } from "react-native";

import { colors } from "../../lib/theme";

/**
 * 出題盤面の見出しラベル（「待ち形」「和了牌」「面子」など）
 * 出題ラベル
 *
 * web の `PromptLabel`（`text-sm font-bold uppercase tracking-widest
 * text-surface-400`）。ラベルの体裁を 1 箇所で持つ。
 */
export function PromptLabel({ children }: { readonly children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "700",
    // tracking-widest = 0.1em
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.surface400,
  },
});
