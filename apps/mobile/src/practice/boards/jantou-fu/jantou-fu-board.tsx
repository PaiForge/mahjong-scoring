import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Grid } from "../../../components/grid";
import { Tile } from "../../../components/tile";
import { getKazeName } from "@mahjong-scoring/core";
import type { Kazehai } from "@mahjong-scoring/core";
import type { JantouFuQuestionResult } from "@mahjong-scoring/features/practice/jantou-fu/types";
import { useJantouFuBoard } from "@mahjong-scoring/features/practice/jantou-fu/use-jantou-fu-board";

import { useRuleSettingsStore } from "../../../hooks/use-rule-settings-store";
import { colors } from "../../../lib/theme";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { ChoiceButton } from "../../components/choice-button";
import { QuestionPlaceholder } from "../../components/question-placeholder";
import { QuestionPrompt } from "../../components/question-prompt";
import { choiceFeedbackProps } from "../../feedback-styles";

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
 * web の `JantouFuBoard` の移植。出題状態と回答ロジックは `useJantouFuBoard` が持ち、チャレンジ・
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
  const { question, selectedHai, handleSelect } = useJantouFuBoard({
    renfonpaiAs4Fu,
    showFeedback,
    onAnswer,
    onRecordResult,
    onPresentQuestion,
  });

  if (!question) return <QuestionPlaceholder label={t("generating")} />;

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
