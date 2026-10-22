import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { FU_VALUES } from "@mahjong-scoring/core";
import type { Fu, TotalFuQuestion } from "@mahjong-scoring/core";
import {
  toFuQuestionResult,
  type FuQuestionResult,
} from "@mahjong-scoring/features/results/fu-question-result";

import { TehaiDisplay } from "../../board/tehai-display";
import { TehaiMentsuBreakdown } from "../../board/tehai-mentsu-breakdown";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { useFuChoiceBoard } from "@mahjong-scoring/features/practice/use-fu-choice-board";
import { useTrainingMode } from "@mahjong-scoring/features/practice/use-training-mode";
import { AnswerReviewPanel } from "./answer-review-panel";
import { FuBreakdown } from "./fu-breakdown";
import { FuChoiceGrid } from "./fu-choice-grid";
import { QuestionPlaceholder } from "./question-placeholder";
import { QuestionPrompt } from "./question-prompt";

/**
 * 手牌の合計符を答える盤面（web の `TotalFuQuestionBoard`）
 *
 * 手牌の合計符の練習と符の昇級試験で共有する。出題の作り方と辞書の名前空間
 * だけを受け取る。面子分解と符の内訳は答えが割れるので、トレーニングの
 * 答え合わせ中だけ、1 枚の面（{@link AnswerReviewPanel}）に入れて出す
 * （直下の「次の問題へ」と境目を付ける）。
 */
export function TotalFuQuestionBoard({
  generateQuestion,
  options = FU_VALUES,
  translationNamespace,
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: RecordingPracticeBoardProps<FuQuestionResult> & {
  readonly generateQuestion: () => TotalFuQuestion | undefined;
  /** 回答の選択肢（既定は全符）。出題範囲を絞る練習は範囲の符だけを渡す */
  readonly options?: readonly Fu[];
  readonly translationNamespace: string;
}) {
  const t = useTranslations(translationNamespace);
  const { question, selectedFu, handleSelect } = useFuChoiceBoard({
    generateQuestion,
    options,
    toResult: toFuQuestionResult,
    showFeedback,
    onAnswer,
    onRecordResult,
    onPresentQuestion,
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
        options={options}
        answer={question.answer}
        selectedFu={selectedFu}
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        onSelect={handleSelect}
        columns={3}
        translationNamespace={translationNamespace}
      />
      {(isRevealed || isHolding) && (
        <AnswerReviewPanel>
          <TehaiMentsuBreakdown
            tehai={question.tehai}
            context={question.context}
          />
          <FuBreakdown
            details={question.fuDetails}
            answer={question.answer}
            translationNamespace={translationNamespace}
            surface="sunken"
          />
        </AnswerReviewPanel>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: 16,
  },
});
