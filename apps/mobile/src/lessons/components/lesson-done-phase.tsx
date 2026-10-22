import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { PracticeLink } from "@mahjong-scoring/features/curriculum/registry";
import { stepAfterLesson } from "@mahjong-scoring/features/journey/journey";
import {
  journeyStepHref,
  journeyStepTitle,
} from "@mahjong-scoring/features/journey/journey-step";
import { lessonFollowUp } from "@mahjong-scoring/features/lessons/follow-up";
import { resolveLessonNextStep } from "@mahjong-scoring/features/lessons/next-step";
import {
  isQuizLessonSlug,
  quizLessonBySlug,
  type QuizLessonSlug,
} from "@mahjong-scoring/features/lessons/registry";
import { menuTypeToSlug } from "@mahjong-scoring/features/practice-menu-types";
import { rankBySlug } from "@mahjong-scoring/features/ranks/registry";

import { Button } from "../../components/button";
import { SectionTitle } from "../../components/section-title";
import { TextLink } from "../../components/text-link";
import { RecordCtaCard } from "../../home/record-cta-card";
import { useGoToTab } from "../../hooks/use-go-to-tab";
import { borderWidth, colors, radius } from "../../lib/theme";
import { JudgementMark } from "../../practice/components/judgement-mark";
import { useAccountProgress } from "../../records/use-account-progress";
import { verdictTextColors } from "../lesson-colors";
import { isLessonPorted } from "../ported-lessons";
import { ChapterRelatedLinks } from "./chapter-related-links";
import { NextLessonPreview } from "./next-lesson-preview";
import { RankGoalPanel } from "./rank-goal-panel";

/**
 * レッスンの完了の段階（`done`。web の `LessonDonePhase`）
 * 完了の段階
 *
 * 全問正解なら合格と同じ success の囲み、間違えた問題があれば正答数と見直しの
 * 案内を中立の囲みで出す。完了の記録と次の一歩はどちらも同じ（理由は web の
 * `LessonDonePhase`）。
 *
 * 次の一歩は本人の進み具合を踏まえた一歩（features の `lessonFollowUp`）。
 * それが道筋の順の次のレッスン（`stepAfterLesson`）と同じなら、ボタンの代わりに
 * そのレッスンの冒頭のプレビューを出す（選び方は `resolveLessonNextStep`）。
 * 次が無いか開けないレッスン（今の前提章はすべて開ける）なら、web と同じく
 * ホームの「次にやること」に任せる。昇級試験は説明画面（模試）へ送る。
 * 級の最後のレッスン（道筋の次がレッスンでない）では昇級試験までの残りを添える。
 */
export function LessonDonePhase({
  slug,
  messageKey,
  correctCount,
  total,
  footer,
  onReviewBody,
}: {
  readonly slug: QuizLessonSlug;
  readonly messageKey: string;
  readonly correctCount: number;
  readonly total: number;
  readonly footer: ReactNode;
  /** 本文へ戻る */
  readonly onReviewBody: () => void;
}) {
  const t = useTranslations("lessons");
  const tLesson = useTranslations(`lessons.${messageKey}`);
  const tAll = useTranslations();
  const router = useRouter();
  const goToTab = useGoToTab();
  const { input: progress } = useAccountProgress();

  const perfect = correctCount === total;
  const planned = stepAfterLesson(slug);
  const followUp = lessonFollowUp(slug, progress);
  // 次が確認問題を持つレッスンなら、その冒頭をボタンの代わりに見せる
  const previewSlug =
    planned?.kind === "lesson" &&
    isQuizLessonSlug(planned.chapterSlug) &&
    isLessonPorted(planned.chapterSlug)
      ? planned.chapterSlug
      : undefined;
  const { usePlanned, step } = resolveLessonNextStep(
    planned,
    followUp.next,
    previewSlug,
  );
  const nextPractice: PracticeLink | undefined =
    step?.kind === "practice"
      ? { slug: step.slug, variant: step.variant }
      : undefined;
  const stepReachable =
    step !== undefined &&
    (step.kind !== "lesson" || isLessonPorted(step.chapterSlug));
  const rank = rankBySlug(quizLessonBySlug(slug)?.rankSlug ?? "kyu-5");
  const goal =
    planned === undefined ||
    planned.kind === "lesson" ||
    rank === undefined ? undefined : (
      <RankGoalPanel
        rankSlug={rank.slug}
        examSlug={menuTypeToSlug(rank.exam.menuType)}
        progress={followUp.rankJourneyProgress}
      />
    );

  return (
    <View style={styles.done}>
      <View style={styles.doneSection}>
        <SectionTitle>
          {perfect ? t("doneTitle") : t("doneTitleReview")}
        </SectionTitle>
        {perfect ? (
          // 合格と同じ success の囲み。レッスンの完了は小さな合格
          <View style={styles.achievement} testID="lesson-achievement">
            <View style={styles.achievementRow}>
              <View style={styles.achievementMark}>
                <JudgementMark verdict="correct" />
              </View>
              <Text style={styles.achievementText}>
                {tLesson("achievement")}
              </Text>
            </View>
          </View>
        ) : (
          // 間違えた問題があるときは「できるようになった」と言わず、正答数と
          // 見直しの案内を中立の囲みで出す。全問正解のときは正答数を出さない
          <View style={styles.review} testID="lesson-review">
            <Text style={styles.score} testID="lesson-score">
              {t("doneScore", { correct: correctCount, total })}
            </Text>
            <Text style={styles.reviewAdvice}>{t("doneReviewAdvice")}</Text>
            <Button
              variant="neutral"
              fullWidth
              onPress={onReviewBody}
              testID="lesson-done-review-body"
            >
              {t("reviewBody")}
            </Button>
          </View>
        )}
        {usePlanned && previewSlug !== undefined ? (
          <NextLessonPreview slug={previewSlug} />
        ) : stepReachable ? (
          <Button
            size="lg"
            fullWidth
            onPress={() =>
              // レッスンからレッスンへは置き換える（NextLessonPreview と同じ理由）
              step.kind === "lesson"
                ? router.replace(journeyStepHref(step))
                : router.push(journeyStepHref(step))
            }
          >
            {t(`nextStep.${step.kind}`, {
              title: journeyStepTitle(step, tAll),
            })}
          </Button>
        ) : (
          <Button size="lg" fullWidth onPress={() => goToTab("/")}>
            {t("continueHome")}
          </Button>
        )}
        {goal}
        {/* 全問正解でも表を見返したい人へ。次の一歩の下に移動だけのリンクで置く。
            戻った本文は完了済みの形（解き直しのリンクと次のレッスン・練習）になる。
            間違えたときは結果の囲みの中に置くので出さない */}
        {perfect && (
          <TextLink onPress={onReviewBody} testID="lesson-done-review-body">
            {t("reviewBody")}
          </TextLink>
        )}
      </View>

      {/* 記録が残らない人（ゲスト・ユーザー名が未設定）にだけ出る登録の案内。
          web は未ログインの完了画面で次の一歩の代わりに登録の囲みを出すが、
          アプリはゲストの完了も端末に残り次の一歩が使えるので、次の一歩の下に添える */}
      <RecordCtaCard placement="lesson" />

      <ChapterRelatedLinks slug={slug} exclude={nextPractice} />
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  done: {
    gap: 32,
  },
  doneSection: {
    gap: 16,
  },
  achievement: {
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.panel,
    backgroundColor: colors.successSubtle,
    padding: 20,
    gap: 8,
  },
  achievementRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  achievementMark: {
    paddingTop: 4,
  },
  achievementText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: "700",
    color: verdictTextColors.correct,
  },
  score: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface900,
  },
  review: {
    borderWidth: borderWidth.panel,
    borderColor: colors.panel,
    borderRadius: radius.panel,
    backgroundColor: colors.surface50,
    padding: 20,
    gap: 12,
  },
  reviewAdvice: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface700,
  },
});
