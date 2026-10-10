import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { challengeViewSettings } from "@mahjong-scoring/features/practice/challenge-view-settings";
import {
  DOJO_PATH,
  practiceHref,
  practicePlayHref,
} from "@mahjong-scoring/features/routes";

import { NativeAdCard } from "../../ads/native-ad-card";
import { useNativeAds } from "../../ads/use-native-ads";
import { Button, buttonForeground } from "../../components/button";
import { RotateCcwIcon } from "../../components/icons/icons";
import { Screen } from "../../components/screen";
import { useHardwareBack } from "../../hooks/use-hardware-back";
import { SectionTitle } from "../../components/section-title";
import { TextLink } from "../../components/text-link";
import { colors } from "../../lib/theme";
import {
  useFinishGrantedRanks,
  useFinishStatus,
} from "../../records/account-sync";
import { useChallengeResultStore } from "../challenge-result-store";
import { MistakeRevealProvider } from "../components/mistake-reveal";
import { ExamResultSummary } from "../exam/exam-result-summary";
import { PromotionBanner } from "../exam/promotion-banner";
import type { PracticeScreens } from "../practice-screens";

/**
 * 昇級試験の結果画面
 *
 * @description
 * web の試験の結果ページ（`ResultView` の試験の分岐）と同じ並び: 結果（合否・
 * 合格ラインまでの棒・ペース）→ 昇級バナー（付与されたときだけ）→ ボタン群 →
 * 広告のカード → 問題別の結果。試験は成績を記録しないので、練習の結果画面に
 * ある経験値・マイレコードへの導線は持たない。
 *
 * 合否の帯は手元の正解数で出し、段級位はサーバーの判定（確定の応答）で
 * 出す。判定を受け取れていない間は、合否の下にその旨を 1 行添える。
 *
 * 合格したら主ボタンは道場へ、「もう一度」は補助の文字の操作に下がる
 * （web の `primaryAction: "parent"`）。不合格なら逆。
 *
 * @flow
 * 1. 試験の画面が終了時に結果をメモリのストアへ置いてここへ置き換える
 * 2. 合格なら「道場に戻る」、不合格なら「もう一度」
 * 3. ヘッダーの × と Android の戻るは試験の説明画面へ戻る
 */
export function ExamResultScreen({
  slug,
  screens,
}: {
  readonly slug: PracticeMenuSlug;
  readonly screens: PracticeScreens;
}) {
  const { namespace, timeLimit } = practiceMenuBySlug(slug);
  const { goalCount } = challengeViewSettings(slug);
  const t = useTranslations(namespace);
  const tc = useTranslations("challenge");
  const router = useRouter();
  const attempt = useChallengeResultStore((s) => s.attempt);
  const current = attempt?.slug === slug ? attempt : undefined;
  const { ProblemList } = screens;
  const [ad] = useNativeAds(MOBILE_AD_SLOTS.examResult);
  const close = useCallback(
    () => router.dismissTo(practiceHref(slug)),
    [router, slug],
  );

  useHardwareBack(close);

  const minScore = goalCount ?? 0;
  const passed =
    current !== undefined && current.finalResult.correctCount >= minScore;
  const retry = () => router.replace(practicePlayHref(slug));
  const toDojo = () => router.dismissTo(DOJO_PATH);
  const primaryButton = passed ? (
    <Button size="lg" fullWidth onPress={toDojo} testID="exam-to-dojo">
      {tc("backToDojo")}
    </Button>
  ) : (
    <Button
      size="lg"
      fullWidth
      icon={<RotateCcwIcon size={16} color={buttonForeground("primary")} />}
      onPress={retry}
      testID="exam-retry"
    >
      {tc("retryButton")}
    </Button>
  );

  return (
    <Screen
      title={t("title")}
      back
      backIcon="close"
      onBack={close}
      contentStyle={styles.content}
    >
      <MistakeRevealProvider>
        <View style={styles.section}>
          <SectionTitle>{tc("resultSectionTitle")}</SectionTitle>
          {current !== undefined ? (
            <ExamResultSummary
              correct={current.finalResult.correctCount}
              total={current.finalResult.totalCount}
              elapsedMs={current.elapsedMs}
              minScore={minScore}
              timeLimitSec={timeLimit}
            />
          ) : (
            <Text style={styles.unavailable} testID="result-unavailable">
              {tc("resultUnavailable")}
            </Text>
          )}
          <GradingStatus attemptId={current?.recordedAttemptId} />
        </View>

        <Promotion attemptId={current?.recordedAttemptId} />

        <View style={styles.actions}>
          <View style={styles.buttons}>{primaryButton}</View>
          {passed ? (
            <TextLink onPress={retry}>{tc("retryButton")}</TextLink>
          ) : (
            <TextLink onPress={toDojo}>{tc("backToDojo")}</TextLink>
          )}
        </View>

        {ad !== undefined && <NativeAdCard creative={ad} />}

        {current !== undefined &&
          ProblemList !== undefined &&
          current.results.length > 0 && (
            <View style={styles.problemList}>
              <ProblemList results={current.results} />
              {primaryButton}
            </View>
          )}
      </MistakeRevealProvider>
    </Screen>
  );
}

/** 合否の判定を受け取れたか。受け取れたら何も出さない（帯とバナーが語る） */
function GradingStatus({
  attemptId,
}: {
  readonly attemptId: string | undefined;
}) {
  const t = useTranslations("examResult.status");
  const status = useFinishStatus(attemptId);
  if (status === undefined || status === "recorded") return undefined;
  return (
    <Text style={styles.status} testID="grading-status">
      {t(status)}
    </Text>
  );
}

/** 今回の試験で付与された段級位（サーバーの判定） */
function Promotion({ attemptId }: { readonly attemptId: string | undefined }) {
  const granted = useFinishGrantedRanks(attemptId);
  if (granted === undefined || granted.length === 0) return undefined;
  return <PromotionBanner slugs={granted} />;
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  section: {
    gap: 16,
  },
  unavailable: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface600,
  },
  status: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface600,
  },
  actions: {
    gap: 16,
    alignItems: "center",
  },
  buttons: {
    alignSelf: "stretch",
    gap: 12,
  },
  problemList: {
    gap: 16,
  },
});
