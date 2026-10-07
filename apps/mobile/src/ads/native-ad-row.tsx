import { Image, StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import type { NativeAdView } from "@mahjong-scoring/features/ads/native-ad";

import { Chip } from "../components/chip";
import { LinkRow } from "../components/link-row";
import { nativeAdAccessibilityLabel, openNativeAd } from "./open-native-ad";

/**
 * 行リンク型のネイティブ広告（web の `NativeAdRow`）
 * 広告行
 *
 * `LinkRow` そのもので描き、`LinkRowList` の中にそのまま 1 行として入る。
 * 枠・余白・区切りを `LinkRow` と共有しているため、周りの行と高さがずれない。
 * 行頭は画像（書影など）か絵文字、行末の印の位置に「PR」を置く — 広告で
 * あることはこの表記だけが伝える（景品表示法のステルスマーケティング規制）。
 * リンクは OS に開かせる（{@link openNativeAd}）。
 */
export function NativeAdRow({ creative }: { readonly creative: NativeAdView }) {
  const t = useTranslations("nativeAd");

  return (
    <LinkRow
      onPress={() => openNativeAd(creative.href)}
      accessibilityLabel={nativeAdAccessibilityLabel(t("badgeLabel"), creative)}
      title={creative.title}
      description={creative.description}
      leading={
        creative.imageUrl !== undefined ? (
          <Image
            source={{ uri: creative.imageUrl }}
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            style={styles.image}
          />
        ) : (
          <Text
            style={styles.icon}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {creative.icon}
          </Text>
        )
      }
      trailing={<Chip tone="neutral">{t("badge")}</Chip>}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: 40,
    height: 40,
  },
  icon: {
    fontSize: 16,
  },
});
