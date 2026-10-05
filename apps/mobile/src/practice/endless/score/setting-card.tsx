import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius } from "../../../lib/theme";

/**
 * 出題設定のカード（web の `SettingCard`）
 * 設定カード
 *
 * 見出し帯 + 縦並びのチェックボックス群。押せる面ではないので影は持たない。
 */
export function SettingCard({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <View style={styles.frame}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  header: {
    borderBottomWidth: 3,
    borderBottomColor: colors.ink,
    backgroundColor: colors.primary50,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface700,
  },
  body: {
    gap: 12,
    padding: 12,
  },
});
