"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  FU_VALUES,
  generateTotalFuQuestion,
  retryGenerate,
} from "@mahjong-scoring/core";
import type { TotalFuQuestion } from "@mahjong-scoring/core";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { QUESTION_GENERATION_MAX_RETRIES } from "../_lib/types";
import { toFuQuestionResult } from "../_lib/types";
import type { TotalFuQuestionResult } from "../_lib/types";
import { FuChoiceGrid } from "../../_components/fu-choice-grid";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { useFuChoiceBoard } from "../../_hooks/use-fu-choice-board";
import { TehaiDisplay } from "../../_components/tehai-display";
import { FuBreakdown } from "../../_components/fu-breakdown";
import { QuestionPrompt } from "../../_components/question-prompt";
import { useTrainingMode } from "../../_hooks/use-training-mode";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

type TotalFuBoardProps = RecordingPracticeBoardProps<TotalFuQuestionResult>;

/**
 * 合計符の出題盤面（手牌の提示と符の選択）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 *
 * 符の内訳はトレーニングでだけ、回答した問題と「わからない」で開示した問題に
 * 対して表示する。チャレンジは制限時間内に解き続ける形式で、内訳を出しても
 * 読む間もなく次の問題へ変わってしまうため出さない。振り返りは結果ページの
 * 問題別フィードバック一覧で行う。
 */
export function TotalFuBoard({
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  onAnswer,
  onRecordResult,
}: TotalFuBoardProps) {
  const t = useTranslations("totalFu");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const generateQuestion = useCallback(
    () =>
      retryGenerate(
        () => generateTotalFuQuestion({ renfonpaiAs4Fu }),
        QUESTION_GENERATION_MAX_RETRIES,
      ),
    [renfonpaiAs4Fu],
  );
  const recordResult = useCallback(
    (question: TotalFuQuestion, fu: number) =>
      onRecordResult?.(toFuQuestionResult(question, fu)),
    [onRecordResult],
  );
  const { question, selectedFu, handleSelect } = useFuChoiceBoard({
    generateQuestion,
    options: FU_VALUES,
    showFeedback,
    onAnswer,
    onRecordResult: recordResult,
  });
  // 内訳はトレーニングで止まっている間だけ出す（開示・回答後のどちらでも）
  const { isRevealed, isHolding } = useTrainingMode();

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="totalFu"
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
        translationNamespace="totalFu"
      />

      {(isRevealed || isHolding) && (
        <FuBreakdown
          details={question.fuDetails}
          answer={question.answer}
          translationNamespace="totalFu"
        />
      )}
    </div>
  );
}
