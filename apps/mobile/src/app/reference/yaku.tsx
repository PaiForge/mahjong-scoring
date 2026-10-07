import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import { hasYakuCheatsheetEntry } from "@mahjong-scoring/features/yaku/examples";

import { Screen } from "../../components/screen";
import { colors } from "../../lib/theme";
import { YakuCheatsheet } from "../../reference/yaku-cheatsheet";

/**
 * 役一覧（早見表）
 *
 * @description
 * 役を翻数別に並べた早見表（web の `/reference/yaku`）。`?yaku=<役名>` で
 * 開くとその役を開いてスクロールする（web のアンカーの代わり。レッスンの
 * 翻数表の役名から開く）。
 *
 * @flow
 * 早見表のハブか、レッスンの役名から開いて閲覧する。
 */
export default function ReferenceYakuScreen() {
  const t = useTranslations("reference.yaku");
  const { yaku } = useLocalSearchParams<{ yaku?: string }>();
  const focused =
    typeof yaku === "string" && hasYakuCheatsheetEntry(yaku) ? yaku : undefined;

  return (
    <Screen title={t("title")} back contentStyle={styles.content}>
      <YakuCheatsheet focusedYakuName={focused} />
      <Text style={styles.note}>{t("nakiNote")}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 24,
  },
  note: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.surface500,
  },
});
