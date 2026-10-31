import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";

import { Screen } from "../components/screen";
import { TextLink } from "../components/text-link";
import { useGoToTab } from "../hooks/use-go-to-tab";
import { colors } from "../lib/theme";

/**
 * ページが見つからない
 *
 * @description
 * アプリに無いパスを開いたときの画面（web の `not-found.tsx`）。スキームの
 * URL やお知らせの本文のリンクから届く。expo-router の既定の画面（英語の
 * 「Unmatched Route」とサイトマップへのリンク）を Release でも出さないために置く。
 *
 * @flow 未知のパスを開く → ホームへ
 */
export default function NotFoundScreen() {
  const t = useTranslations("notFound");
  const tApp = useTranslations("mobileApp");
  const goToTab = useGoToTab();
  return (
    <Screen title={t("title")} back contentStyle={styles.content}>
      <Text style={styles.description}>{t("description")}</Text>
      <TextLink onPress={() => goToTab("/")}>{tApp("goHome")}</TextLink>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface600,
  },
});
