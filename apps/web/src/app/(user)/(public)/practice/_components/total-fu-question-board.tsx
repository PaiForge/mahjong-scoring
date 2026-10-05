"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { FU_VALUES } from "@mahjong-scoring/core";
import type { TotalFuQuestion } from "@mahjong-scoring/core";
import { FuChoiceGrid } from "./fu-choice-grid";
import { QuestionGeneratingPlaceholder } from "./question-generating-placeholder";
import { TehaiDisplay } from "./tehai-display";
import { TehaiMentsuBreakdown } from "./tehai-mentsu-breakdown";
import { FuBreakdown } from "./fu-breakdown";
import { QuestionPrompt } from "./question-prompt";
import { useFuChoiceBoard } from "../_hooks/use-fu-choice-board";
import { useTrainingMode } from "../_hooks/use-training-mode";
import type { PlayBoardHeight } from "../_lib/board-area-height";
import {
  toFuQuestionResult,
  type FuQuestionResult,
} from "@mahjong-scoring/features/results/fu-question-result";
import type { RecordingPracticeBoardProps } from "../_lib/practice-board-props";

interface TotalFuQuestionBoardProps extends RecordingPracticeBoardProps<FuQuestionResult> {
  /**
   * 1 問を生成する（生成に失敗したら undefined）。参照が変わると出題し直すため、
   * 呼び出し側で `useCallback` 等により安定させること
   */
  readonly generateQuestion: () => TotalFuQuestion | undefined;
  /** 生成中表示・問題文・選択肢・内訳の文言を引く辞書の namespace */
  readonly translationNamespace: string;
  /** 生成中プレースホルダの高さ（`loading.tsx` のフォールバックと同値にする） */
  readonly boardHeight: PlayBoardHeight;
}

/**
 * 手牌の合計符を答える出題盤面（手牌の提示と符の選択）
 * 合計符盤面
 *
 * 合計符の練習と昇級試験（符）で共有する。違いは出題条件（`generateQuestion`）と
 * 文言・高さだけで、画面の構図は同じ。
 *
 * 符の内訳はトレーニング（練習のトレーニング・試験の模試）で止まっている間
 * だけ、回答した問題と「わからない」で開示した問題に対して表示する。
 * チャレンジ・本番の試験では出さない — 制限時間内に解き続ける形式で読む間も
 * なく次の問題へ変わるうえ、試験では内訳が答え合わせそのものになる。
 * 振り返りは結果ページの問題別フィードバック一覧で行う。
 *
 * @remarks
 * ルール設定ストアを読まないこと。試験の盤面もこの部品で描くため、端末ローカルの
 * 設定は呼び出し側が `generateQuestion` に畳み込んで渡す（練習だけが読む）。
 */
export function TotalFuQuestionBoard({
  generateQuestion,
  translationNamespace,
  boardHeight,
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: TotalFuQuestionBoardProps) {
  const t = useTranslations(translationNamespace);
  const recordResult = useCallback(
    (question: TotalFuQuestion, fu: number) =>
      onRecordResult?.(toFuQuestionResult(question, fu)),
    [onRecordResult],
  );
  const presentQuestion = useCallback(
    (question: TotalFuQuestion) =>
      onPresentQuestion?.(toFuQuestionResult(question, undefined)),
    [onPresentQuestion],
  );
  const { question, selectedFu, handleSelect } = useFuChoiceBoard({
    generateQuestion,
    options: FU_VALUES,
    showFeedback,
    onAnswer,
    onRecordResult: recordResult,
    onPresentQuestion: presentQuestion,
  });
  // 内訳はトレーニングで止まっている間だけ出す（開示・回答後のどちらでも）。
  // チャレンジ・本番の試験ではどちらも立たない
  const { isRevealed, isHolding } = useTrainingMode();

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight={boardHeight}
      />
    );
  }

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={question.tehai}
        context={question.context}
        mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
      />

      <QuestionPrompt>{t("prompt")}</QuestionPrompt>

      <FuChoiceGrid
        options={FU_VALUES}
        answer={question.answer}
        selectedFu={selectedFu}
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        onSelect={handleSelect}
        columnsClassName="grid-cols-3"
        translationNamespace={translationNamespace}
      />

      {/* 面子分解は正解開示の一部。回答中に見せると符や待ちの答えが割れるため
          止まっている間だけ出す（結果ページの問題詳細と同じ材料）。置き場所が
          手牌の直下ではなく末尾なのは、開示の瞬間に回答欄を動かさないため */}
      {(isRevealed || isHolding) && (
        <TehaiMentsuBreakdown
          tehai={question.tehai}
          context={question.context}
        />
      )}

      {(isRevealed || isHolding) && (
        <FuBreakdown
          details={question.fuDetails}
          answer={question.answer}
          translationNamespace={translationNamespace}
        />
      )}
    </div>
  );
}
