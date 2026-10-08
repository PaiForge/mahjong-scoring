import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslations } from "use-intl";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import { menuTypeToSlug } from "@mahjong-scoring/features/practice-menu-types";
import { resolveRankStatus } from "@mahjong-scoring/features/ranks/rank-status";
import { rankBySlug } from "@mahjong-scoring/features/ranks/registry";

import { NativeAdRow } from "../../../ads/native-ad-row";
import { useNativeAds } from "../../../ads/use-native-ads";
import { LinkRowList } from "../../../components/link-row";
import { Screen } from "../../../components/screen";
import { SectionTitle } from "../../../components/section-title";
import { BeltBadge } from "../../../dojo/belt-badge";
import { beltCardFrame } from "../../../dojo/belt-style";
import {
  ChapterTocList,
  CurriculumTocLink,
} from "../../../dojo/chapter-toc-list";
import { ExamCtaCard } from "../../../dojo/exam-cta-card";
import { RankStatusBadge } from "../../../dojo/rank-status-badge";
import { useAccountProgress } from "../../../records/use-account-progress";
import { colors } from "../../../lib/theme";
import { PracticeNotFoundScreen } from "../../../practice/screens/not-found-screen";

/**
 * 段級位の詳細
 *
 * @description
 * 1 つの級について、合格基準・取得状態・受験前に取り組むレッスン（完了の
 * 印付き）・試験への導線を 1 画面で示す（web の級の詳細と同じ並び）。
 * 取得状態はログイン中ならサーバーの段級位から、ゲストは無級から見たもの
 * （5級が「次の目標」、それより上は「未取得」）。
 *
 * @flow
 * 1. 道場の級カードの級名から遷移する
 * 2. 前提のレッスンに取り組む（完了の印が進捗を示す）
 * 3. 試験の説明画面へ進む（モバイルでは模試だけを受けられる）
 */
export default function RankDetailPage() {
  const { slug: param } = useLocalSearchParams<{ slug: string }>();
  const t = useTranslations("dojo");
  const tRanks = useTranslations("ranks");
  const { input } = useAccountProgress();
  const completedSlugs = input.completedLessonSlugs;
  const [ad] = useNativeAds(MOBILE_AD_SLOTS.rankDetail);
  const rank = typeof param === "string" ? rankBySlug(param) : undefined;

  if (rank === undefined) return <PracticeNotFoundScreen />;

  const hasChapters = rank.learnChapterSlugs.length > 0;

  return (
    <Screen
      title={tRanks(`names.${rank.slug}`)}
      back
      contentStyle={styles.content}
    >
      {/* 上端の帯は帯色。級名は見出しが持つので、ここは帯・取得状態・合格基準だけ */}
      <View style={[styles.summary, beltCardFrame(rank.slug)]}>
        <BeltBadge slug={rank.slug} size="lg" />
        <View style={styles.summaryBody}>
          <View style={styles.statusRow}>
            <RankStatusBadge
              status={resolveRankStatus(rank.slug, input.achievedRankSlugs)}
            />
          </View>
          <Text style={styles.criterion}>
            <Text style={styles.criterionLabel}>
              {tRanks("examCta.criterionLabel")}:{" "}
            </Text>
            {tRanks(`criteria.${rank.slug}`)}
          </Text>
        </View>
      </View>

      {/* 前提のレッスンを持たない級では節ごと出さない */}
      {hasChapters && (
        <View style={styles.section}>
          <SectionTitle>{t("chaptersTitle")}</SectionTitle>
          <ChapterTocList
            slugs={rank.learnChapterSlugs}
            completedSlugs={completedSlugs}
          />
          <CurriculumTocLink />
        </View>
      )}

      {/* 広告は前提のレッスンの目次の下に枠なしの 1 行で置く。目次を持たない級
          では置かない — 帯のカードと試験の案内しかない短い画面で、その間に
          挟まると広告が主役になる（web と同じ） */}
      {hasChapters && ad !== undefined && (
        <LinkRowList inset>
          <NativeAdRow creative={ad} />
        </LinkRowList>
      )}

      <ExamCtaCard
        slug={menuTypeToSlug(rank.exam.menuType)}
        lead={
          hasChapters ? t("examLead") : t("rankDetail.examLeadWithoutChapters")
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
  },
  summaryBody: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  statusRow: {
    flexDirection: "row",
  },
  criterion: {
    fontSize: 14,
    color: colors.surface700,
  },
  criterionLabel: {
    fontWeight: "700",
  },
  section: {
    gap: 16,
  },
});
