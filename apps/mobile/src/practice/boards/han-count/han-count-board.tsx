import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { tehaiContextOf } from "@mahjong-scoring/features/board/score-question-context";
import { type HanCountQuestionResult } from "@mahjong-scoring/features/practice/han-count/types";

import { TehaiDisplay } from "../../../board/tehai-display";
import { TehaiMentsuBreakdown } from "../../../board/tehai-mentsu-breakdown";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { QuestionPlaceholder } from "../../components/question-placeholder";
import { HanBreakdown } from "./han-breakdown";
import { HanCountAnswerForm } from "./han-count-answer-form";
import { useHanCountAnswer } from "@mahjong-scoring/features/practice/han-count/use-han-count-answer";
import { useGeneratedScoreQuestion } from "@mahjong-scoring/features/practice/use-generated-score-question";

/**
 * 翻数即答の出題盤面（手牌の提示と翻数入力）
 *
 * web の `HanCountBoard` の移植。出題状態を持ち（回答ロジックは `useHanCountAnswer`）、チャレンジ・
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
  const { question, questionIndex, advanceQuestion } =
    useGeneratedScoreQuestion();
  const { handleSubmit, correctHan, showBreakdown } = useHanCountAnswer({
    question,
    advanceQuestion,
    showFeedback,
    onAnswer,
    onRecordResult,
    onPresentQuestion,
  });

  if (!question) {
    return <QuestionPlaceholder label={t("generating")} />;
  }

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
