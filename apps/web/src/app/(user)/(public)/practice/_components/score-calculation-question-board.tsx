"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import { QuestionGeneratingPlaceholder } from "./question-generating-placeholder";
import { QuestionPrompt } from "./question-prompt";
import { RevealedScoreQuestionAnswer } from "./revealed-score-answer";
import { TehaiMentsuBreakdown } from "./tehai-mentsu-breakdown";
import { ScoreChallengeAnswerForm } from "./score-challenge-answer-form";
import {
  useScoreQuestionBoard,
  type UseScoreQuestionBoardParams,
} from "../_hooks/use-score-question-board";
import { useTrainingAnswerVisibility } from "../_hooks/use-training-mode";
import { QuestionDisplay } from "../score/_components/question-display";
import type { ScoreOptionRange } from "@mahjong-scoring/features/practice/score/get-available-scores";
import type { PlayBoardHeight } from "../_lib/board-area-height";
import type { ScoreQuestionResult } from "@mahjong-scoring/features/results/score-question-result";
import type { RecordingPracticeBoardProps } from "../_lib/practice-board-props";

interface ScoreCalculationQuestionBoardProps extends RecordingPracticeBoardProps<ScoreQuestionResult> {
  /** 出題オプション（再生成のたびに使用するため安定参照を渡すこと） */
  readonly generateOptions: UseScoreQuestionBoardParams["generateOptions"];
  /** 生成中表示・問題文・回答欄の文言を引く辞書の namespace */
  readonly translationNamespace: string;
  /** 生成中プレースホルダの高さ（`loading.tsx` のフォールバックと同値にする） */
  readonly boardHeight: PlayBoardHeight;
  /** 回答欄に並べる点数の範囲（省略時は全範囲） */
  readonly scoreRange?: ScoreOptionRange;
  /** 手牌の直下（問題文の上）に出題の一部として添える材料（役一覧等） */
  readonly renderQuestionSupplement?: (question: ScoreQuestion) => ReactNode;
}

/**
 * 手牌を見て点数を答える出題盤面（手牌の提示と点数の回答）
 * 点数計算盤面
 *
 * 点数計算・満貫以上点数計算の練習で共有する。違いは出題条件
 * （`generateOptions`）・回答欄の点数の範囲・手牌に添える材料だけで、
 * 画面の構図と答え合わせの出し方は同じ。
 *
 * 盤面は他の練習（`HanCountBoard` 等）と同じく、フィードバック枠で囲まずに
 * 単体で置く。囲むと盤面自身の枠と二重になり、狭い画面ではそのぶん手牌が
 * 小さくなる。回答直後の正誤は、回答した select 自身の枠と地の色が返す
 * （選択肢を持つ練習が選択肢ボタンを染めるのと同じ配色・同じタイミング）。
 */
export function ScoreCalculationQuestionBoard({
  generateOptions,
  translationNamespace,
  boardHeight,
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
  // 正解のときは出さない — 選んだ値がそのまま正解で、select の色が正誤を示している
  const { showAnswer, showBreakdown } =
    useTrainingAnswerVisibility(lastAnswerCorrect);

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight={boardHeight}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Question display */}
      <QuestionDisplay
        question={question}
        mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
      />

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

      {/* Answer form */}
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
          止まっている間だけ出す（結果ページの問題詳細と同じ材料）。置き場所が
          手牌の直下ではなく末尾なのは、開示の瞬間に回答欄を動かさないため */}
      {showBreakdown && (
        <TehaiMentsuBreakdown tehai={question.tehai} context={question} />
      )}
    </div>
  );
}
