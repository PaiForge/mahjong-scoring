"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  generateYakuQuestion,
  judgeYakuAnswer,
  retryGenerate,
} from "@mahjong-scoring/core";
import type { YakuQuestion } from "@mahjong-scoring/core";
import { ChallengeSubmitButton } from "../../_components/challenge-submit-button";
import { TehaiDisplay } from "../../_components/tehai-display";
import { YakuAnswerComparison } from "./yaku-answer-comparison";
import { YakuSelectList } from "./yaku-select-list";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { useClientGeneratedQuestion } from "../../_hooks/use-client-generated-question";
import {
  useRegisterAdvance,
  useTrainingMode,
} from "../../_hooks/use-training-mode";
import { toQuestionResult } from "../_lib/types";
import type { YakuQuestionResult } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

function generateQuestion(): YakuQuestion | undefined {
  return retryGenerate(generateYakuQuestion);
}

interface YakuBoardProps extends RecordingPracticeBoardProps<YakuQuestionResult> {
  /** 直前の回答が正解だったか。トレーニングの答え合わせの色に使う */
  readonly lastAnswerCorrect?: boolean;
}

/**
 * 役判定の出題盤面（手牌の提示と役の複数選択・一括判定）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 *
 * 答え合わせはトレーニングでだけ、回答した問題と「わからない」で開示した問題に
 * 対して表示する。チャレンジは制限時間内に解き続ける形式で、成立していた役を
 * 出しても読む間もなく次の問題へ変わってしまうため出さない。振り返りは結果
 * ページの問題別フィードバック一覧で行う。
 */
export function YakuBoard({
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  lastAnswerCorrect,
  onAnswer,
  onRecordResult,
}: YakuBoardProps) {
  const t = useTranslations("yaku");
  const [question, setQuestion] = useClientGeneratedQuestion(generateQuestion);
  const [selectedYaku, setSelectedYaku] = useState<Set<string>>(new Set());

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setSelectedYaku(new Set());
  }, [setQuestion]);

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);

  // 答え合わせはトレーニングで止まっている間だけ出す（開示・回答後のどちらでも）
  const { isRevealed, isHolding } = useTrainingMode();
  const showAnswer = isRevealed || isHolding;

  const handleToggleYaku = useCallback(
    (yakuName: string) => {
      if (showFeedback) return;
      setSelectedYaku((prev) => {
        const next = new Set(prev);
        if (next.has(yakuName)) {
          next.delete(yakuName);
        } else {
          next.add(yakuName);
        }
        return next;
      });
    },
    [showFeedback],
  );

  const handleSubmit = useCallback(() => {
    if (!question || showFeedback || selectedYaku.size === 0) return;
    const selected = [...selectedYaku];
    const isCorrect = judgeYakuAnswer(question.correctYakuNames, selected);
    onRecordResult?.(toQuestionResult(question, selected, isCorrect));
    onAnswer(isCorrect, advanceQuestion);
  }, [
    question,
    selectedYaku,
    showFeedback,
    onAnswer,
    advanceQuestion,
    onRecordResult,
  ]);

  if (!question) {
    return <QuestionGeneratingPlaceholder label={t("generating")} />;
  }

  const hasSelection = selectedYaku.size > 0;

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={question.tehai}
        context={question.context}
        mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
      />

      {/* Instruction */}
      <QuestionPrompt>{t("selectYaku")}</QuestionPrompt>

      {/* 回答中は一覧から選ぶ。止まって答え合わせをする間は、結果ページの
          問題別フィードバックと同じ対比表に差し替える（自分が選んだ役は
          その表の中に並ぶため、選択欄と二重に出さない） */}
      {showAnswer ? (
        <YakuAnswerComparison
          correctYakuNames={question.correctYakuNames}
          selectedYakuNames={[...selectedYaku]}
          isCorrect={lastAnswerCorrect}
        />
      ) : (
        <YakuSelectList
          selected={selectedYaku}
          disabled={isCountingDown || showFeedback}
          onToggle={handleToggleYaku}
        />
      )}

      {/* Submit button（チャレンジは押した瞬間に次問題へ進むため「回答する」） */}
      <ChallengeSubmitButton
        disabled={!hasSelection || showFeedback || isCountingDown}
        onClick={handleSubmit}
      >
        {isTraining ? t("checkButton") : t("answerButton")}
      </ChallengeSubmitButton>
    </div>
  );
}
