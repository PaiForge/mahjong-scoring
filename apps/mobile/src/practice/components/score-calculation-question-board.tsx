import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import type { ScoreOptionRange } from "@mahjong-scoring/features/practice/score/get-available-scores";
import type { ScoreQuestionResult } from "@mahjong-scoring/features/results/score-question-result";

import { TehaiMentsuBreakdown } from "../../board/tehai-mentsu-breakdown";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import {
  useScoreQuestionBoard,
  type ScoreQuestionGenerateOptions,
} from "../hooks/use-score-question-board";
import { useTrainingAnswerVisibility } from "@mahjong-scoring/features/practice/use-training-mode";
import { QuestionDisplay } from "./question-display";
import { QuestionPlaceholder } from "./question-placeholder";
import { QuestionPrompt } from "./question-prompt";
import { RevealedScoreQuestionAnswer } from "./revealed-score-answer";
import { ScoreChallengeAnswerForm } from "./score-challenge-answer-form";

interface ScoreCalculationQuestionBoardProps extends RecordingPracticeBoardProps<ScoreQuestionResult> {
  /** 出題オプション（再生成のたびに使用するため安定参照を渡すこと） */
  readonly generateOptions: ScoreQuestionGenerateOptions;
  /** 生成中表示・問題文・回答欄の文言を引く辞書の namespace */
  readonly translationNamespace: string;
  /** 回答欄に並べる点数の範囲（省略時は全範囲） */
  readonly scoreRange?: ScoreOptionRange;
  /** 手牌の直下（問題文の上）に出題の一部として添える材料（役一覧等） */
  readonly renderQuestionSupplement?: (question: ScoreQuestion) => ReactNode;
}

/**
 * 手牌を見て点数を答える出題盤面（手牌の提示と点数の回答）
 * 点数計算盤面
 *
 * web の `ScoreCalculationQuestionBoard` の移植。点数即答・満貫以上の点数
 * 計算で共有する。違いは出題条件（`generateOptions`）・回答欄の点数の範囲・
 * 手牌に添える材料だけで、画面の構図と答え合わせの出し方は同じ。
 *
 * 盤面はフィードバック枠で囲まない（盤面自身の枠と二重になる）。回答直後の
 * 正誤は、回答した選択欄自身の枠と地の色が返す。
 */
export function ScoreCalculationQuestionBoard({
  generateOptions,
  translationNamespace,
  scoreRange,
  renderQuestionSupplement,
  showFeedback,
  lastAnswerCorrect,
  isCountingDown = false,
  isTraining = false,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: ScoreCalculationQuestionBoardProps) {
  const t = useTranslations(translationNamespace);

  const { question, questionIndex, handleSubmit } = useScoreQuestionBoard({
    generateOptions,
    showFeedback,
    onAnswer,
    onRecordResult,
    onPresentQuestion,
  });
  // トレーニングでは開示時だけでなく回答後の停止中も正解を出す（答え合わせ用）。
  // 正解のときは出さない — 選んだ値がそのまま正解で、選択欄の色が正誤を示している
  const { showAnswer, showBreakdown } =
    useTrainingAnswerVisibility(lastAnswerCorrect);

  if (!question) {
    return <QuestionPlaceholder label={t("generating")} />;
  }

  return (
    <View style={styles.board}>
      <QuestionDisplay question={question} />

      {renderQuestionSupplement?.(question)}

      <QuestionPrompt
        replacement={
          showAnswer ? (
            <RevealedScoreQuestionAnswer
              question={question}
              translationNamespace={translationNamespace}
            />
          ) : undefined
        }
      >
        {t("questionPrompt")}
      </QuestionPrompt>

      <ScoreChallengeAnswerForm
        question={question}
        questionIndex={questionIndex}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
        showFeedback={showFeedback}
        lastAnswerCorrect={lastAnswerCorrect}
        translationNamespace={translationNamespace}
        scoreRange={scoreRange}
        isTraining={isTraining}
      />

      {/* 面子分解は正解開示の一部。回答中に見せると符や待ちの答えが割れるため
          止まっている間だけ出す。置き場所が手牌の直下ではなく末尾なのは、
          開示の瞬間に回答欄を動かさないため */}
      {showBreakdown && (
        <TehaiMentsuBreakdown tehai={question.tehai} context={question} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: 24,
  },
});
