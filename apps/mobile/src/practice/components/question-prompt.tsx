import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../lib/theme";

/**
 * 問題文（web の `QuestionPrompt` = 中央寄せのグレーの小さな文）
 *
 * `replacement` を渡すと問題文の代わりに同じ行へそれを描く（トレーニングの
 * 正解表示など）。行の高さは問題文と同じに保ち、差し替えても下の回答欄を
 * 動かさない。
 */
export function QuestionPrompt({
  children,
  replacement,
}: {
  readonly children: string;
  readonly replacement?: ReactNode;
}) {
  if (replacement !== undefined) {
    return <View style={styles.replacement}>{replacement}</View>;
  }
  return <Text style={styles.text}>{children}</Text>;
}

const styles = StyleSheet.create({
  text: {
    minHeight: 20,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "500",
    color: colors.surface600,
  },
  replacement: {
    minHeight: 20,
  },
});
