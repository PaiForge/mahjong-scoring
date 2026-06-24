"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { generateValidScoreQuestion } from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import { TehaiDisplay } from "../../_components/tehai-display";
import { HanCountAnswerForm } from "./han-count-answer-form";
import type { HanCountQuestionResult } from "../_lib/types";

interface HanCountBoardProps {
  readonly showFeedback: boolean;
  readonly isCountingDown?: boolean;
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
  /** 回答結果の記録（チャレンジの結果ページ用。トレーニングでは省略） */
  readonly onRecordResult?: (result: HanCountQuestionResult) => void;
}

/**
 * 翻数即答の出題盤面（手牌の提示と翻数入力）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function HanCountBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
}: HanCountBoardProps) {
  const t = useTranslations("hanCountChallenge");
  const [question, setQuestion] = useState<ScoreQuestion | undefined>(() =>
    generateValidScoreQuestion() ?? undefined,
  );
  const [questionIndex, setQuestionIndex] = useState(0);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateValidScoreQuestion() ?? undefined);
    setQuestionIndex((prev) => prev + 1);
  }, []);

  const handleSubmit = useCallback(
    (userHan: number) => {
      if (showFeedback || !question) return;

      const correctHan = question.answer.han;
      const isCorrect = userHan === correctHan;

      onRecordResult?.({ correctHan, userHan, isCorrect });
      onAnswer(isCorrect, advanceQuestion);
    },
    [showFeedback, question, onAnswer, advanceQuestion, onRecordResult],
  );

  if (!question) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-surface-500">{t("generating")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={question.tehai}
        context={{
          bakaze: question.bakaze,
          jikaze: question.jikaze,
          agariHai: question.agariHai,
          isTsumo: question.isTsumo,
          isRiichi: question.isRiichi,
          doraMarkers: question.doraMarkers,
        }}
        translationNamespace="hanCountChallenge"
      />

      {/* Answer form */}
      <HanCountAnswerForm
        correctHan={question.answer.han}
        questionIndex={questionIndex}
        showFeedback={showFeedback}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />
    </div>
  );
}
