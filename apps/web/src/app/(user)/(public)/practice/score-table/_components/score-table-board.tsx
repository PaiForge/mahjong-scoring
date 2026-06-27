"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { judgeScoreTableAnswer } from "@mahjong-scoring/core";
import type {
  ScoreTableQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import { getFeedbackBorderClass } from "../../_lib/feedback-styles";
import { ScoreTableAnswerForm } from "./score-table-answer-form";
import type { ScoreTableQuestionResult } from "../_lib/types";

interface ScoreTableBoardProps {
  /** 現在の問題 */
  readonly question: ScoreTableQuestion;
  /** 次の問題へ進む（回答後の遷移に使用） */
  readonly onAdvance: () => void;
  readonly showFeedback: boolean;
  readonly isCountingDown?: boolean;
  /** 直前の回答が正解だったか（フィードバック枠の色分けに使用） */
  readonly lastAnswerCorrect?: boolean;
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
  /** 回答結果の記録（チャレンジの結果ページ用。トレーニングでは省略） */
  readonly onRecordResult?: (result: ScoreTableQuestionResult) => void;
}

/**
 * 点数表早引きの出題盤面（条件の提示と点数の回答）
 *
 * 出題状態は呼び出し側（{@link useScoreTableQuestion}）が保持し、本コンポーネントは
 * 与えられた問題の提示と回答判定のみを行う。チャレンジ・トレーニング両モードで共有する。
 */
export function ScoreTableBoard({
  question,
  onAdvance,
  showFeedback,
  isCountingDown = false,
  lastAnswerCorrect,
  onAnswer,
  onRecordResult,
}: ScoreTableBoardProps) {
  const t = useTranslations("scoreTableChallenge");

  const handleSubmit = useCallback(
    (userAnswer: ScoreTableUserAnswer) => {
      if (showFeedback) return;
      const isCorrect = judgeScoreTableAnswer(
        userAnswer,
        question.correctAnswer,
      );

      onRecordResult?.({
        isOya: question.isOya,
        isTsumo: question.isTsumo,
        han: question.han,
        fu: question.fu,
        correctAnswer: question.correctAnswer,
        userAnswer,
        isCorrect,
      });

      onAnswer(isCorrect, onAdvance);
    },
    [showFeedback, question, onAnswer, onAdvance, onRecordResult],
  );

  const feedbackBorderClass = getFeedbackBorderClass(
    showFeedback,
    lastAnswerCorrect,
  );

  return (
    <div className="mt-6 space-y-6">
      {/* Question display */}
      <div
        className={`space-y-4 rounded-xl border-2 p-6 transition-colors ${feedbackBorderClass}`}
      >
        <p className="text-center text-sm font-medium text-surface-500">
          {t("questionLabel")}
        </p>

        <div className="flex justify-center gap-6">
          <span className="text-2xl font-bold text-surface-900">
            {question.isOya ? t("oya") : t("ko")}
          </span>
          <span className="text-2xl font-bold text-surface-900">
            {question.isTsumo ? t("tsumo") : t("ron")}
          </span>
        </div>

        <div className="flex justify-center gap-6">
          <span className="text-2xl font-bold text-primary-600">
            {t("han", { count: question.han })}
          </span>
          {/* 満貫以上は符に依存しないため符を表示しない */}
          {question.fu !== undefined && (
            <span className="text-2xl font-bold text-primary-600">
              {t("fu", { count: question.fu })}
            </span>
          )}
        </div>
      </div>

      {/* Answer form */}
      <ScoreTableAnswerForm
        question={question}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />
    </div>
  );
}
