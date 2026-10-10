import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors } from "../lib/theme";
import { TextLink } from "./text-link";

/**
 * 読み込み中（サーバーから読む画面で共通）
 * 読み込み中表示
 */
export function LoadingIndicator() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary500} />
    </View>
  );
}

/**
 * 読み込めなかったとき（サーバーから読む画面で共通）
 * 読み込み失敗表示
 *
 * 文言は画面の名前空間の辞書から渡す（何を読めなかったかを言うため）。
 *
 * @param retry - 渡すと「もう一度読み込む」の操作を出す
 */
export function LoadFailed({
  message,
  retry,
}: {
  readonly message: string;
  readonly retry?: { readonly label: string; readonly onPress: () => void };
}) {
  return (
    <View style={styles.failed}>
      <Text style={styles.failedText}>{message}</Text>
      {retry !== undefined && (
        <TextLink onPress={retry.onPress}>{retry.label}</TextLink>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 48,
    alignItems: "center",
  },
  failed: {
    alignItems: "flex-start",
    gap: 4,
  },
  failedText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface600,
  },
});
