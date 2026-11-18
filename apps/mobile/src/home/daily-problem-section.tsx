import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { DEFAULT_RULE_SETTINGS } from "@mahjong-scoring/core";
import type { AgariProblemPayload } from "@mahjong-scoring/core";
import type { DailyProblemAnswerState } from "@mahjong-scoring/features/daily-problem/mobile-api";
import { buildDailyProblemQuestion } from "@mahjong-scoring/features/daily-problem/question";
import { formatJstDayKeyMonthDay } from "@mahjong-scoring/features/jst";
import { DAILY_PROBLEM_HREF } from "@mahjong-scoring/features/routes";

import { useAuth } from "../auth/use-auth";
import { TehaiHand } from "../board/tehai-hand";
import { Button } from "../components/button";
import { usePullToRefresh } from "../components/screen-refresh";
import { SectionTitle } from "../components/section-title";
import { TextLink } from "../components/text-link";
import {
  fetchDailyProblem,
  subscribeDailyProblemAnswers,
} from "../daily-problem/daily-api";
import { panelFrame } from "../lib/panel-styles";
import { colors, radius } from "../lib/theme";
import { useAppLocale } from "../lib/use-app-locale";
import { useFocusRead } from "../lib/use-focus-read";

/**
 * ホームの「本日の問題」の節（web のダッシュボードの `DailyProblemSection`）
 * 本日の問題カード
 *
 * 全員に同じ和了形の点数計算 1 問（日課）への入口。ログイン中だけ今日の問題と
 * 自分の解答を読み、読めて今日の問題があるときだけ節を描く。読み込み中・
 * 読めなかった・今日は問題が無い・ゲストのときは何も出さない（お知らせの節と
 * 同じ扱い）— ホームの主役は「次にやること」で、日課の失敗でホームを落とさない。
 * ゲストには API も呼ばない（端末側に解答済みを残す仕組みが無く、初版はログイン
 * 中だけに出す）。
 *
 * 画面が前面に戻るたびに読み直す（`useFocusRead`）ので、出題画面で解いて
 * 戻ると解答済みの表示に替わる。引っ張って更新にも読み直しを登録する。
 *
 * カードは web と同じく日付・手牌のプレビュー・説明・状態の順。未解答なら緑の
 * 主ボタン「解く」（押して始める面）、解答済みなら正誤と文字の操作「もう一度
 * 見る」（解き直しても記録は変わらないので、始める面にはしない）。
 */
export function DailyProblemSection() {
  const { status, user } = useAuth();
  const userId = status === "signedIn" ? user?.id : undefined;
  if (userId === undefined) return null;
  return <AccountDailyProblemSection key={userId} userId={userId} />;
}

/** 本人の読み取り状態はアカウント変更時に破棄する。 */
function AccountDailyProblemSection({ userId }: { readonly userId: string }) {
  // ゲスト（とログインの状態を読んでいる間）は read を渡さず、API を呼ばない
  const { state, reload } = useFocusRead(
    useMemo(
      () =>
        userId === undefined ? undefined : () => fetchDailyProblem(userId),
      [userId],
    ),
  );
  usePullToRefresh(reload);
  useEffect(
    () =>
      subscribeDailyProblemAnswers((owner) => {
        if (owner === userId) void reload();
      }),
    [reload, userId],
  );
  if (userId === undefined || state.kind !== "loaded") return null;
  const { day, problem, answer } = state.value;
  if (problem === null) return null;
  return (
    <DailyProblemCard day={day} payload={problem.payload} answer={answer} />
  );
}

/** 今日の問題があるときのカード */
function DailyProblemCard({
  day,
  payload,
  answer,
}: {
  readonly day: string;
  readonly payload: AgariProblemPayload;
  readonly answer: DailyProblemAnswerState | null;
}) {
  const t = useTranslations("dailyProblem");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const locale = useAppLocale();
  // 手牌はルール設定に依らないので、プレビューは標準ルールで組み立てる。
  // 組み立てられなければプレビューだけ省き、カードは出す（web と同じ）
  const question = useMemo(() => {
    const built = buildDailyProblemQuestion(payload, DEFAULT_RULE_SETTINGS);
    return built.isOk() ? built.value : undefined;
  }, [payload]);
  const open = () => router.push(DAILY_PROBLEM_HREF);

  return (
    <View style={styles.section} testID="home-daily-problem">
      <SectionTitle>{t("title")}</SectionTitle>
      <View style={styles.card}>
        <Text style={styles.day}>{formatJstDayKeyMonthDay(day, locale)}</Text>
        {answer === null && question !== undefined && (
          <View
            style={styles.preview}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <TehaiHand
              tehai={question.tehai}
              agariHai={question.agariHai}
              agariLabel={question.isTsumo ? tCommon("tsumo") : tCommon("ron")}
            />
          </View>
        )}
        <Text style={styles.hint}>{t("card.hint")}</Text>
        {answer === null ? (
          <Button
            size="lg"
            fullWidth
            onPress={open}
            testID="home-daily-problem-start"
          >
            {t("card.start")}
          </Button>
        ) : (
          <View style={styles.answered}>
            <Text
              style={[
                styles.answeredText,
                answer.isCorrect && styles.answeredCorrect,
              ]}
            >
              {answer.isCorrect
                ? t("card.answeredCorrect")
                : t("card.answeredIncorrect")}
            </Text>
            <TextLink onPress={open} testID="home-daily-problem-review">
              {t("card.review")}
            </TextLink>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  card: {
    ...panelFrame,
    padding: 20,
    gap: 16,
  },
  day: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface900,
  },
  preview: {
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: colors.primary800,
    padding: 12,
  },
  hint: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface500,
  },
  answered: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  answeredText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface700,
  },
  answeredCorrect: {
    color: colors.successStrong,
  },
});
