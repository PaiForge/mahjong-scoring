import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import {
  PRACTICE_PATH,
  practiceHref,
  practicePlayHref,
} from "@mahjong-scoring/features/routes";

import { Button, buttonForeground } from "../../components/button";
import { RotateCcwIcon } from "../../components/icons/icons";
import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { TextLink } from "../../components/text-link";
import { colors } from "../../lib/theme";
import { useChallengeResultStore } from "../challenge-result-store";
import { ResultScoreBar } from "../components/result-score-bar";
import type { PracticeScreens } from "../practice-screens";
import { useRouteVariant } from "./use-route-variant";

/**
 * チャレンジの結果画面
 *
 * @description
 * web の結果ページ（`ResultView`）と同じ並び: 結果（正解・不正解の帯）→
 * もう一度 / 設定を変更する → 練習一覧に戻る → 問題別の結果。記録・
 * ランキング・経験値はアカウントに紐づくため、モバイルでは出さない。
 *
 * @flow
 * 1. チャレンジの画面が終了時に結果をメモリのストアへ置いてここへ置き換える
 * 2. 「もう一度」で同じ設定のチャレンジへ、「設定を変更する」で説明画面へ
 */
export function PracticeResultScreen({
  slug,
  screens,
}: {
  readonly slug: PracticeMenuSlug;
  readonly screens: PracticeScreens;
}) {
  const { namespace, hasSetup } = practiceMenuBySlug(slug);
  const t = useTranslations(namespace);
  const tc = useTranslations("challenge");
  const tp = useTranslations("practice");
  const router = useRouter();
  const variant = useRouteVariant(slug);
  const attempt = useChallengeResultStore((s) => s.attempt);
  const current = attempt?.slug === slug ? attempt : undefined;
  const { ProblemList } = screens;

  return (
    <Screen title={t("title")} contentStyle={styles.content}>
      {hasSetup && (
        <Text style={styles.variant}>
          {tp("variantLabel", { label: t(`variants.${variant}.label`) })}
        </Text>
      )}

      <View style={styles.section}>
        <SectionTitle>{tc("resultSectionTitle")}</SectionTitle>
        {current !== undefined && (
          <ResultScoreBar
            correct={current.finalResult.correctCount}
            total={current.finalResult.totalCount}
          />
        )}
      </View>

      <View style={styles.actions}>
        <View style={styles.buttons}>
          <Button
            size="lg"
            fullWidth
            icon={
              <RotateCcwIcon size={16} color={buttonForeground("primary")} />
            }
            onPress={() => router.replace(practicePlayHref(slug, variant))}
          >
            {tc("retryButton")}
          </Button>
          {hasSetup && (
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onPress={() => router.dismissTo(practiceHref(slug, variant))}
            >
              {tc("changeSettingsButton")}
            </Button>
          )}
        </View>
        <TextLink onPress={() => router.dismissTo(PRACTICE_PATH)}>
          {tc("backToList")}
        </TextLink>
      </View>

      {current !== undefined && ProblemList !== undefined && (
        <ProblemList results={current.results} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  variant: {
    textAlign: "center",
    fontSize: 14,
    color: colors.surface500,
  },
  section: {
    gap: 16,
  },
  actions: {
    gap: 16,
    alignItems: "center",
  },
  buttons: {
    alignSelf: "stretch",
    gap: 12,
  },
});
