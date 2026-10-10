import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
  type PracticeMenuType,
} from "@mahjong-scoring/features/practice-menu-types";
import {
  PRACTICE_PATH,
  myRecordHref,
  practiceHref,
  practicePlayHref,
} from "@mahjong-scoring/features/routes";

import { NativeAdCard } from "../../ads/native-ad-card";
import { useNativeAds } from "../../ads/use-native-ads";
import { Button, buttonForeground } from "../../components/button";
import { RotateCcwIcon } from "../../components/icons/icons";
import { Screen } from "../../components/screen";
import { useHardwareBack } from "../../hooks/use-hardware-back";
import { LeaderboardPreview } from "../../leaderboard/leaderboard-preview";
import { SectionTitle } from "../../components/section-title";
import { TextLink } from "../../components/text-link";
import { colors } from "../../lib/theme";
import { useFinishExp, useFinishStatus } from "../../records/account-sync";
import { useChallengeResultStore } from "../challenge-result-store";
import { ExpGain } from "../components/exp-gain";
import { MistakeRevealProvider } from "../components/mistake-reveal";
import { ResultScoreBar } from "../components/result-score-bar";
import type { PracticeScreens } from "../practice-screens";
import { useRouteVariant } from "./use-route-variant";

/**
 * チャレンジの結果画面
 *
 * @description
 * web の結果ページ（`ResultView`）と同じ並び: 結果（正解・不正解の帯）→
 * もう一度 / 設定を変更する → 練習一覧に戻る → 広告のカード → 問題別の結果 →
 * もう一度 → 総合ランキングの上位。ログイン中のチャレンジは、結果の帯の下に成績を記録できたかを 1 行で
 * 添える（送れなければ、次に通信できたときに送ると伝える）。自己ベストの
 * 比較はまだ出さない。
 *
 * 「もう一度」を問題別の結果の末尾にも置くのは、一覧で間違えた問題を読み終えた
 * 位置から、広告とボタン群まで戻らずに再挑戦できるようにするため（web と同じ）。
 * 一覧が空のときは、広告の直後に上と同じボタンが並ぶだけなので置かない。
 *
 * @flow
 * 1. チャレンジの画面が終了時に結果をメモリのストアへ置いてここへ置き換える
 * 2. 「もう一度」で同じ設定のチャレンジへ、「設定を変更する」で説明画面へ
 * 3. ヘッダーの × と Android の戻るは結果を閉じて説明画面へ戻る
 *
 * 結果はメモリのストアにしか無く、アプリを閉じると消える。再起動や
 * ディープリンクで結果が無いまま開いたときは、正解・不正解の帯の代わりに
 * その旨を書き、すぐ下の「もう一度」で挑戦し直せるようにする。
 *
 * 閉じる操作をヘッダーに置くのは、問題別の結果までスクロールすると
 * 「練習一覧に戻る」が画面の外へ出て、退出の手段が無くなるため。閉じる先は
 * チャレンジの × と同じ説明画面（流れを始めた画面）にそろえる。終えた
 * チャレンジの画面は結果へ置き換わってスタックに無いので、そこへは戻らない。
 * iOS の戻るジェスチャーはルートレイアウトで切ってある（下の画面が説明画面
 * とは限らず、× と行き先が食い違うため）。
 */
export function PracticeResultScreen({
  slug,
  screens,
}: {
  readonly slug: PracticeMenuSlug;
  readonly screens: PracticeScreens;
}) {
  const { namespace, hasSetup, menuType } = practiceMenuBySlug(slug);
  const t = useTranslations(namespace);
  const tc = useTranslations("challenge");
  const tp = useTranslations("practice");
  const router = useRouter();
  const variant = useRouteVariant(slug);
  const attempt = useChallengeResultStore((s) => s.attempt);
  const current = attempt?.slug === slug ? attempt : undefined;
  const { ProblemList } = screens;
  const [ad] = useNativeAds(MOBILE_AD_SLOTS.practiceResult);
  const close = useCallback(
    () => router.dismissTo(practiceHref(slug, variant)),
    [router, slug, variant],
  );

  useHardwareBack(close);
  // 上のボタン群と一覧の末尾の 2 か所に置く。行き先が食い違わないよう 1 つにする
  const retryButton = (
    <Button
      size="lg"
      fullWidth
      icon={<RotateCcwIcon size={16} color={buttonForeground("primary")} />}
      onPress={() => router.replace(practicePlayHref(slug, variant))}
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
          {/* 走った出題設定。設定を持つ練習だけ、見出しの下に 1 行（web と同じ） */}
          {hasSetup && (
            <Text style={styles.variant}>
              {tp("variantLabel", { label: t(`variants.${variant}.label`) })}
            </Text>
          )}
          {current !== undefined ? (
            <ResultScoreBar
              correct={current.finalResult.correctCount}
              total={current.finalResult.totalCount}
            />
          ) : (
            // 結果はメモリにしか無い。アプリの再起動やディープリンクで直接
            // 開くと空になるので、何も無い帯の代わりに理由と再挑戦を示す
            <Text style={styles.unavailable} testID="result-unavailable">
              {tc("resultUnavailable")}
            </Text>
          )}
          <RecordStatus attemptId={current?.recordedAttemptId} />
          <RecordedExp attemptId={current?.recordedAttemptId} />
          <MyRecordLink
            attemptId={current?.recordedAttemptId}
            menuType={menuType}
            variant={variant}
          />
        </View>

        <View style={styles.actions}>
          <View style={styles.buttons}>
            {retryButton}
            {hasSetup && (
              <Button variant="secondary" size="lg" fullWidth onPress={close}>
                {tc("changeSettingsButton")}
              </Button>
            )}
          </View>
          <TextLink onPress={() => router.dismissTo(PRACTICE_PATH)}>
            {tc("backToList")}
          </TextLink>
        </View>

        {/* ボタン群の後ろに置く。前に置くと「もう一度」より先に広告が目に入る（web と同じ） */}
        {ad !== undefined && <NativeAdCard creative={ad} />}

        {current !== undefined &&
          ProblemList !== undefined &&
          current.results.length > 0 && (
            <View style={styles.problemList}>
              <ProblemList results={current.results} />
              {retryButton}
            </View>
          )}

        {/* 末尾に総合ランキングの上位（web と同じ）。今走った土俵のもの */}
        <LeaderboardPreview board={{ menuType, variant }} />
      </MistakeRevealProvider>
    </Screen>
  );
}

/** 成績を記録できたか（ログイン中のチャレンジだけ） */
function RecordStatus({
  attemptId,
}: {
  readonly attemptId: string | undefined;
}) {
  const t = useTranslations("challenge.recording.status");
  const status = useFinishStatus(attemptId);
  if (status === undefined) return undefined;
  return (
    <Text style={styles.recordStatus} testID="record-status">
      {t(status)}
    </Text>
  );
}

/** 記録できたチャレンジに付いた経験値（ログイン中で、対象の練習だけ） */
function RecordedExp({
  attemptId,
}: {
  readonly attemptId: string | undefined;
}) {
  const exp = useFinishExp(attemptId);
  if (exp === undefined) return undefined;
  return <ExpGain exp={exp} />;
}

/**
 * 記録できたチャレンジから、その土俵を選んだマイレコードへ（web の結果ページの
 * 「マイレコードで推移を見る」）
 */
function MyRecordLink({
  attemptId,
  menuType,
  variant,
}: {
  readonly attemptId: string | undefined;
  readonly menuType: PracticeMenuType;
  readonly variant: string;
}) {
  const t = useTranslations("challenge.record");
  const router = useRouter();
  const status = useFinishStatus(attemptId);
  if (status !== "recorded") return undefined;
  return (
    <View style={styles.myRecord}>
      <TextLink
        testID="result-my-record"
        onPress={() => router.push(myRecordHref({ menuType, variant }))}
      >
        {t("viewMyRecords")}
      </TextLink>
    </View>
  );
}

const styles = StyleSheet.create({
  myRecord: {
    alignItems: "center",
  },
  recordStatus: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface600,
  },
  content: {
    gap: 32,
  },
  variant: {
    fontSize: 14,
    color: colors.surface500,
  },
  unavailable: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface600,
  },
  section: {
    gap: 16,
  },
  actions: {
    gap: 16,
    alignItems: "center",
  },
  problemList: {
    gap: 16,
  },
  buttons: {
    alignSelf: "stretch",
    gap: 12,
  },
});
