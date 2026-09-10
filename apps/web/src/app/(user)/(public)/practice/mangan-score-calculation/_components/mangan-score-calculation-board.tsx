"use client";

import { isOya } from "@mahjong-scoring/core";
import { useMemo } from "react";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { useTranslations } from "next-intl";
import { RevealedScoreAnswer } from "../../_components/revealed-score-answer";
import { paymentToScoreTableAnswer } from "../../_lib/payment-adapter";
import { scoreTableFocusOf } from "../../_lib/score-table-focus";
import { useYakumanRules } from "@/app/_hooks/use-rule-settings-store";
import { useScoreQuestionBoard } from "../../_hooks/use-score-question-board";
import { useTrainingMode } from "../../_hooks/use-training-mode";
import { QuestionDisplay } from "../../score/_components/question-display";
import { YakuListDisplay } from "./yaku-list-display";
import { ScoreChallengeAnswerForm } from "../../_components/score-challenge-answer-form";
import type { ManganScoreCalculationQuestionResult } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";
import { ruleBoundaryExclusions } from "../../_lib/rule-boundary";

type ManganScoreCalculationBoardProps =
  RecordingPracticeBoardProps<ManganScoreCalculationQuestionResult>;

/**
 * 満貫以上点数計算の出題盤面（手牌・役一覧の提示と点数の回答）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 *
 * 盤面は他の練習（`HanCountBoard` 等）と同じく、フィードバック枠で囲まずに
 * 単体で置く。囲むと盤面自身の枠と二重になり、狭い画面ではそのぶん手牌が
 * 小さくなる。回答直後の正誤は、回答した select 自身の枠と地の色が返す
 * （選択肢を持つ練習が選択肢ボタンを染めるのと同じ配色・同じタイミング）。
 */
export function ManganScoreCalculationBoard({
  showFeedback,
  lastAnswerCorrect,
  isCountingDown = false,
  isTraining = false,
  onAnswer,
  onRecordResult,
}: ManganScoreCalculationBoardProps) {
  const t = useTranslations("manganScoreCalculationChallenge");

  const yakumanRules = useYakumanRules();
  // チャレンジ（記録あり）では、ルール設定の採否で正解が割れる手を出題から
  // 落とす（理由は `_lib/rule-boundary.ts`）
  const generateOptions = useMemo(
    () => ({
      allowedRanges: ["manganPlus" as const],
      yakumanRules,
      ...ruleBoundaryExclusions(isTraining),
    }),
    [yakumanRules, isTraining],
  );

  const { question, questionIndex, handleSubmit } = useScoreQuestionBoard({
    generateOptions,
    showFeedback,
    onAnswer,
    onRecordResult,
  });
  // トレーニングでは開示時だけでなく回答後の停止中も正解を出す（答え合わせ用）。
  // 正解のときは出さない — 選んだ値がそのまま正解で、select の色が正誤を示している
  const { isRevealed, isHolding } = useTrainingMode();
  const showAnswer = (isRevealed || isHolding) && lastAnswerCorrect !== true;

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="manganScoreCalculation"
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

      {/* Yaku list */}
      {question.yakuDetails && question.yakuDetails.length > 0 && (
        <YakuListDisplay yakuDetails={question.yakuDetails} />
      )}

      <QuestionPrompt
        replacement={
          showAnswer ? (
            <RevealedScoreAnswer
              answer={paymentToScoreTableAnswer(question.answer.payment)}
              translationNamespace="manganScoreCalculationChallenge"
              scoreTableFocus={scoreTableFocusOf({
                isOya: isOya(question.jikaze),
                isTsumo: question.isTsumo,
                han: question.answer.han,
                fu: question.answer.fu,
              })}
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
        translationNamespace="manganScoreCalculationChallenge"
        scoreRange="manganPlus"
        isTraining={isTraining}
      />
    </div>
  );
}
