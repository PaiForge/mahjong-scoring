import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  choiceKey,
  isSameChoice,
  type LessonChoice,
  type LessonPrompt,
  type LessonQuestion,
} from "@mahjong-scoring/features/lessons/quiz";
import {
  lessonAnswerLabel,
  lessonChoiceLabel,
  lessonConditionValues,
} from "@mahjong-scoring/features/lessons/quiz-labels";

import { TehaiDisplay } from "../../board/tehai-display";
import { Button } from "../../components/button";
import { Grid } from "../../components/grid";
import { LightbulbIcon } from "../../components/icons/icons";
import { useScrollIntoView } from "../../components/scroll-into-view";
import { SectionTitle } from "../../components/section-title";
import { TextLink } from "../../components/text-link";
import { borderWidth, colors, radius } from "../../lib/theme";
import { ChoiceButton } from "../../practice/components/choice-button";
import { JudgementMark } from "../../practice/components/judgement-mark";
import { PromptLabel } from "../../practice/components/prompt-label";
import { QuestionPrompt } from "../../practice/components/question-prompt";
import {
  choiceFeedbackStyle,
  feedbackFrameStyle,
} from "../../practice/feedback-styles";
import { lessonColors, verdictTextColors } from "../lesson-colors";
import { LessonQuizSteps } from "./lesson-quiz-steps";
import { MachiTiles, MentsuSet, TileSet } from "./tile-row";

/**
 * 条件文の下に並べる牌（web の `PromptTiles`）
 * 出題牌
 *
 * 牌を見て答える問題（雀頭・面子・待ち）だけが持つ。手牌の問題は枠の外の
 * 盤面（{@link PromptBoard}）に出す。
 */
function PromptTiles({ prompt }: { readonly prompt: LessonPrompt }) {
  switch (prompt.kind) {
    case "tier":
    case "yaku":
    case "agari":
    case "extraFu":
    case "tehai":
      return undefined;
    case "jantou":
      return <TileSet tiles={[prompt.tile, prompt.tile]} size="md" />;
    case "mentsu":
      return <MentsuSet mentsu={prompt.mentsu} size="md" />;
    case "machi":
      return (
        <MachiTiles tiles={prompt.tiles} agariHai={prompt.agariHai} size="md" />
      );
    default: {
      const exhaustive: never = prompt;
      return exhaustive;
    }
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

/**
 * レッスンの確認問題の段階（`quiz`。web の `LessonQuizPhase`）
 * 確認問題の段階
 *
 * 答えると判定と解説が選択肢の上に入り、選択肢と「次へ」が下へ押し出される。
 * 小さな画面や文字を大きくした端末では、判定から「次へ」までが画面に
 * 収まらないことがある。判定の先頭から「次へ」までを 1 つとして見えるところへ
 * 送り（見えていれば動かさない）、収まらなければ判定の先頭に合わせる —
 * 「次へ」を優先すると、読む前の解説が画面の上へ追い出されるため。「次へ」は
 * 解説を読み進めた先の下にある。答えた問題へ本文から戻ったときも同じ。
 */
export function LessonQuizPhase({
  messageKey,
  question,
  choices,
  selected,
  showHint,
  index,
  total,
  onSelect,
  onShowHint,
  onNext,
  onReviewBody,
}: {
  readonly messageKey: string;
  readonly question: LessonQuestion;
  readonly choices: readonly LessonChoice[];
  readonly selected: LessonChoice | undefined;
  readonly showHint: boolean;
  readonly index: number;
  readonly total: number;
  readonly onSelect: (choiceIndex: number) => void;
  readonly onShowHint: () => void;
  readonly onNext: () => void;
  readonly onReviewBody: () => void;
}) {
  const t = useTranslations("lessons");
  const tLesson = useTranslations(`lessons.${messageKey}`);
  const tScoreTable = useTranslations("scoreTable");
  const scrollIntoView = useScrollIntoView();
  const judgementRef = useRef<View>(null);
  const nextButtonRef = useRef<View>(null);

  const isAnswered = selected !== undefined;
  const isCorrect = isAnswered && isSameChoice(selected, question.answer);
  const isLast = index === total - 1;

  useEffect(() => {
    if (!isAnswered) return;
    const frame = requestAnimationFrame(() => {
      scrollIntoView(judgementRef.current, {
        block: "nearest",
        until: nextButtonRef.current,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [isAnswered, scrollIntoView]);

  return (
    <View style={styles.quiz}>
      <SectionTitle>{t("quizTitle")}</SectionTitle>
      <LessonQuizSteps
        current={index}
        total={total}
        label={t("progress", { index: index + 1, total })}
      />

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
          <View
            style={styles.hint}
            testID="lesson-hint"
            accessible
            accessibilityLabel={`${t("hintLabel")}: ${tLesson(`questions.${question.key}.hint`)}`}
          >
            {/* 見出しの「ヒント:」は電球で示し、読み上げにだけ残す。文字は控えめな灰、
                琥珀は電球だけ（濃い琥珀の文字は警告の色と同じで注意書きに見える） */}
            <View style={styles.hintIcon}>
              <LightbulbIcon size={16} color={lessonColors.amber600} />
            </View>
            <Text style={styles.hintText}>
              {tLesson(`questions.${question.key}.hint`)}
            </Text>
          </View>
        )}
        {isAnswered && (
          <View
            ref={judgementRef}
            collapsable={false}
            style={styles.judgement}
            testID="lesson-judgement"
          >
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
            onSelect={onSelect}
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
        <View ref={nextButtonRef} collapsable={false}>
          <Button size="lg" fullWidth onPress={onNext} testID="lesson-next">
            {isLast ? t("finish") : t("next")}
          </Button>
        </View>
      ) : (
        <Button
          variant="secondary"
          fullWidth
          disabled={showHint}
          onPress={onShowHint}
        >
          {t("showHint")}
        </Button>
      )}
      <TextLink onPress={onReviewBody} testID="lesson-review-body">
        {t("reviewBody")}
      </TextLink>
    </View>
  );
}

const styles = StyleSheet.create({
  quiz: {
    gap: 16,
  },
  frame: {
    borderWidth: borderWidth.panel,
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
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 6,
  },
  hintIcon: {
    marginTop: 1,
  },
  hintText: {
    flexShrink: 1,
    fontSize: 14,
    color: colors.mutedForeground,
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
});
