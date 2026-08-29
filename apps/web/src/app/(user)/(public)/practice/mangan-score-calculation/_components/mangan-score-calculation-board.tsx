"use client";

import { useMemo } from "react";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { useTranslations } from "next-intl";
import { RevealedScoreAnswer } from "../../_components/revealed-score-answer";
import { paymentToScoreTableAnswer } from "../../_lib/payment-adapter";
import { useScoreQuestionBoard } from "../../_hooks/use-score-question-board";
import { QuestionDisplay } from "../../score/_components/question-display";
import { YakuListDisplay } from "./yaku-list-display";
import { ManganScoreCalculationAnswerForm } from "./mangan-score-calculation-answer-form";
import type {
  ManganScoreCalculationQuestionResult,
  PlayerType,
} from "../_lib/types";
import { playerTypeToOptions } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

interface ManganScoreCalculationBoardProps extends RecordingPracticeBoardProps<ManganScoreCalculationQuestionResult> {
  /** 出題する親/子の種別（チャレンジは URL クエリで指定、トレーニングは既定値） */
  readonly playerType: PlayerType;
}

/**
 * 満貫以上点数計算の出題盤面（手牌・役一覧の提示と点数の回答）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 *
 * 盤面は他の練習（`HanCountBoard` 等）と同じく、フィードバック枠で囲まずに
 * 単体で置く。囲むと盤面自身の枠と二重になり、狭い画面ではそのぶん手牌が
 * 小さくなる。正誤はチャレンジではライフ表示と正解/不正解カウンタが、
 * トレーニングでは `TrainingShell` のカウンタが示す。
 */
export function ManganScoreCalculationBoard({
  playerType,
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  onAnswer,
  onRecordResult,
}: ManganScoreCalculationBoardProps) {
  const t = useTranslations("manganScoreCalculationChallenge");

  const generateOptions = useMemo(
    () => ({
      allowedRanges: ["manganPlus" as const],
      ...playerTypeToOptions(playerType),
    }),
    [playerType],
  );

  const { question, questionIndex, handleSubmit, isRevealed } =
    useScoreQuestionBoard({
      generateOptions,
      showFeedback,
      onAnswer,
      onRecordResult,
    });

  if (!question) {
    return <QuestionGeneratingPlaceholder label={t("generating")} />;
  }

  return (
    <div className="space-y-6">
      {/* Question display */}
      <QuestionDisplay
        question={question}
        mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
      />

      {isRevealed && (
        <RevealedScoreAnswer
          answer={paymentToScoreTableAnswer(question.answer.payment)}
          translationNamespace="manganScoreCalculationChallenge"
        />
      )}

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
