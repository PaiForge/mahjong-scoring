import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import { rankRequiringMenu } from "@mahjong-scoring/features/ranks/registry";
import { isQuotaMenu } from "@mahjong-scoring/features/quota/limits";
import { practiceListHrefForRank } from "@mahjong-scoring/features/routes";

import { NativeAdRow } from "../../ads/native-ad-row";
import { useNativeAds } from "../../ads/use-native-ads";
import { LinkRow, LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { ExamConditions } from "../exam/exam-conditions";
import { ExamStartFooter } from "../exam/exam-start-footer";
import { PracticeEntryQuota } from "../quota/practice-entry-quota";
import { HowToPlaySection } from "../components/how-to-play-section";
import { PracticeRelatedChapters } from "../components/practice-chapter-section";
import type { PracticeScreens } from "../practice-screens";
import { useGoToTab } from "../../hooks/use-go-to-tab";

/**
 * 昇級試験の説明画面
 *
 * @description
 * web の試験の説明ページ（`PracticeIntroContent` の試験の分岐）と同じ並び:
 * 問題方式（見本の盤面）→ 合格条件 → 前提となるレッスン →
 * その級の練習メニュー（末尾に広告の行）。
 *
 * 開始導線（模試 / 本番）は web と違い、練習の説明画面と同じく下端に固定する帯
 * （{@link ExamStartFooter}）に置く。受験ゲート（ログイン・ユーザー名・級の順序）は
 * 本番のボタンにだけ掛かる。模試には掛けない — 記録も段級位の付与も無く、誰でも
 * 受けられる。ただし回数制限の対象の模試（1級・初段。`isQuotaMenu`）は 1 日の
 * 無料枠があるので、合格条件の下に今日の残りを出す（練習一覧の実戦練習の
 * カードと同じ {@link PracticeEntryQuota}。iOS で販売中のときだけ出る）。
 */
export function ExamIntroScreen({
  slug,
  screens,
}: {
  readonly slug: PracticeMenuSlug;
  readonly screens: PracticeScreens;
}) {
  const { namespace, menuType } = practiceMenuBySlug(slug);
  const t = useTranslations(namespace);
  const tRanks = useTranslations("ranks");
  const goToTab = useGoToTab();
  const rank = rankRequiringMenu(menuType)?.rank;
  const { Demo } = screens;
  const [ad] = useNativeAds(MOBILE_AD_SLOTS.examIntro);

  return (
    <Screen
      title={t("title")}
      back
      contentStyle={styles.content}
      footer={<ExamStartFooter slug={slug} />}
    >
      <HowToPlaySection namespace={namespace} Demo={Demo} />

      <ExamConditions slug={slug} />

      {isQuotaMenu(slug) && <PracticeEntryQuota menu={slug} />}

      <PracticeRelatedChapters slug={slug} />

      {/* 前提のレッスンの下に「その級の練習」への行リンク。模試で間違えた人が
          次に行く先は、同じ範囲を数える練習でもある */}
      {rank !== undefined && (
        <LinkRowList>
          <LinkRow
            onPress={() => goToTab(practiceListHrefForRank(rank.slug))}
            leading={<Text style={styles.emoji}>✏️</Text>}
            title={tRanks("practiceLink.title", {
              rank: tRanks(`names.${rank.slug}`),
            })}
            description={tRanks("practiceLink.description")}
          />
          {/* 広告は目次の下ではなく、この行リンクの並びの末尾に置く（web と同じ） */}
          {ad !== undefined && <NativeAdRow creative={ad} />}
        </LinkRowList>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  emoji: {
    fontSize: 16,
  },
});
