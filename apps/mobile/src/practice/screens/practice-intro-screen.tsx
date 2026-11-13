import { StyleSheet } from "react-native";
import { useTranslations } from "use-intl";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";

import { NativeAdRow } from "../../ads/native-ad-row";
import { useNativeAds } from "../../ads/use-native-ads";
import { LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { HowToPlaySection } from "../components/how-to-play-section";
import { PracticeRelatedChapters } from "../components/practice-chapter-section";
import { PracticeStartCta } from "../components/practice-start-cta";
import {
  useVariantSelection,
  VariantOptions,
} from "../components/variant-start-panel";
import type { PracticeScreens } from "../practice-screens";
import { useRouteVariant } from "./use-route-variant";

/**
 * 練習の説明画面
 *
 * @description
 * 本文は web の練習説明ページ（`PracticeIntroContent`）と同じ並び: 問題方式（見本の
 * 盤面）→ 出題設定（バリアントを持つ練習だけ）→ 関連するレッスン → 広告の行。
 * チャレンジ / トレーニングの開始導線だけは本文に置かず、画面の下端に固定する
 * （`Screen` の `footer`。理由は `PracticeStartCta`）。web の末尾にある
 * 総合ランキングの上位は置かない（アプリでは他の利用者の名前・アバターを見せない。
 * `app/leaderboard/index.tsx`）。
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
  const routeVariant = useRouteVariant(slug);
  // 出題設定を持つ練習は、本文の選択肢と下端のボタンが同じ選択を見る
  const selection = useVariantSelection(slug);
  const setup = hasSetup ? selection : undefined;
  const { Demo } = screens;
  const [ad] = useNativeAds(MOBILE_AD_SLOTS.practiceIntro);

  return (
    <Screen
      title={t("title")}
      back
      contentStyle={styles.content}
      footer={
        setup === undefined ? (
          <PracticeStartCta slug={slug} variant={routeVariant} />
        ) : setup.ready ? (
          <PracticeStartCta
            slug={slug}
            variant={setup.variant}
            onStart={setup.remember}
          />
        ) : undefined
      }
    >
      <HowToPlaySection namespace={namespace} Demo={Demo} />

      {setup?.ready === true && (
        <VariantOptions
          slug={slug}
          variant={setup.variant}
          onSelect={setup.select}
        />
      )}

      <PracticeRelatedChapters slug={slug} />

      {/* 目次は枠を持たないので、広告の行も枠を描かない（web と同じ） */}
      {ad !== undefined && (
        <LinkRowList inset>
          <NativeAdRow creative={ad} />
        </LinkRowList>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
});
