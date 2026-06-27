"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  generateScoreTableQuestion,
  judgeScoreTableAnswer,
} from "@mahjong-scoring/core";
import type {
  ScoreTableGeneratorOptions,
  ScoreTableQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import { getFeedbackBorderClass } from "../../_lib/feedback-styles";
import { ScoreTableAnswerForm } from "./score-table-answer-form";
import type { ScoreTableQuestionResult } from "../_lib/types";

interface ScoreTableBoardProps {
  readonly showFeedback: boolean;
  readonly isCountingDown?: boolean;
  /** 直前の回答が正解だったか（フィードバック枠の色分けに使用） */
  readonly lastAnswerCorrect?: boolean;
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
  /** 回答結果の記録（チャレンジの結果ページ用。トレーニングでは省略） */
  readonly onRecordResult?: (result: ScoreTableQuestionResult) => void;
  /** 出題条件（親子・ツモロン・点数帯の絞り込み）。未指定時は従来の満貫未満ランダム */
  readonly generatorOptions?: ScoreTableGeneratorOptions;
  /**
   * スキップ（無回答で次問題へ）を許可するか。
   * トレーニング専用。タイマー制のチャレンジでは難問回避による不正防止のため無効。
   */
  readonly allowSkip?: boolean;
}

/**
 * 2問の表示内容（親子・ツモロン・翻・符）が同一かを判定する
 * 表示同一判定
 */
function isSameDisplayedQuestion(
  a: ScoreTableQuestion,
  b: ScoreTableQuestion,
): boolean {
  return (
    a.isOya === b.isOya &&
    a.isTsumo === b.isTsumo &&
    a.han === b.han &&
    a.fu === b.fu
  );
}

/**
 * 点数表早引きの出題盤面（条件の提示と点数の回答）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function ScoreTableBoard({
  showFeedback,
  isCountingDown = false,
  lastAnswerCorrect,
  onAnswer,
  onRecordResult,
  generatorOptions,
  allowSkip = false,
}: ScoreTableBoardProps) {
  const t = useTranslations("scoreTableChallenge");
  const [question, setQuestion] = useState<ScoreTableQuestion>(() =>
    generateScoreTableQuestion(generatorOptions),
  );

  const advanceQuestion = useCallback(() => {
    setQuestion((prev) => {
      // 直前と表示が同一の問題が連続すると、スキップや次問題への遷移で
      // 「反応がない」ように見える（特に親子・ツモロン・点数帯を絞った
      // トレーニングでは表示の差が翻数のみになりやすい）。可能な範囲で
      // 直前と異なる問題になるまで引き直す。候補が1種類しかない場合は諦める。
      let next = generateScoreTableQuestion(generatorOptions);
      for (let i = 0; i < 20 && isSameDisplayedQuestion(prev, next); i++) {
        next = generateScoreTableQuestion(generatorOptions);
      }
      return next;
    });
  }, [generatorOptions]);

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

      onAnswer(isCorrect, advanceQuestion);
    },
    [showFeedback, question, onAnswer, advanceQuestion, onRecordResult],
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

      {/* Skip（トレーニングのみ。無回答で次問題へ進む） */}
      {allowSkip && (
        <div className="text-center">
          <button
            type="button"
            onClick={advanceQuestion}
            disabled={showFeedback || isCountingDown}
            className="text-sm text-surface-500 underline transition-colors hover:text-surface-700 disabled:opacity-50"
          >
            {t("skip")}
          </button>
        </div>
      )}
    </div>
  );
}
