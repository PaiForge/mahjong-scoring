"use client";

import { useMemo } from "react";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { useTranslations } from "next-intl";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { RevealedScoreAnswer } from "../../_components/revealed-score-answer";
import { paymentToScoreTableAnswer } from "../../_lib/payment-adapter";
import { useScoreQuestionBoard } from "../../_hooks/use-score-question-board";
import { useTrainingMode } from "../../_hooks/use-training-mode";
import { QuestionDisplay } from "../../score/_components/question-display";
import { ScoreCalculationAnswerForm } from "./score-calculation-answer-form";
import type { ScoreCalculationQuestionResult } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

type ScoreCalculationBoardProps =
  RecordingPracticeBoardProps<ScoreCalculationQuestionResult>;

/**
 * 点数計算の出題盤面（手牌の提示と点数の回答）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 *
 * 盤面は他の練習（`HanCountBoard` 等）と同じく、フィードバック枠で囲まずに
 * 単体で置く。囲むと盤面自身の枠と二重になり、狭い画面ではそのぶん手牌が
 * 小さくなる。回答直後の正誤は、回答した select 自身の枠と地の色が返す
 * （選択肢を持つ練習が選択肢ボタンを染めるのと同じ配色・同じタイミング）。
 */
export function ScoreCalculationBoard({
  showFeedback,
  lastAnswerCorrect,
  isCountingDown = false,
  isTraining = false,
  onAnswer,
  onRecordResult,
}: ScoreCalculationBoardProps) {
  const t = useTranslations("scoreCalculationChallenge");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  const generateOptions = useMemo(
    () => ({ renfonpaiAs4Fu, kiriageMangan }),
    [renfonpaiAs4Fu, kiriageMangan],
  );

  const { question, questionIndex, handleSubmit } = useScoreQuestionBoard({
    generateOptions,
    showFeedback,
    onAnswer,
    onRecordResult,
  });
  // トレーニングでは開示時だけでなく回答後の停止中も正解を出す（答え合わせ用）
  const { isRevealed, isHolding } = useTrainingMode();
  const showAnswer = isRevealed || isHolding;

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="scoreCalculation"
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

      {showAnswer && (
        <RevealedScoreAnswer
          answer={paymentToScoreTableAnswer(question.answer.payment)}
          translationNamespace="scoreCalculationChallenge"
        />
      )}

      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>

      {/* Answer form */}
      <ScoreCalculationAnswerForm
        question={question}
        questionIndex={questionIndex}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
        showFeedback={showFeedback}
        lastAnswerCorrect={lastAnswerCorrect}
      />
    </div>
  );
}
