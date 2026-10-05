import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";

import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { colors, radius } from "../../lib/theme";
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
 * 開始導線。
 */
export function PracticeIntroScreen({
  slug,
  screens,
}: {
  readonly slug: PracticeMenuSlug;
  readonly screens: PracticeScreens;
}) {
  const { namespace, hasSetup } = practiceMenuBySlug(slug);
  const t = useTranslations(namespace);
  const variant = useRouteVariant(slug);
  const { Demo } = screens;

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
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  description: {
    fontSize: 14,
    color: colors.surface500,
  },
  howToPlay: {
    gap: 12,
  },
  lead: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface900,
  },
  demo: {
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: radius["2xl"],
    backgroundColor: colors.surface50,
    padding: 16,
  },
});
