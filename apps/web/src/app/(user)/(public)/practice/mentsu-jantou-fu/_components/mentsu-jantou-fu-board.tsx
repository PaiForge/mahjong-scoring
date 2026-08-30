"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  generateMentsuJantouFuQuestion,
  retryGenerate,
} from "@mahjong-scoring/core";
import type { MentsuJantouFuQuestion } from "@mahjong-scoring/core";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { ChallengeSubmitButton } from "../../_components/challenge-submit-button";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { useClientGeneratedQuestion } from "../../_hooks/use-client-generated-question";
import {
  useRegisterAdvance,
  useTrainingMode,
} from "../../_hooks/use-training-mode";
import { TehaiDisplay } from "../../_components/tehai-display";
import { findAgariHighlight } from "../_lib/find-agari-highlight";
import { toQuestionResult } from "../_lib/types";
import type { MentsuJantouFuQuestionResult } from "../_lib/types";
import { FuItemRow } from "./fu-item-row";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

function generateQuestion(
  renfonpaiAs4Fu: boolean,
): MentsuJantouFuQuestion | undefined {
  return retryGenerate(() =>
    generateMentsuJantouFuQuestion({ renfonpaiAs4Fu }),
  );
}

type MentsuJantouFuBoardProps =
  RecordingPracticeBoardProps<MentsuJantouFuQuestionResult>;

/**
 * 面子と雀頭の符の出題盤面（手牌の提示と要素ごとの入力・一括判定）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function MentsuJantouFuBoard({
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  onAnswer,
  onRecordResult,
}: MentsuJantouFuBoardProps) {
  const t = useTranslations("mentsuJantouFu");
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

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);
  const { isRevealed } = useTrainingMode();

  const handleSubmit = useCallback(() => {
    if (!question || showFeedback) return;
    const userFuList = question.items.map((_, idx) => parseInt(answers[idx]));
    const allCorrect = question.items.every(
      (item, idx) => userFuList[idx] === item.fu,
    );
    onRecordResult?.(toQuestionResult(question, userFuList));
    onAnswer(allCorrect, advanceQuestion);
  }, [
    question,
    answers,
    showFeedback,
    onAnswer,
    advanceQuestion,
    onRecordResult,
  ]);

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

  const agariHighlight = findAgariHighlight(
    question.items,
    question.context.agariHai,
  );
  const allAnswered = answers.length > 0 && answers.every((a) => a !== "");

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={question.tehai}
        context={question.context}
        onScaleChange={setTileScale}
        mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
      />

      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>

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
            highlightedTileIndex={
              agariHighlight?.itemId === item.id
                ? agariHighlight.tileIndex
                : undefined
            }
            onSelect={handleSelect}
            tileScale={tileScale}
          />
        ))}
      </div>

      {/* Submit button（トレーニングの回答後はシェルの「次の問題へ」に入れ替わる）。
          チャレンジは押した瞬間に次問題へ進むため「答え合わせ」ではなく「回答する」 */}
      <ChallengeSubmitButton
        disabled={!allAnswered || showFeedback || isCountingDown}
        onClick={handleSubmit}
      >
        {isTraining ? t("checkButton") : t("answerButton")}
      </ChallengeSubmitButton>
    </div>
  );
}
