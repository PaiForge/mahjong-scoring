"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { generateTehaiFuQuestion, retryGenerate } from "@mahjong-scoring/core";
import type { TehaiFuQuestion } from "@mahjong-scoring/core";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { Button } from "@/app/(user)/_components/button";
import { ChallengeSubmitButton } from "../../_components/challenge-submit-button";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { useClientGeneratedQuestion } from "../../_hooks/use-client-generated-question";
import { useTrainingReveal } from "../../_hooks/use-training-reveal";
import { TehaiDisplay } from "../../_components/tehai-display";
import { FuItemRow } from "./fu-item-row";
import type { PracticeBoardProps } from "../../_lib/practice-board-props";

function generateQuestion(
  renfonpaiAs4Fu: boolean,
): TehaiFuQuestion | undefined {
  return retryGenerate(() => generateTehaiFuQuestion({ renfonpaiAs4Fu }));
}

interface TehaiFuBoardProps extends PracticeBoardProps {
  /** 直前の回答が正解だったか（未回答時は undefined） */
  readonly lastAnswerCorrect?: boolean;
  /**
   * 不正解で停止中の状態から次問題へ進む操作
   *
   * 指定した場合のみ、不正解時に各行の正解を出したまま停止して
   * 「次の問題へ」ボタンを出す（自動で進まないトレーニングモード向け）。
   * チャレンジでは指定しない。
   */
  readonly onProceed?: () => void;
}

/**
 * 手牌符の出題盤面（手牌の提示と符目ごとの入力・一括判定）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function TehaiFuBoard({
  showFeedback,
  isCountingDown = false,
  lastAnswerCorrect,
  onAnswer,
  onProceed,
}: TehaiFuBoardProps) {
  const t = useTranslations("tehaiFu");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const generate = useCallback(
    () => generateQuestion(renfonpaiAs4Fu),
    [renfonpaiAs4Fu],
  );
  const [question, setQuestion] = useClientGeneratedQuestion(generate);
  const [answers, setAnswers] = useState<string[]>(() => new Array(5).fill(""));
  const [tileScale, setTileScale] = useState(1);

  const advanceQuestion = useCallback(() => {
    const q = generate();
    setQuestion(q);
    setAnswers(q ? new Array(q.items.length).fill("") : []);
  }, [generate, setQuestion]);

  const isRevealed = useTrainingReveal(
    question === undefined ? undefined : advanceQuestion,
  );

  const handleSubmit = useCallback(() => {
    if (!question || showFeedback) return;
    const allCorrect = question.items.every(
      (item, idx) => parseInt(answers[idx]) === item.fu,
    );
    onAnswer(allCorrect, advanceQuestion);
  }, [question, answers, showFeedback, onAnswer, advanceQuestion]);

  const handleSelect = useCallback(
    (idx: number, value: string) => {
      if (showFeedback) return;
      setAnswers((prev) => {
        const next = [...prev];
        next[idx] = value;
        return next;
      });
    },
    [showFeedback],
  );

  if (!question) {
    return <QuestionGeneratingPlaceholder label={t("generating")} />;
  }

  const allAnswered = answers.length > 0 && answers.every((a) => a !== "");
  // 不正解で停止中（トレーニングのみ）。行ごとの正解表示を残したまま操作を待つ
  const isHolding =
    onProceed !== undefined && showFeedback && lastAnswerCorrect === false;

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={question.tehai}
        context={question.context}
        onScaleChange={setTileScale}
      />

      {/* Item list */}
      <div className="space-y-2">
        {question.items.map((item, idx) => (
          <FuItemRow
            key={item.id}
            index={idx}
            item={item}
            answer={answers[idx]}
            showFeedback={showFeedback}
            isRevealed={isRevealed}
            isCountingDown={isCountingDown}
            onSelect={handleSelect}
            tileScale={tileScale}
          />
        ))}
      </div>

      {/* Submit button（不正解での停止中は「次の問題へ」に差し替える） */}
      {isHolding ? (
        <div className="mt-4">
          <Button size="lg" fullWidth onClick={onProceed}>
            {t("nextQuestion")}
          </Button>
        </div>
      ) : (
        <ChallengeSubmitButton
          disabled={!allAnswered || showFeedback || isCountingDown}
          onClick={handleSubmit}
        >
          {t("checkButton")}
        </ChallengeSubmitButton>
      )}
    </div>
  );
}
