import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Grid } from "../../../components/grid";
import { Tile } from "../../../components/tile";
import { generateJantouFuQuestion, getKazeName } from "@mahjong-scoring/core";
import type {
  JantouFuChoice,
  JantouFuQuestion,
  Kazehai,
} from "@mahjong-scoring/core";
import {
  toQuestionResult,
  type JantouFuQuestionResult,
} from "@mahjong-scoring/features/practice/jantou-fu/types";

import { useRuleSettingsStore } from "../../../hooks/use-rule-settings-store";
import { colors } from "../../../lib/theme";
import type { RecordingPracticeBoardProps } from "../../board-props";
import { ChoiceButton } from "../../components/choice-button";
import { QuestionPrompt } from "../../components/question-prompt";
import { choiceFeedbackProps } from "../../feedback-styles";
import { useGeneratedQuestion } from "../../hooks/use-generated-question";
import { usePresentQuestion } from "../../hooks/use-present-question";
import { useRegisterAdvance } from "../../hooks/use-training-mode";

/** 出題中の問題を回答なしの結果に組む（時間切れの届け出用） */
function toUnansweredResult(
  question: JantouFuQuestion,
): JantouFuQuestionResult {
  return toQuestionResult(question, undefined);
}

/** 場風・自風の提示 */
function KazeContext({
  bakaze,
  jikaze,
}: {
  readonly bakaze: Kazehai;
  readonly jikaze: Kazehai;
}) {
  const t = useTranslations("jantouFu");
  return (
    <View style={styles.context}>
      <View style={styles.contextItem}>
        <Text style={styles.contextLabel}>{t("bakaze")}</Text>
        <Text style={styles.contextValue}>{getKazeName(bakaze)}</Text>
      </View>
      <View style={styles.contextItem}>
        <Text style={styles.contextLabel}>{t("jikaze")}</Text>
        <Text style={styles.contextValue}>{getKazeName(jikaze)}</Text>
      </View>
    </View>
  );
}

/**
 * 雀頭符の出題盤面（場風・自風の提示と 4 択）
 *
 * web の `JantouFuBoard` の移植。出題状態と回答ロジックを内包し、チャレンジ・
 * トレーニング両モードで共有する。
 */
export function JantouFuBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: RecordingPracticeBoardProps<JantouFuQuestionResult>) {
  const t = useTranslations("jantouFu");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const generate = useCallback(
    (): JantouFuQuestion => generateJantouFuQuestion({ renfonpaiAs4Fu }),
    [renfonpaiAs4Fu],
  );
  const [question, nextQuestion] = useGeneratedQuestion(generate);
  const [selectedHai, setSelectedHai] = useState<
    JantouFuChoice["hai"] | undefined
  >(undefined);

  const advanceQuestion = useCallback(() => {
    nextQuestion();
    setSelectedHai(undefined);
  }, [nextQuestion]);

  useRegisterAdvance(advanceQuestion);
  usePresentQuestion(question, toUnansweredResult, onPresentQuestion);

  const handleSelect = useCallback(
    (index: number) => {
      if (showFeedback) return;
      const choice = question.choices[index];
      setSelectedHai(choice.hai);
      onRecordResult?.(toQuestionResult(question, choice));
      onAnswer(choice.isCorrect, advanceQuestion);
    },
    [showFeedback, question, onRecordResult, onAnswer, advanceQuestion],
  );

  return (
    <View style={styles.board}>
      <KazeContext
        bakaze={question.context.bakaze}
        jikaze={question.context.jikaze}
      />
      <QuestionPrompt>{t("selectCorrectHead")}</QuestionPrompt>
      <Grid columns={2}>
        {question.choices.map((choice, i) => (
          <ChoiceButton
            key={`${question.id}-${choice.hai}`}
            index={i}
            onSelect={handleSelect}
            style={styles.choice}
            {...choiceFeedbackProps({
              showFeedback,
              isCountingDown,
              isSelected: selectedHai === choice.hai,
              isCorrect: choice.isCorrect,
            })}
          >
            <Tile hai={choice.hai} size="md" />
          </ChoiceButton>
        ))}
      </Grid>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: 20,
  },
  context: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  contextItem: {
    alignItems: "center",
    gap: 4,
  },
  contextLabel: {
    fontSize: 14,
    color: colors.surface400,
  },
  contextValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.surface900,
  },
  choice: {
    paddingVertical: 20,
  },
});
