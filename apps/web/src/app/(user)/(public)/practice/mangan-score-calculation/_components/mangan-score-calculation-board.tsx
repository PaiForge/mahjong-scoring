"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { getFeedbackBorderClass } from "../../_lib/feedback-styles";
import { useScoreQuestionBoard } from "../../_hooks/use-score-question-board";
import { QuestionDisplay } from "../../score/_components/question-display";
import { YakuListDisplay } from "./yaku-list-display";
import { ManganScoreCalculationAnswerForm } from "./mangan-score-calculation-answer-form";
import type {
  ManganScoreCalculationQuestionResult,
  PlayerType,
} from "../_lib/types";
import { playerTypeToOptions } from "../_lib/types";

interface ManganScoreCalculationBoardProps {
  /** 出題する親/子の種別（チャレンジは URL クエリで指定、トレーニングは既定値） */
  readonly playerType: PlayerType;
  readonly showFeedback: boolean;
  readonly isCountingDown?: boolean;
  /** 直前の回答が正解だったか（フィードバック枠の色分けに使用） */
  readonly lastAnswerCorrect?: boolean;
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
  /** 回答結果の記録（チャレンジの結果ページ用。トレーニングでは省略） */
  readonly onRecordResult?: (
    result: ManganScoreCalculationQuestionResult,
  ) => void;
}

/**
 * 満貫以上点数計算の出題盤面（手牌・役一覧の提示と点数の回答）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function ManganScoreCalculationBoard({
  playerType,
  showFeedback,
  isCountingDown = false,
  lastAnswerCorrect,
  onAnswer,
  onRecordResult,
}: ManganScoreCalculationBoardProps) {
  const t = useTranslations("manganScoreCalculationChallenge");

  const generateOptions = useMemo(
    () => ({
      allowedRanges: ["mangan_plus" as const],
      ...playerTypeToOptions(playerType),
    }),
    [playerType],
  );

  const { question, questionIndex, handleSubmit } = useScoreQuestionBoard({
    generateOptions,
    showFeedback,
    onAnswer,
    onRecordResult,
  });

  if (!question) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-surface-500">{t("generating")}</div>
      </div>
    );
  }

  const feedbackBorderClass = getFeedbackBorderClass(
    showFeedback,
    lastAnswerCorrect,
  );

  return (
    <div className="mt-6 space-y-6">
      {/* Question display */}
      <div
        className={`rounded-xl border-2 p-2 transition-colors sm:p-4 ${feedbackBorderClass}`}
      >
        <QuestionDisplay question={question} />
      </div>

      {/* Yaku list */}
      {question.yakuDetails && question.yakuDetails.length > 0 && (
        <YakuListDisplay yakuDetails={question.yakuDetails} />
      )}

      {/* Answer form */}
      <ManganScoreCalculationAnswerForm
        question={question}
        questionIndex={questionIndex}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />
    </div>
  );
}
