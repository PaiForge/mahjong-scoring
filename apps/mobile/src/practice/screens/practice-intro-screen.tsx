import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import { relatedChaptersForPractice } from "@mahjong-scoring/features/practice/catalog";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";

import { NativeAdRow } from "../../ads/native-ad-row";
import { useNativeAds } from "../../ads/use-native-ads";
import { LinkRowList } from "../../components/link-row";
import { LeaderboardPreview } from "../../leaderboard/leaderboard-preview";
import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { colors, radius } from "../../lib/theme";
import { PracticeChapterSection } from "../components/practice-chapter-section";
import { PracticeStartCta } from "../components/practice-start-cta";
import { VariantStartPanel } from "../components/variant-start-panel";
import type { PracticeScreens } from "../practice-screens";
import { useRouteVariant } from "./use-route-variant";

/**
 * 練習の説明画面
 *
 * @description
 * web の練習説明ページ（`PracticeIntroContent`）と同じ並び: 問題方式（見本の
 * 盤面）→ 出題設定（バリアントを持つ練習だけ）→ チャレンジ / トレーニングの
 * 開始導線 → 関連するレッスン → 広告の行（始める前に目に入れない）→ 総合ランキングの上位。
 */
export function PracticeIntroScreen({
  slug,
  screens,
}: {
  readonly slug: PracticeMenuSlug;
  readonly screens: PracticeScreens;
}) {
  const { namespace, hasSetup, menuType } = practiceMenuBySlug(slug);
  const t = useTranslations(namespace);
  const tp = useTranslations("practice");
  const variant = useRouteVariant(slug);
  const { Demo } = screens;
  const [ad] = useNativeAds(MOBILE_AD_SLOTS.practiceIntro);

  return (
    <Screen title={t("title")} back contentStyle={styles.content}>
      {Demo === undefined ? (
        <Text style={styles.description}>{t("description")}</Text>
      ) : (
        <View style={styles.howToPlay}>
          <SectionTitle>{t("howToPlay.title")}</SectionTitle>
          <Text style={styles.lead}>{t("howToPlay.lead")}</Text>
          <View
            style={styles.demo}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Demo />
          </View>
        </View>
      )}

      {hasSetup ? (
        <VariantStartPanel slug={slug} initialVariant={variant} />
      ) : (
        <PracticeStartCta slug={slug} variant={variant} />
      )}

      <PracticeChapterSection
        title={tp("requiredKnowledge")}
        slugs={relatedChaptersForPractice(slug)}
      />

      {/* 目次は枠を持たないので、広告の行も枠を描かない（web と同じ） */}
      {ad !== undefined && (
        <LinkRowList inset>
          <NativeAdRow creative={ad} />
        </LinkRowList>
      )}

      {/* ランキングはタブに置かず、練習の入口で上位を見せて導線にする（web と同じ）。
          出題設定を持つ練習は、開いたときのバリアントの土俵を出す */}
      <LeaderboardPreview board={{ menuType, variant }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface500,
  },
  howToPlay: {
    gap: 12,
  },
  lead: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface900,
  },
  demo: {
    borderWidth: 1,
    borderColor: colors.panel,
    borderRadius: radius.panel,
    backgroundColor: colors.surface50,
    padding: 16,
  },
});
