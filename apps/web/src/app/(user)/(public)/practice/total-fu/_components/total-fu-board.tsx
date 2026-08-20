"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  TOTAL_FU_OPTIONS,
  generateTotalFuQuestion,
  retryGenerate,
} from "@mahjong-scoring/core";
import type { TotalFuQuestion } from "@mahjong-scoring/core";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { FuChoiceGrid } from "../../_components/fu-choice-grid";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { TehaiDisplay } from "../../_components/tehai-display";
import { FuBreakdown } from "./fu-breakdown";

function generateQuestion(
  renfonpaiAs4Fu: boolean,
): TotalFuQuestion | undefined {
  return retryGenerate(() => generateTotalFuQuestion({ renfonpaiAs4Fu }));
}

interface TotalFuBoardProps {
  readonly showFeedback: boolean;
  readonly isCountingDown?: boolean;
  /** 直前の回答が正解だったか（未回答時は undefined） */
  readonly lastAnswerCorrect?: boolean;
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
  /**
   * 不正解で停止中の状態から次問題へ進む操作
   *
   * 指定した場合のみ符の内訳の下に「次の問題へ」ボタンを出す
   * （自動で進まないトレーニングモード向け）。
   */
  readonly onProceed?: () => void;
}

/**
 * 合計符の出題盤面（手牌の提示と符の選択）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 * 不正解のときだけ符の内訳を示し、どの構成要素を取りこぼしたかを確認できるようにする。
 */
export function TotalFuBoard({
  showFeedback,
  isCountingDown = false,
  lastAnswerCorrect,
  onAnswer,
  onProceed,
}: TotalFuBoardProps) {
  const t = useTranslations("totalFu");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const [question, setQuestion] = useState<TotalFuQuestion | undefined>(() =>
    generateQuestion(renfonpaiAs4Fu),
  );
  const [selectedFu, setSelectedFu] = useState<number | undefined>(undefined);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion(renfonpaiAs4Fu));
    setSelectedFu(undefined);
  }, [renfonpaiAs4Fu]);

  const handleSelect = useCallback(
    (index: number) => {
      if (showFeedback || !question) return;
      const fu = TOTAL_FU_OPTIONS[index];
      setSelectedFu(fu);
      onAnswer(fu === question.answer, advanceQuestion);
    },
    [showFeedback, question, onAnswer, advanceQuestion],
  );

  if (!question) {
    return <QuestionGeneratingPlaceholder label={t("generating")} />;
  }

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={question.tehai}
        context={question.context}
        translationNamespace="totalFu"
      />

      <p className="text-center text-sm font-medium text-surface-600">
        {t("prompt")}
      </p>

      <FuChoiceGrid
        options={TOTAL_FU_OPTIONS}
        answer={question.answer}
        selectedFu={selectedFu}
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        onSelect={handleSelect}
        columnsClassName="grid-cols-3"
        translationNamespace="totalFu"
      />

      {showFeedback && lastAnswerCorrect === false && (
        <>
          <FuBreakdown details={question.fuDetails} answer={question.answer} />
          {onProceed && (
            <button
              type="button"
              onClick={onProceed}
              className="w-full rounded-lg bg-primary-500 px-6 py-3 font-bold text-white transition-colors hover:bg-primary-600"
            >
              {t("nextQuestion")}
            </button>
          )}
        </>
      )}
    </div>
  );
}
