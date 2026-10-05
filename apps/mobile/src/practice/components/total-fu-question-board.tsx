import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { FU_VALUES } from "@mahjong-scoring/core";
import type { TotalFuQuestion } from "@mahjong-scoring/core";
import {
  toFuQuestionResult,
  type FuQuestionResult,
} from "@mahjong-scoring/features/results/fu-question-result";

import { TehaiDisplay } from "../../board/tehai-display";
import { TehaiMentsuBreakdown } from "../../board/tehai-mentsu-breakdown";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { useFuChoiceBoard } from "@mahjong-scoring/features/practice/use-fu-choice-board";
import { useTrainingMode } from "@mahjong-scoring/features/practice/use-training-mode";
import { FuBreakdown } from "./fu-breakdown";
import { FuChoiceGrid } from "./fu-choice-grid";
import { QuestionPlaceholder } from "./question-placeholder";
import { QuestionPrompt } from "./question-prompt";

/**
 * 手牌の合計符を答える盤面（web の `TotalFuQuestionBoard`）
 *
 * 手牌の合計符の練習と符の昇級試験で共有する。出題の作り方と辞書の名前空間
 * だけを受け取る。面子分解と符の内訳は答えが割れるので、トレーニングの
 * 答え合わせ中だけ出す。
 */
export function TotalFuQuestionBoard({
  generateQuestion,
  translationNamespace,
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: RecordingPracticeBoardProps<FuQuestionResult> & {
  readonly generateQuestion: () => TotalFuQuestion | undefined;
  readonly translationNamespace: string;
}) {
  const t = useTranslations(translationNamespace);
  const recordResult = useCallback(
    (question: TotalFuQuestion, fu: number) =>
      onRecordResult?.(toFuQuestionResult(question, fu)),
    [onRecordResult],
  );
  const presentQuestion = useCallback(
    (question: TotalFuQuestion) =>
      onPresentQuestion?.(toFuQuestionResult(question, undefined)),
    [onPresentQuestion],
  );
  const { question, selectedFu, handleSelect } = useFuChoiceBoard({
    generateQuestion,
    options: FU_VALUES,
    showFeedback,
    onAnswer,
    onRecordResult: recordResult,
    onPresentQuestion: presentQuestion,
  });
  const { isRevealed, isHolding } = useTrainingMode();

  if (!question) {
    return <QuestionPlaceholder label={t("generating")} />;
  }

  return (
    <View style={styles.board}>
      <TehaiDisplay tehai={question.tehai} context={question.context} />
      <QuestionPrompt>{t("prompt")}</QuestionPrompt>
      <FuChoiceGrid
        options={FU_VALUES}
        answer={question.answer}
        selectedFu={selectedFu}
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        onSelect={handleSelect}
        columns={3}
        translationNamespace={translationNamespace}
      />
      {(isRevealed || isHolding) && (
        <TehaiMentsuBreakdown
          tehai={question.tehai}
          context={question.context}
        />
      )}
      {(isRevealed || isHolding) && (
        <FuBreakdown
          details={question.fuDetails}
          answer={question.answer}
          translationNamespace={translationNamespace}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: 16,
  },
});
