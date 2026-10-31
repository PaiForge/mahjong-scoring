import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../lib/theme";

/**
 * 画面の代わりに出す全面の知らせ
 * 全面通知
 *
 * アプリをそのまま使い続けられないとき（描画の失敗・最低バージョン未満）に、
 * 見出し・説明・操作だけを画面の中央に置く。ヘッダーもタブも持たないので、
 * 次に取れる操作は `children` のボタンで渡す。
 */
export function BlockingNotice({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description: string;
  /** 操作のボタン（縦に並べる） */
  readonly children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.body}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.actions}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  body: {
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    color: colors.surface900,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    color: colors.surface600,
  },
  actions: {
    marginTop: 16,
    gap: 12,
  },
});
