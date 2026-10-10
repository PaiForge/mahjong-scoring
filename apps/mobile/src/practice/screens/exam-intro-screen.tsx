import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import { rankRequiringMenu } from "@mahjong-scoring/features/ranks/registry";
import { practiceTrainingHref } from "@mahjong-scoring/features/routes";

import { NativeAdRow } from "../../ads/native-ad-row";
import { useNativeAds } from "../../ads/use-native-ads";
import { Button, buttonForeground } from "../../components/button";
import { InfinityIcon } from "../../components/icons/icons";
import { LinkRow, LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { practiceListHrefForRank } from "../../dojo/dojo-routes";
import { colors, radius } from "../../lib/theme";
import { ExamConditions } from "../exam/exam-conditions";
import { ExamStartGate, useOffersRealExam } from "../exam/exam-start-gate";
import { StartCtaDivider } from "../components/practice-start-cta";
import { PracticeChapterSection } from "../components/practice-chapter-section";
import type { PracticeScreens } from "../practice-screens";

/**
 * 昇級試験の説明画面
 *
 * @description
 * web の試験の説明ページ（`PracticeIntroContent` の試験の分岐）と同じ並び:
 * 問題方式（見本の盤面）→ 合格条件 → 開始導線 → 前提となるレッスン →
 * その級の練習メニュー（末尾に広告の行）。
 *
 * 開始導線は web と同じく本番 / 「または」/ 模試の 3 段。本番のボタンは
 * 受験ゲート（{@link ExamStartGate}）がログイン・ユーザー名・級の順序で
 * 出し分ける。模試には掛けない — 記録も段級位の付与も無く、誰でも受けられる。
 * 本番を出せないとき（ログインを出せないビルド・BAN 中）は模試だけを
 * 主ボタンで出す。
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
  const tDojo = useTranslations("dojo");
  const tRanks = useTranslations("ranks");
  const tExam = useTranslations("examTraining");
  const tp = useTranslations("practice");
  const router = useRouter();
  const offersRealExam = useOffersRealExam();
  const trainingVariant = offersRealExam ? "secondary" : "primary";
  const rank = rankRequiringMenu(menuType)?.rank;
  const { Demo } = screens;
  const [ad] = useNativeAds(MOBILE_AD_SLOTS.examIntro);

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

      <ExamConditions slug={slug} />

      <View style={styles.startFrame}>
        {offersRealExam && (
          <>
            <ExamStartGate slug={slug} />
            <StartCtaDivider label={tp("orDivider")} />
          </>
        )}
        <View style={styles.start}>
          <Button
            variant={trainingVariant}
            size="lg"
            fullWidth
            icon={
              <InfinityIcon
                size={16}
                color={buttonForeground(trainingVariant)}
              />
            }
            onPress={() => router.push(practiceTrainingHref(slug))}
            testID="start-training"
          >
            {tExam("startButton")}
          </Button>
          <Text style={styles.hint}>{tExam("hint")}</Text>
        </View>
      </View>

      {rank !== undefined && (
        <PracticeChapterSection
          title={tDojo("chaptersTitle")}
          slugs={rank.learnChapterSlugs}
        />
      )}

      {/* 前提のレッスンの下に「その級の練習」への行リンク。模試で間違えた人が
          次に行く先は、同じ範囲を数える練習でもある */}
      {rank !== undefined && (
        <LinkRowList>
          <LinkRow
            onPress={() => router.navigate(practiceListHrefForRank(rank.slug))}
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
  startFrame: {
    gap: 20,
  },
  start: {
    alignItems: "center",
    gap: 6,
  },
  hint: {
    fontSize: 12,
    color: colors.surface400,
    textAlign: "center",
  },
  emoji: {
    fontSize: 16,
  },
});
