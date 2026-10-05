import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import type {
  ScoreTableQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import type { PracticeVariantOf } from "@mahjong-scoring/features/practice-menu-types";
import {
  toQuestionResult,
  type ScoreTableQuestionResult,
} from "@mahjong-scoring/features/practice/score-table/types";
import { AnswerOutcome } from "@mahjong-scoring/features/results/result-schemas";

import { radius } from "../../../lib/theme";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { feedbackFrameStyle } from "../../feedback-styles";
import { usePresentQuestion } from "../../hooks/use-present-question";
import {
  useRegisterAdvance,
  useTrainingAnswerVisibility,
} from "@mahjong-scoring/features/practice/use-training-mode";
import { ScoreTableAnswerForm } from "./score-table-answer-form";
import { ScoreTablePrompt } from "./score-table-prompt";
import {
  useScoreTableGeneratorOptions,
  useScoreTableQuestion,
} from "./use-score-table-question";

interface ScoreTableBoardProps extends RecordingPracticeBoardProps<ScoreTableQuestionResult> {
  /** 現在の問題 */
  readonly question: ScoreTableQuestion;
  /** 次の問題へ進む（回答後の遷移に使用） */
  readonly onAdvance: () => void;
}

/** 出題中の問題を回答なしの結果に組む（時間切れの届け出用） */
function toUnansweredResult(
  question: ScoreTableQuestion,
): ScoreTableQuestionResult {
  return toQuestionResult(question, undefined);
}

/**
 * 点数表早引きの出題盤面（条件の提示と点数の回答）
 *
 * web の `ScoreTableBoard` の移植。出題状態は呼び出し側
 * （{@link ScoreTableVariantBoard}）が保持し、本コンポーネントは与えられた
 * 問題の提示と回答判定のみを行う。チャレンジ・トレーニング両モードで共有する。
 * 自前の枠を持たない出題なので、出題を囲む枠が正誤の色を返す。
 */
export function ScoreTableBoard({
  question,
  onAdvance,
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  lastAnswerCorrect,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: ScoreTableBoardProps) {
  useRegisterAdvance(onAdvance);
  usePresentQuestion(question, toUnansweredResult, onPresentQuestion);
  // トレーニングでは開示時だけでなく回答後の停止中も正解を出す（答え合わせ用）。
  // 正解のときは出さない — 選んだ値がそのまま正解で、枠の色が正誤を示している
  const { showAnswer } = useTrainingAnswerVisibility(lastAnswerCorrect);

  const handleSubmit = useCallback(
    (userAnswer: ScoreTableUserAnswer) => {
      if (showFeedback) return;
      const result = toQuestionResult(question, userAnswer);
      onRecordResult?.(result);
      onAnswer(result.outcome === AnswerOutcome.Correct, onAdvance);
    },
    [showFeedback, question, onRecordResult, onAnswer, onAdvance],
  );

  return (
    <View style={styles.board}>
      <View
        style={[
          styles.frame,
          feedbackFrameStyle(showFeedback, lastAnswerCorrect),
        ]}
      >
        <ScoreTablePrompt
          isOya={question.isOya}
          isTsumo={question.isTsumo}
          han={question.han}
          fu={question.fu}
          revealedAnswer={showAnswer ? question.correctAnswer : undefined}
        />
      </View>

      <ScoreTableAnswerForm
        question={question}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
        isTraining={isTraining}
      />
    </View>
  );
}

/**
 * バリアント（出題条件）で出題状態を持つ盤面
 *
 * web の `ScoreTableBoardFromQuery`（と手書きのトレーニングビュー）に当たる。
 * web は URL のバリアントを読むために出題状態をビュー側へ引き上げているが、
 * モバイルはバリアントを props で受け取るので、ここで出題状態を持つ。
 */
export function ScoreTableVariantBoard({
  variant,
  ...props
}: RecordingPracticeBoardProps<ScoreTableQuestionResult> & {
  readonly variant: PracticeVariantOf<"score-table">;
}) {
  const generatorOptions = useScoreTableGeneratorOptions(
    variant,
    props.isTraining ?? false,
  );
  const { question, advance } = useScoreTableQuestion(generatorOptions);
  return <ScoreTableBoard {...props} question={question} onAdvance={advance} />;
}

const styles = StyleSheet.create({
  board: {
    marginTop: 24,
    gap: 24,
  },
  frame: {
    borderWidth: 3,
    borderRadius: radius.xl,
    padding: 24,
  },
});
