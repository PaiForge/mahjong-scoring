"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { generateTehaiFuQuestion, retryGenerate } from "@mahjong-scoring/core";
import type { TehaiFuQuestion } from "@mahjong-scoring/core";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { ChallengeSubmitButton } from "../../_components/challenge-submit-button";
import { TehaiDisplay } from "./tehai-display";
import { FuItemRow } from "./fu-item-row";

function generateQuestion(
  renfonpaiAs4Fu: boolean,
): TehaiFuQuestion | undefined {
  return retryGenerate(() => generateTehaiFuQuestion({ renfonpaiAs4Fu }));
}

interface TehaiFuBoardProps {
  readonly showFeedback: boolean;
  readonly isCountingDown?: boolean;
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
}

/**
 * 手牌符の出題盤面（手牌の提示と符目ごとの入力・一括判定）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function TehaiFuBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
}: TehaiFuBoardProps) {
  const t = useTranslations("tehaiFu");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const [question, setQuestion] = useState<TehaiFuQuestion | undefined>(() =>
    generateQuestion(renfonpaiAs4Fu),
  );
  const [answers, setAnswers] = useState<string[]>(() => new Array(5).fill(""));
  const [tileScale, setTileScale] = useState(1);

  const advanceQuestion = useCallback(() => {
    const q = generateQuestion(renfonpaiAs4Fu);
    setQuestion(q);
    setAnswers(q ? new Array(q.items.length).fill("") : []);
  }, [renfonpaiAs4Fu]);

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

  if (!question) return undefined;

  const allAnswered = answers.length > 0 && answers.every((a) => a !== "");

  return (
    <div className="space-y-4">
      <TehaiDisplay question={question} onScaleChange={setTileScale} />

      {/* Item list */}
      <div className="space-y-2">
        {question.items.map((item, idx) => (
          <FuItemRow
            key={item.id}
            index={idx}
            item={item}
            answer={answers[idx]}
            showFeedback={showFeedback}
            isCountingDown={isCountingDown}
            onSelect={handleSelect}
            tileScale={tileScale}
          />
        ))}
      </div>

      {/* Submit button */}
      <ChallengeSubmitButton
        disabled={!allAnswered || showFeedback || isCountingDown}
        onClick={handleSubmit}
      >
        {t("checkButton")}
      </ChallengeSubmitButton>
    </div>
  );
}
