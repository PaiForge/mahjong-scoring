"use client";

import { useCallback } from "react";
import { clampHanToYakuman } from "@mahjong-scoring/core";
import { tehaiContextOf } from "../../_lib/score-question-context";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { useTranslations } from "next-intl";
import type { useGeneratedScoreQuestion } from "../../_hooks/use-generated-score-question";
import { TehaiDisplay } from "../../_components/tehai-display";
import {
  useRegisterAdvance,
  useTrainingMode,
} from "../../_hooks/use-training-mode";
import { HanBreakdown } from "./han-breakdown";
import { HanCountAnswerForm } from "./han-count-answer-form";
import type { HanCountQuestionResult } from "../_lib/types";
import { toHanCountQuestionResult } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

/**
 * 出題状態（{@link useGeneratedScoreQuestion} の戻り値）
 *
 * チャレンジ・トレーニングどちらのビューも同じ形の状態を作って渡す。
 */
export type HanCountQuestionState = ReturnType<
  typeof useGeneratedScoreQuestion
>;

type HanCountBoardProps = RecordingPracticeBoardProps<HanCountQuestionResult> &
  HanCountQuestionState;

/**
 * 翻数即答の出題盤面（手牌の提示と翻数入力）
 *
 * 回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 *
 * トレーニングの答え合わせでは、選択肢の下に翻数の内訳（{@link HanBreakdown}）を
 * 足す。正解の翻数が緑に染まるだけでは、どの役を数え落としたのかが分からず
 * 次も同じ間違いをする。時間制限のあるチャレンジには出さない — 読ませている
 * 間もタイマーが進むうえ、内訳は結果ページの問題別詳細が引き受ける。
 *
 * 置き場所は選択肢グリッドの下で、閉じた状態から始める。手牌も選択肢の色も
 * 動かさないまま下に 1 行増えるだけで済み、開いても伸びるのは下方向だけ
 * （読んでいる最中に読んでいるものが動かない）。開閉の見た目と操作は結果ページの
 * 問題別詳細と同じ ▶ で、内訳を見る操作が画面によって変わらない。
 */
export function HanCountBoard({
  question,
  questionIndex,
  advanceQuestion,
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  onAnswer,
  onRecordResult,
}: HanCountBoardProps) {
  const t = useTranslations("hanCountChallenge");
  // トレーニングでは開示時も回答後の停止中も内訳を出す（どちらも答え合わせの局面）
  const { isRevealed, isHolding } = useTrainingMode();
  const showBreakdown = isRevealed || isHolding;

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);

  // 選択肢が 1〜13 のため、正解の提示（ハイライト・内訳の注記）も丸めた翻数で行う
  const correctHan =
    question === undefined ? 0 : clampHanToYakuman(question.answer.han);

  const handleSubmit = useCallback(
    (userHan: number) => {
      if (showFeedback || !question) return;

      // 選択肢は 1〜13 のため、14翻以上（役満+ドラ・ダブル役満等）の正解は
      // 役満（13翻）に丸めて判定・記録する。丸めないと正解できない問題になる
      const result = toHanCountQuestionResult(question, userHan);

      onRecordResult?.(result);
      onAnswer(result.isCorrect, advanceQuestion);
    },
    [showFeedback, question, onAnswer, advanceQuestion, onRecordResult],
  );

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="hanCount"
      />
    );
  }

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={question.tehai}
        context={tehaiContextOf(question)}
        mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
      />

      <HanCountAnswerForm
        correctHan={correctHan}
        questionIndex={questionIndex}
        showFeedback={showFeedback}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />

      {showBreakdown && (
        <HanBreakdown
          yakuDetails={question.yakuDetails ?? []}
          correctHan={correctHan}
        />
      )}
    </div>
  );
}
