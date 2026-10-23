import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import type { ScoreOptionRange } from "@mahjong-scoring/features/practice/score/get-available-scores";
import type { ScoreQuestionResult } from "@mahjong-scoring/features/results/score-question-result";

import { TehaiMentsuBreakdown } from "../../board/tehai-mentsu-breakdown";
import { hasMentsuBreakdown } from "@mahjong-scoring/features/board/mentsu-breakdown";
import {
  buildScoreAnswerBreakdown,
  hasScoreAnswerBreakdown,
} from "@mahjong-scoring/features/results/score-answer-breakdown";
import { scoreTableFocusOfQuestion } from "@mahjong-scoring/features/score-table/focus";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import {
  useScoreQuestionBoard,
  type ScoreQuestionGenerateOptions,
} from "@mahjong-scoring/features/practice/use-score-question-board";
import { useTrainingAnswerVisibility } from "@mahjong-scoring/features/practice/use-training-mode";
import { AnswerReviewPanel } from "./answer-review-panel";
import { QuestionDisplay } from "./question-display";
import { QuestionPlaceholder } from "./question-placeholder";
import { QuestionPrompt } from "./question-prompt";
import { RevealedScoreQuestionAnswer } from "./revealed-score-answer";
import { ScoreBreakdownPanel } from "./score-breakdown-panel";
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
  /**
   * 役一覧を与件として出す練習か（`renderQuestionSupplement` で役一覧を添える
   * 満貫以上の点数計算）。トレーニングの答え合わせから翻数の内訳を落とし、
   * 符の内訳だけを出す（与件の役一覧と同じ表を 2 度出さない）
   */
  readonly yakuGiven?: boolean;
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
  yakuGiven = false,
  showFeedback,
  lastAnswerCorrect,
  isCountingDown = false,
  isTraining = false,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: ScoreCalculationQuestionBoardProps) {
  const t = useTranslations(translationNamespace);
  const tBreakdown = useTranslations("challenge.yakuBreakdown");

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

  const breakdown = buildScoreAnswerBreakdown(question, tBreakdown, {
    yakuGiven,
  });

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

      {/* 面子分解と内訳は正解開示の一部。回答中に見せると符や待ちの答えが
          割れるため止まっている間だけ、1 枚の面（AnswerReviewPanel）に入れて
          出す（web と同じ。模試の答え合わせと同じ材料）。末尾に置くのは開示の
          瞬間に回答欄を動かさないため。面の直下にシェルの「次の問題へ」が
          続くので、枠で境目を付ける。符と翻数の内訳は 1 つの入口から切り替え、
          符は 4 翻以下だけ（5 翻以上は符が点数に効かない）。役一覧が与件の
          練習では翻数を出さない。問題ごとに作り直して閉じた状態へ戻す。
          面子分解を持たない手（七対子・国士無双）で内訳も無ければ面ごと
          出さない（空の枠を置かない） */}
      {showBreakdown &&
        (hasMentsuBreakdown(question.tehai, question) ||
          hasScoreAnswerBreakdown(breakdown)) && (
          <AnswerReviewPanel>
            <TehaiMentsuBreakdown tehai={question.tehai} context={question} />
            <ScoreBreakdownPanel
              key={questionIndex}
              {...breakdown}
              scoreTableFocus={scoreTableFocusOfQuestion(question)}
              surface="sunken"
            />
          </AnswerReviewPanel>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: 24,
  },
});
