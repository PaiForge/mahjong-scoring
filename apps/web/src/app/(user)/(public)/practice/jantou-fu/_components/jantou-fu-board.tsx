"use client";

import { useGradeAnswer } from "../../_hooks/use-verified-challenge";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { generateJantouFuQuestion } from "@mahjong-scoring/core";
import type { JantouFuQuestion, JantouFuChoice } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { ChoiceButton } from "../../_components/choice-button";
import { JantouFuKazeContext } from "./jantou-fu-kaze-context";
import { getChoiceFeedbackProps } from "../../_lib/feedback-styles";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { useClientGeneratedQuestion } from "../../_hooks/use-client-generated-question";
import { usePresentQuestion } from "../../_hooks/use-present-question";
import { useRegisterAdvance } from "@mahjong-scoring/features/practice/use-training-mode";
import { toQuestionResult } from "@mahjong-scoring/features/practice/jantou-fu/types";
import type { JantouFuQuestionResult } from "@mahjong-scoring/features/practice/jantou-fu/types";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";

type JantouFuBoardProps = RecordingPracticeBoardProps<JantouFuQuestionResult>;

/** 出題中の問題を回答なしの結果に組む（時間切れの届け出用） */
function toUnansweredResult(
  question: JantouFuQuestion,
): JantouFuQuestionResult {
  return toQuestionResult(question, undefined);
}

/**
 * 雀頭符の出題盤面（場風・自風の提示と4択）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 * セッション管理（タイマー・スコア集計・終了判定）は親の shell が担う。
 */
export function JantouFuBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: JantouFuBoardProps) {
  const gradeAnswer = useGradeAnswer<JantouFuQuestion>();
  const t = useTranslations("jantouFu");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const generateQuestion = useCallback(
    (): JantouFuQuestion => generateJantouFuQuestion({ renfonpaiAs4Fu }),
    [renfonpaiAs4Fu],
  );
  const [question, setQuestion] = useClientGeneratedQuestion(generateQuestion);
  const [selectedHai, setSelectedHai] = useState<
    JantouFuChoice["hai"] | undefined
  >(undefined);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setSelectedHai(undefined);
  }, [generateQuestion, setQuestion]);

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);
  usePresentQuestion(question, toUnansweredResult, onPresentQuestion);

  const handleChoiceSelect = useCallback(
    (index: number) => {
      if (showFeedback || !question) return;
      const accepted = gradeAnswer(question, index, (gradedQuestion) => {
        const choice = gradedQuestion.choices[index];
        onRecordResult?.(toQuestionResult(gradedQuestion, choice));
        onAnswer(choice.isCorrect, advanceQuestion);
      });
      // 採点を待たずに選択を立てる（サーバー採点の待ち時間に押した印を出す）。
      // 牌は出題時点の問題にもあるので、採点済みの問題を待たなくてよい
      if (accepted) setSelectedHai(question.choices[index].hai);
    },
    [
      showFeedback,
      question,
      onAnswer,
      advanceQuestion,
      onRecordResult,
      gradeAnswer,
    ],
  );

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="jantouFu"
      />
    );
  }

  return (
    <div className="mt-6 space-y-5">
      {/* Context */}
      <JantouFuKazeContext
        bakaze={question.context.bakaze}
        jikaze={question.context.jikaze}
      />

      {/* Question */}
      <QuestionPrompt>{t("selectCorrectHead")}</QuestionPrompt>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-3">
        {question.choices.map((choice, i) => (
          <ChoiceButton
            key={`${question.id}-${choice.hai}`}
            index={i}
            onSelect={handleChoiceSelect}
            className="flex-col gap-5"
            {...getChoiceFeedbackProps({
              showFeedback,
              isCountingDown,
              isSelected: selectedHai === choice.hai,
              isCorrect: choice.isCorrect,
            })}
          >
            <div className="scale-125">
              <Hai hai={choice.hai} />
            </div>
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
