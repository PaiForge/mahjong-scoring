import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  clampHanToYakuman,
  generateValidScoreQuestion,
} from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import { tehaiContextOf } from "@mahjong-scoring/features/board/score-question-context";
import {
  toHanCountQuestionResult,
  type HanCountQuestionResult,
} from "@mahjong-scoring/features/practice/han-count/types";

import { TehaiDisplay } from "../../../board/tehai-display";
import { TehaiMentsuBreakdown } from "../../../board/tehai-mentsu-breakdown";
import type { RecordingPracticeBoardProps } from "../../board-props";
import { QuestionPlaceholder } from "../../components/question-placeholder";
import { useGeneratedQuestion } from "../../hooks/use-generated-question";
import { usePresentQuestion } from "../../hooks/use-present-question";
import {
  useRegisterAdvance,
  useTrainingMode,
} from "@mahjong-scoring/features/practice/use-training-mode";
import { HanBreakdown } from "./han-breakdown";
import { HanCountAnswerForm } from "./han-count-answer-form";

function generateQuestion(): ScoreQuestion | undefined {
  return generateValidScoreQuestion();
}

/** 出題中の問題を回答なしの結果に組む（時間切れの届け出用） */
function toUnansweredResult(question: ScoreQuestion): HanCountQuestionResult {
  return toHanCountQuestionResult(question, undefined);
}

/**
 * 翻数即答の出題盤面（手牌の提示と翻数入力）
 *
 * web の `HanCountBoard` の移植。出題状態と回答ロジックを内包し、チャレンジ・
 * トレーニング両モードで共有する（web はビューが出題状態を持って渡すが、
 * モバイルのビューは盤面の状態を持たないため盤面が持つ）。
 *
 * トレーニングの答え合わせでは、選択肢の下に面子分解と翻数の内訳を足す
 * （閉じた状態から始め、開いても伸びるのは下方向だけ）。チャレンジには出さない。
 */
export function HanCountBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: RecordingPracticeBoardProps<HanCountQuestionResult>) {
  const t = useTranslations("hanCountChallenge");
  const [question, nextQuestion] = useGeneratedQuestion(generateQuestion);
  const [questionIndex, setQuestionIndex] = useState(0);
  // トレーニングでは開示時も回答後の停止中も内訳を出す（どちらも答え合わせの局面）
  const { isRevealed, isHolding } = useTrainingMode();
  const showBreakdown = isRevealed || isHolding;

  const advanceQuestion = useCallback(() => {
    nextQuestion();
    setQuestionIndex((prev) => prev + 1);
  }, [nextQuestion]);

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);
  usePresentQuestion(question, toUnansweredResult, onPresentQuestion);

  const handleSubmit = useCallback(
    (userHan: number) => {
      if (showFeedback || !question) return;
      // 選択肢は 1〜13 のため、14翻以上（役満+ドラ・ダブル役満等）の正解は
      // 役満（13翻）に丸めて判定・記録する（toHanCountQuestionResult が丸める）
      const result = toHanCountQuestionResult(question, userHan);
      onRecordResult?.(result);
      onAnswer(userHan === result.correctHan, advanceQuestion);
    },
    [showFeedback, question, onRecordResult, onAnswer, advanceQuestion],
  );

  if (!question) {
    return <QuestionPlaceholder label={t("generating")} />;
  }

  // 選択肢が 1〜13 のため、正解の提示（ハイライト・内訳の注記）も丸めた翻数で行う
  const correctHan = clampHanToYakuman(question.answer.han);

  return (
    <View style={styles.board}>
      <TehaiDisplay tehai={question.tehai} context={tehaiContextOf(question)} />

      <HanCountAnswerForm
        correctHan={correctHan}
        questionIndex={questionIndex}
        showFeedback={showFeedback}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />

      {/* 面子分解は正解開示の一部。回答中に見せると答えが割れるため止まって
          いる間だけ出す。置き場所が末尾なのは、開示の瞬間に回答欄を動かさないため */}
      {showBreakdown && (
        <TehaiMentsuBreakdown tehai={question.tehai} context={question} />
      )}

      {showBreakdown && (
        <HanBreakdown
          yakuDetails={question.yakuDetails ?? []}
          correctHan={correctHan}
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
