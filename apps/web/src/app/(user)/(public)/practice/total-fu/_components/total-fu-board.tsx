"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  FU_VALUES,
  generateTotalFuQuestion,
  retryGenerate,
} from "@mahjong-scoring/core";
import type { TotalFuQuestion } from "@mahjong-scoring/core";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { toQuestionResult } from "../_lib/types";
import type { TotalFuQuestionResult } from "../_lib/types";
import { FuChoiceGrid } from "../../_components/fu-choice-grid";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { useClientGeneratedQuestion } from "../../_hooks/use-client-generated-question";
import { useTrainingReveal } from "../../_hooks/use-training-reveal";
import { TehaiDisplay } from "../../_components/tehai-display";
import { FuBreakdown } from "./fu-breakdown";
import { QuestionPrompt } from "../../_components/question-prompt";
import { Button } from "@/app/(user)/_components/button";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

function generateQuestion(
  renfonpaiAs4Fu: boolean,
): TotalFuQuestion | undefined {
  return retryGenerate(() => generateTotalFuQuestion({ renfonpaiAs4Fu }));
}

interface TotalFuBoardProps extends RecordingPracticeBoardProps<TotalFuQuestionResult> {
  /** 直前の回答が正解だったか（未回答時は undefined） */
  readonly lastAnswerCorrect?: boolean;
  /**
   * 不正解で停止中の状態から次問題へ進む操作
   *
   * 指定した場合のみ、不正解時に符の内訳と「次の問題へ」ボタンを出して停止する
   * （自動で進まないトレーニングモード向け）。チャレンジでは指定しない。
   */
  readonly onProceed?: () => void;
}

/**
 * 合計符の出題盤面（手牌の提示と符の選択）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 *
 * 符の内訳はトレーニングでだけ、不正解の問題と「わからない」で開示した問題に
 * 対して表示する。チャレンジは制限時間内に解き続ける形式で、内訳を出しても
 * 読む間もなく次の問題へ変わってしまうため出さない。振り返りは結果ページの
 * 問題別フィードバック一覧で行う。
 */
export function TotalFuBoard({
  showFeedback,
  isCountingDown = false,
  lastAnswerCorrect,
  onAnswer,
  onProceed,
  onRecordResult,
}: TotalFuBoardProps) {
  const t = useTranslations("totalFu");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const generate = useCallback(
    () => generateQuestion(renfonpaiAs4Fu),
    [renfonpaiAs4Fu],
  );
  const [question, setQuestion] = useClientGeneratedQuestion(generate);
  const [selectedFu, setSelectedFu] = useState<number | undefined>(undefined);

  const advanceQuestion = useCallback(() => {
    setQuestion(generate());
    setSelectedFu(undefined);
  }, [generate, setQuestion]);

  const isRevealed = useTrainingReveal(
    question === undefined ? undefined : advanceQuestion,
  );

  const handleSelect = useCallback(
    (index: number) => {
      if (showFeedback || !question) return;
      const fu = FU_VALUES[index];
      setSelectedFu(fu);
      onRecordResult?.(toQuestionResult(question, fu));
      onAnswer(fu === question.answer, advanceQuestion);
    },
    [showFeedback, question, onAnswer, advanceQuestion, onRecordResult],
  );

  if (!question) {
    return <QuestionGeneratingPlaceholder label={t("generating")} />;
  }

  return (
    <div className="space-y-4">
      <TehaiDisplay tehai={question.tehai} context={question.context} />

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

      {showFeedback && (lastAnswerCorrect === false || isRevealed) && (
        <>
          <FuBreakdown details={question.fuDetails} answer={question.answer} />
          {/* 開示中の「次の問題へ」はシェルのフッターにあるため、ここには出さない */}
          {onProceed !== undefined && lastAnswerCorrect === false && (
            <Button size="lg" fullWidth onClick={onProceed}>
              {t("nextQuestion")}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
