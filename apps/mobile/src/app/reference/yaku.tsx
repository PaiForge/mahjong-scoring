import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import { hasYakuCheatsheetEntry } from "@mahjong-scoring/features/yaku/examples";

import { NativeAdRow } from "../../ads/native-ad-row";
import { useNativeAds } from "../../ads/use-native-ads";
import { LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { colors } from "../../lib/theme";
import { YakuCheatsheet } from "../../reference/yaku-cheatsheet";

/**
 * 役一覧（早見表）
 *
 * @description
 * 役を翻数別に並べた早見表（web の `/reference/yaku`）。`?yaku=<役名>` で
 * 開くとその役を開いてスクロールする（web のアンカーの代わり。レッスンの
 * 翻数表の役名から開く）。翻数のまとまりの間に広告の行を置く。
 *
 * @flow
 * 早見表のハブか、レッスンの役名から開いて閲覧する。
 */
export default function ReferenceYakuScreen() {
  const t = useTranslations("reference.yaku");
  const { yaku } = useLocalSearchParams<{ yaku?: string }>();
  const focused =
    typeof yaku === "string" && hasYakuCheatsheetEntry(yaku) ? yaku : undefined;
  const ads = useNativeAds(MOBILE_AD_SLOTS.yakuReference);

  return (
    <Screen title={t("title")} back contentStyle={styles.content}>
      {/* 役のカードは 1 枚ずつ細枠を持つので、広告の行も細枠の 1 枚にする（web と同じ） */}
      <YakuCheatsheet
        focusedYakuName={focused}
        ads={ads.map((ad) => (
          <LinkRowList key={ad.id}>
            <NativeAdRow creative={ad} />
          </LinkRowList>
        ))}
      />
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
