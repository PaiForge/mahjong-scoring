import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";

import { NativeAdRow } from "../ads/native-ad-row";
import { useNativeAds } from "../ads/use-native-ads";
import { LinkRowList } from "../components/link-row";
import { colors } from "../lib/theme";
import { YakuCheatsheet } from "./yaku-cheatsheet";

/**
 * 役一覧の本文（web の `/reference/yaku` の中身）
 * 役一覧本文
 *
 * 早見表のタブの「役一覧」と、レッスンの役名から積む役一覧の画面で共有する。
 * 翻数のまとまりの間に広告の行を置く。
 *
 * @param focusedYakuName - 開いてスクロールする役（web のアンカーの代わり）
 */
export function YakuReferenceBody({
  focusedYakuName,
}: {
  readonly focusedYakuName?: string;
}) {
  const t = useTranslations("reference.yaku");
  const ads = useNativeAds(MOBILE_AD_SLOTS.yakuReference);

  return (
    <View style={styles.body}>
      {/* 役のカードは 1 枚ずつ細枠を持つので、広告の行も細枠の 1 枚にする（web と同じ） */}
      <YakuCheatsheet
        focusedYakuName={focusedYakuName}
        withNakiFilter
        ads={ads.map((ad) => (
          <LinkRowList key={ad.id}>
            <NativeAdRow creative={ad} />
          </LinkRowList>
        ))}
      />
      <Text style={styles.note}>{t("nakiNote")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 24,
  },
  note: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.surface500,
  },
});
