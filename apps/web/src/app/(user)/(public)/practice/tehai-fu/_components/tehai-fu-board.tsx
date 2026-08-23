"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { generateTehaiFuQuestion, retryGenerate } from "@mahjong-scoring/core";
import type { TehaiFuQuestion } from "@mahjong-scoring/core";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { ChallengeSubmitButton } from "../../_components/challenge-submit-button";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { useClientGeneratedQuestion } from "../../_hooks/use-client-generated-question";
import { TehaiDisplay } from "./tehai-display";
import { FuItemRow } from "./fu-item-row";
import type { PracticeBoardProps } from "../../_lib/practice-board-props";

function generateQuestion(
  renfonpaiAs4Fu: boolean,
): TehaiFuQuestion | undefined {
  return retryGenerate(() => generateTehaiFuQuestion({ renfonpaiAs4Fu }));
}

type TehaiFuBoardProps = PracticeBoardProps;

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
