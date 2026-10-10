import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { TextLink } from "../components/text-link";
import { colors } from "../lib/theme";

/** 読み込み中（お知らせの各画面で共通） */
export function AnnouncementLoading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.action} />
    </View>
  );
}

/**
 * 読み込めなかったとき（お知らせの各画面で共通）
 *
 * @param onRetry - 渡すと「もう一度読み込む」を出す
 */
export function AnnouncementLoadFailed({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry?: () => void;
}) {
  const t = useTranslations("announcements");
  return (
    <View style={styles.failed}>
      <Text style={styles.failedText}>{message}</Text>
      {onRetry !== undefined && (
        <TextLink onPress={onRetry}>{t("retry")}</TextLink>
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
