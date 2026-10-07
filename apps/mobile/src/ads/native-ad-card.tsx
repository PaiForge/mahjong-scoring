import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type { NativeAdView } from "@mahjong-scoring/features/ads/native-ad";

import { Chip } from "../components/chip";
import { ChevronRightIcon } from "../components/icons/icons";
import { colors, radius } from "../lib/theme";
import { nativeAdAccessibilityLabel, openNativeAd } from "./open-native-ad";
import {
  CardVisualBand,
  CardVisualHand,
} from "../practice/components/practice-card-visual";

/**
 * カード型のネイティブ広告（web の `NativeAdCard`）
 * 広告カード
 *
 * 練習一覧の練習カード（`PracticeCard`）と同じ骨格 — 細枠の白いカード、
 * 左上にタイトル、右上に添え物（段級位の代わりに「PR」）、右下に行き先の
 * 文言 — で描く。一覧に混ざったときに 1 枚だけ別の形にならないように。
 * 手牌を持つ広告は練習カードと同じ緑の帯に手牌を並べ、持たない広告は
 * 画像（書影など）か絵文字を左に置く。リンクは OS に開かせる（{@link openNativeAd}）。
 */
export function NativeAdCard({
  creative,
}: {
  readonly creative: NativeAdView;
}) {
  const t = useTranslations("nativeAd");

  return (
    <Pressable
      onPress={() => openNativeAd(creative.href)}
      accessibilityRole="link"
      accessibilityLabel={nativeAdAccessibilityLabel(t("badgeLabel"), creative)}
      testID={`native-ad-${creative.id}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{creative.title}</Text>
        {/* 広告であることはこの表記だけが伝える（景品表示法のステルスマーケティング規制） */}
        <Chip tone="neutral">{t("badge")}</Chip>
      </View>
      {creative.hand !== undefined ? (
        <>
          <CardVisualBand>
            <CardVisualHand tiles={creative.hand} />
          </CardVisualBand>
          {creative.description !== undefined && (
            <Text style={styles.description}>{creative.description}</Text>
          )}
        </>
      ) : (
        <View style={styles.body}>
          <CreativeVisual creative={creative} />
          {creative.description !== undefined && (
            <Text style={[styles.description, styles.bodyText]}>
              {creative.description}
            </Text>
          )}
        </View>
      )}
      <View style={styles.footer}>
        <Text style={styles.cta}>{t("cta")}</Text>
        <ChevronRightIcon size={16} color={colors.primary700} />
      </View>
    </Pressable>
  );
}

/** 手牌を持たない広告の左の見た目。画像があれば画像、無ければ絵文字 */
function CreativeVisual({ creative }: { readonly creative: NativeAdView }) {
  if (creative.imageUrl !== undefined) {
    return (
      <Image
        source={{ uri: creative.imageUrl }}
        accessibilityLabel={creative.imageAlt}
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        style={styles.visual}
      />
    );
  }
  return (
    <View
      style={[styles.visual, styles.iconBox]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={styles.icon}>{creative.icon}</Text>
    </View>
  );
}

// 枠・余白・文字は練習カード（`PracticeCard`）と同じ値
const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.panel,
    borderRadius: radius.panel,
    backgroundColor: colors.white,
    padding: 20,
    gap: 16,
  },
  pressed: {
    backgroundColor: colors.surface50,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface900,
  },
  body: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  bodyText: {
    flex: 1,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface600,
  },
  visual: {
    width: 80,
    height: 80,
  },
  iconBox: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.surface50,
  },
  icon: {
    fontSize: 36,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  cta: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary700,
  },
});
