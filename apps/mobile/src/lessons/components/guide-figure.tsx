import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../lib/theme";

/**
 * 教本の図とキャプション（web の `GuideFigure`）
 * 教本図
 *
 * 図（画面のプレビューや表）の直下に、本文より一段小さく薄い文字で説明を
 * 添える。図に付く説明はどのレッスンでもこの書体に揃え、地の文の注記
 * （`GuideNote`）とは分ける。
 */
export function GuideFigure({
  caption,
  children,
}: {
  /** 図の下に添える説明・注記（「※」のような行頭記号は文言側が持つ） */
  readonly caption: ReactNode;
  /** 図の本体（練習の画面のプレビュー・表など） */
  readonly children: ReactNode;
}) {
  return (
    <View style={styles.root}>
      {children}
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
  caption: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.surface500,
  },
});
