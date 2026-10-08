import { useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { PracticeLink } from "@mahjong-scoring/features/curriculum/registry";
import { stepAfterLesson } from "@mahjong-scoring/features/journey/journey";
import { lessonFollowUp } from "@mahjong-scoring/features/lessons/follow-up";
import {
  journeyStepHref,
  journeyStepTitle,
} from "@mahjong-scoring/features/journey/journey-step";
import {
  choiceKey,
  isSameChoice,
  type LessonChoice,
  type LessonPrompt,
} from "@mahjong-scoring/features/lessons/quiz";
import {
  lessonAnswerLabel,
  lessonChoiceLabel,
  lessonConditionValues,
} from "@mahjong-scoring/features/lessons/quiz-labels";
import { lessonQuiz } from "@mahjong-scoring/features/lessons/quizzes";
import {
  isQuizLessonSlug,
  quizLessonBySlug,
  type QuizLessonSlug,
} from "@mahjong-scoring/features/lessons/registry";
import { menuTypeToSlug } from "@mahjong-scoring/features/practice-menu-types";
import { rankBySlug } from "@mahjong-scoring/features/ranks/registry";

import { TehaiDisplay } from "../../board/tehai-display";
import { Button } from "../../components/button";
import { Grid } from "../../components/grid";
import { SectionTitle } from "../../components/section-title";
import { TextLink } from "../../components/text-link";
import {
  useCompletedLessonSlugs,
  useLessonCompleted,
  useLessonCompletionStore,
} from "../../hooks/use-lesson-completion-store";
import { useAttemptedPractices } from "../../hooks/use-practice-attempt-store";
import { hapticJudgement } from "../../lib/haptics";
import { colors, radius } from "../../lib/theme";
import { ChoiceButton } from "../../practice/components/choice-button";
import { JudgementMark } from "../../practice/components/judgement-mark";
import { PromptLabel } from "../../practice/components/prompt-label";
import { QuestionPrompt } from "../../practice/components/question-prompt";
import {
  choiceFeedbackStyle,
  feedbackFrameStyle,
} from "../../practice/feedback-styles";
import { isLessonPorted } from "../ported-lessons";
import { lessonColors, verdictTextColors } from "../lesson-colors";
import { ChapterRelatedLinks } from "./chapter-related-links";
import { DoneMark } from "./done-mark";
import { NextLessonPreview } from "./next-lesson-preview";
import { RankGoalPanel } from "./rank-goal-panel";
import { MachiTiles, MentsuSet, TileSet } from "./tile-row";

/** レッスンの段階（並びは進む順） */
type LessonPhase = "learn" | "quiz" | "done";

/**
 * 条件文の下に並べる牌（web の `PromptTiles`）
 * 出題牌
 *
 * 牌を見て答える問題（雀頭・面子・待ち）だけが持つ。手牌の問題は枠の外の
 * 盤面（{@link PromptBoard}）に出す。
 */
function PromptTiles({ prompt }: { readonly prompt: LessonPrompt }) {
  switch (prompt.kind) {
    case "jantou":
      return <TileSet tiles={[prompt.tile, prompt.tile]} size="md" />;
    case "mentsu":
      return <MentsuSet mentsu={prompt.mentsu} size="md" />;
    case "machi":
      return (
        <MachiTiles tiles={prompt.tiles} agariHai={prompt.agariHai} size="md" />
      );
    default:
      return undefined;
  }
}

/**
 * 条件の枠の上に置く手牌の盤面（web の `PromptBoard`）
 * 出題盤面
 *
 * 練習と同じ盤面で、画面の左右いっぱいに広げて牌を大きく保つ。
 */
function PromptBoard({ prompt }: { readonly prompt: LessonPrompt }) {
  if (prompt.kind !== "tehai") return undefined;
  return (
    <TehaiDisplay tehai={prompt.tehai} context={prompt.context} fullBleed />
  );
}

interface LessonViewProps {
  readonly slug: QuizLessonSlug;
  /** 確認問題の辞書の名前空間（`lessons.<messageKey>`） */
  readonly messageKey: string;
  /** 本文（章の本文そのもの） */
  readonly explanation: ReactNode;
  /** 章の末尾（広告・公開日）。確認問題の画面には出さない */
  readonly footer: ReactNode;
  /** 画面の先頭へ戻す（段階・問題が変わったとき） */
  readonly onScrollTop: () => void;
}

/**
 * レッスンの進行（本文 → 確認問題 → できたことの確認）（web の `LessonView`）
 * レッスン進行
 *
 * 確認問題はチャレンジの盤面と同じ部品（選択肢ボタン・正誤の枠・出題文）で
 * 描くが、時計もライフも無い。間違えても止まらず、正解と解説を見せてから
 * 次へ進む。正答数は完了画面で添えるだけで残さない。
 *
 * 最後の問題を解き終えたら完了を端末に記録する（web はサーバーに記録し、
 * 保存の状態ごとに完了画面の導線を変えるが、端末への記録は失敗しないので
 * その分岐は持たない）。完了画面の主導線は web と同じ: 端末の進み具合を
 * 踏まえた次の一歩（features の `lessonFollowUp`）。それが道筋の順の次の
 * レッスン（`stepAfterLesson`）と同じなら、ボタンの代わりにそのレッスンの
 * 冒頭のプレビューを出す。級の最後のレッスンでは、ボタンの下に昇級試験までの
 * 残りを添える。次のレッスンへは置き換えて移り、続けて読んでも戻るは 1 回で
 * 学習を始めた画面へ帰る。
 *
 * 完了済みの人が開いたときは、本文の下の「確認問題へ」を控えめな解き直しの
 * リンクに替え、その下に練習への導線を出す。
 *
 * web は段階をブラウザの履歴に積み「戻る」で 1 段階ずつ戻れるが、モバイルの
 * 戻るは画面を閉じる。
 */
export function LessonView({
  slug,
  messageKey,
  explanation,
  footer,
  onScrollTop,
}: LessonViewProps) {
  const t = useTranslations("lessons");
  const tLesson = useTranslations(`lessons.${messageKey}`);
  const tScoreTable = useTranslations("scoreTable");
  const tAll = useTranslations();
  const router = useRouter();
  const completed = useLessonCompleted(slug);
  const completedLessonSlugs = useCompletedLessonSlugs();
  const attemptedPractices = useAttemptedPractices();
  const markCompleted = useLessonCompletionStore((s) => s.markCompleted);

  const { questions, choices } = lessonQuiz(slug);

  const [phase, setPhase] = useState<LessonPhase>("learn");
  const [finished, setFinished] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<LessonChoice | undefined>(undefined);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const question = questions[index];
  const isAnswered = selected !== undefined;
  const isCorrect = isAnswered && isSameChoice(selected, question.answer);
  const isLast = index === questions.length - 1;

  const goTo = (next: LessonPhase) => {
    setPhase(next);
    onScrollTop();
  };

  const handleSelect = (choiceIndex: number) => {
    if (isAnswered) return;
    const choice = choices[choiceIndex];
    setSelected(choice);
    const correct = isSameChoice(choice, question.answer);
    hapticJudgement(correct ? "correct" : "incorrect");
    if (correct) {
      setCorrectCount((count) => count + 1);
    }
  };

  const handleStart = () => {
    // 解き終えたあとに本文から始めたら最初から
    if (finished) {
      setIndex(0);
      setSelected(undefined);
      setShowHint(false);
      setCorrectCount(0);
      setFinished(false);
    }
    goTo("quiz");
  };

  const handleNext = () => {
    if (isLast) {
      setFinished(true);
      markCompleted(slug);
      goTo("done");
      return;
    }
    setIndex(index + 1);
    setSelected(undefined);
    setShowHint(false);
    onScrollTop();
  };

  if (phase === "learn") {
    return (
      <View style={styles.learn}>
        {/* 完了済みの印は本文の最初の見出しの行の右端 */}
        {completed && (
          <View style={styles.doneMark}>
            <DoneMark label={t("completedMark")} />
          </View>
        )}
        {explanation}
        {completed ? (
          <>
            <TextLink onPress={handleStart}>{t("retakeQuiz")}</TextLink>
            <ChapterRelatedLinks slug={slug} />
          </>
        ) : (
          <Button size="lg" fullWidth onPress={handleStart}>
            {t("startQuiz", { count: questions.length })}
          </Button>
        )}
        {footer}
      </View>
    );
  }

  if (phase === "quiz") {
    return (
      <View style={styles.quiz}>
        <View style={styles.quizHeader}>
          {/* 見出しが残りの幅を取らないと、右へ伸びる横線が最小幅に潰れる */}
          <View style={styles.quizTitle}>
            <SectionTitle>{t("quizTitle")}</SectionTitle>
          </View>
          <Text style={styles.progress}>
            {t("progress", { index: index + 1, total: questions.length })}
          </Text>
        </View>

        <PromptBoard prompt={question.prompt} />

        <View
          style={[
            styles.frame,
            feedbackFrameStyle(isAnswered, isAnswered ? isCorrect : undefined),
          ]}
        >
          <PromptLabel>{t("conditionLabel")}</PromptLabel>
          <Text style={styles.condition} testID="lesson-condition">
            {tLesson(
              "condition",
              lessonConditionValues(question.prompt, tScoreTable),
            )}
          </Text>
          <PromptTiles prompt={question.prompt} />
          {/* ヒントは答えそのものではなく、表を思い出す手がかり */}
          {showHint && !isAnswered && (
            <Text style={styles.hint} testID="lesson-hint">
              <Text style={styles.hintLabel}>{`${t("hintLabel")}: `}</Text>
              {tLesson(`questions.${question.key}.hint`)}
            </Text>
          )}
          {isAnswered && (
            <View style={styles.judgement} testID="lesson-judgement">
              <JudgementMark verdict={isCorrect ? "correct" : "incorrect"} />
              <Text
                style={[
                  styles.judgementText,
                  {
                    color: isCorrect
                      ? verdictTextColors.correct
                      : verdictTextColors.incorrect,
                  },
                ]}
              >
                {isCorrect
                  ? t("correct")
                  : t("incorrect", {
                      answer: lessonAnswerLabel(question.answer, t),
                    })}
              </Text>
            </View>
          )}
          {isAnswered && (
            <Text style={styles.explanation}>
              {tLesson(`questions.${question.key}.explanation`)}
            </Text>
          )}
        </View>

        <QuestionPrompt>{tLesson("questionPrompt")}</QuestionPrompt>

        <Grid columns={2}>
          {choices.map((choice, choiceIndex) => (
            <ChoiceButton
              key={choiceKey(choice)}
              index={choiceIndex}
              onSelect={handleSelect}
              disabled={isAnswered}
              feedbackStyle={choiceFeedbackStyle(
                isAnswered,
                selected !== undefined && isSameChoice(selected, choice),
                isSameChoice(choice, question.answer),
              )}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.choice,
                  choice.kind === "koTsumo" && styles.choiceSmall,
                ]}
              >
                {lessonChoiceLabel(choice, t)}
              </Text>
            </ChoiceButton>
          ))}
        </Grid>

        {isAnswered ? (
          <Button size="lg" fullWidth onPress={handleNext}>
            {isLast ? t("finish") : t("next")}
          </Button>
        ) : (
          <Button
            variant="secondary"
            fullWidth
            disabled={showHint}
            onPress={() => setShowHint(true)}
          >
            {t("showHint")}
          </Button>
        )}
      </View>
    );
  }

  // 道筋の順の一歩（ページの順序）と、端末の進み具合を踏まえた一歩
  const planned = stepAfterLesson(slug);
  const followUp = lessonFollowUp(slug, {
    completedLessonSlugs,
    attemptedPractices,
    achievedRankSlugs: [],
  });
  // 次が確認問題を持つレッスンなら、その冒頭をボタンの代わりに見せる
  const previewSlug =
    planned?.kind === "lesson" &&
    isQuizLessonSlug(planned.chapterSlug) &&
    isLessonPorted(planned.chapterSlug)
      ? planned.chapterSlug
      : undefined;
  // 進み具合の一歩が求まらないか、道筋の順の次のレッスンと同じなら道筋の順に従う
  const progressStep = followUp.next;
  const usePlanned =
    progressStep === undefined ||
    (progressStep.kind === "lesson" &&
      progressStep.chapterSlug === previewSlug);
  const step = usePlanned ? planned : progressStep;
  const nextPractice: PracticeLink | undefined =
    step?.kind === "practice"
      ? { slug: step.slug, variant: step.variant }
      : undefined;
  // 次の一歩が無いか開けないレッスン（今の前提章はすべて開ける）なら、web と
  // 同じくホームの「次にやること」に任せる。昇級試験は説明画面（模試）へ送る
  const stepReachable =
    step !== undefined &&
    (step.kind !== "lesson" || isLessonPorted(step.chapterSlug));
  // 級の最後のレッスン（道筋の次がレッスンでない）では昇級試験までの残りを添える
  const rank = rankBySlug(quizLessonBySlug(slug)?.rankSlug ?? "kyu-5");
  const goal =
    planned === undefined ||
    planned.kind === "lesson" ||
    rank === undefined ? undefined : (
      <RankGoalPanel
        rankSlug={rank.slug}
        examSlug={menuTypeToSlug(rank.exam.menuType)}
        progress={followUp.rankProgress}
      />
    );

  return (
    <View style={styles.done}>
      <View style={styles.doneSection}>
        <SectionTitle>{t("doneTitle")}</SectionTitle>
        {/* 合格と同じ success の囲み。レッスンの完了は小さな合格 */}
        <View style={styles.achievement} testID="lesson-achievement">
          <View style={styles.achievementRow}>
            <View style={styles.achievementMark}>
              <JudgementMark verdict="correct" />
            </View>
            <Text style={styles.achievementText}>{tLesson("achievement")}</Text>
          </View>
          <Text style={styles.score} testID="lesson-score">
            {correctCount === questions.length
              ? t("doneScorePerfect", { total: questions.length })
              : t("doneScore", {
                  correct: correctCount,
                  total: questions.length,
                })}
          </Text>
        </View>
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
          <Button size="lg" fullWidth onPress={() => router.navigate("/")}>
            {t("continueHome")}
          </Button>
        )}
        {goal}
      </View>

      <ChapterRelatedLinks slug={slug} exclude={nextPractice} />
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  learn: {
    gap: 32,
  },
  doneMark: {
    position: "absolute",
    top: 4,
    right: 0,
    zIndex: 1,
  },
  quiz: {
    gap: 16,
  },
  quizHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quizTitle: {
    flex: 1,
    minWidth: 0,
  },
  progress: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    color: colors.surface600,
  },
  frame: {
    borderWidth: 3,
    borderRadius: radius.xl,
    padding: 24,
    gap: 12,
    alignItems: "center",
  },
  condition: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    color: colors.surface900,
  },
  hint: {
    fontSize: 14,
    textAlign: "center",
    color: lessonColors.amber900,
  },
  hintLabel: {
    fontWeight: "700",
  },
  judgement: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  judgementText: {
    fontSize: 14,
    fontWeight: "700",
  },
  explanation: {
    fontSize: 14,
    lineHeight: 24,
    textAlign: "center",
    color: colors.surface700,
  },
  choice: {
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    color: colors.surface900,
  },
  choiceSmall: {
    fontSize: 16,
  },
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
    paddingLeft: 24,
    fontSize: 14,
    color: verdictTextColors.correct,
  },
});
