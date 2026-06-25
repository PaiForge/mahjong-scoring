"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { generateJantouFuQuestion, getKazeName } from "@mahjong-scoring/core";
import type { JantouFuQuestion, JantouFuChoice } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { ChoiceButton } from "../../_components/choice-button";
import { getFeedbackStyles } from "../../_lib/feedback-styles";

interface JantouFuBoardProps {
  /** 正誤フィードバック表示中か（セッションから受け取る） */
  readonly showFeedback: boolean;
  /** カウントダウン中か（チャレンジのみ。トレーニングでは false） */
  readonly isCountingDown?: boolean;
  /** 回答処理。正誤と次問題へ進むコールバックを渡す */
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
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
}: JantouFuBoardProps) {
  const t = useTranslations("jantouFu");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const [question, setQuestion] = useState<JantouFuQuestion>(() =>
    generateJantouFuQuestion({ renfonpaiAs4Fu }),
  );
  const [selectedHai, setSelectedHai] = useState<
    JantouFuChoice["hai"] | undefined
  >(undefined);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateJantouFuQuestion({ renfonpaiAs4Fu }));
    setSelectedHai(undefined);
  }, [renfonpaiAs4Fu]);

  const handleChoiceSelect = useCallback(
    (index: number) => {
      if (showFeedback) return;
      const choice = question.choices[index];
      setSelectedHai(choice.hai);
      onAnswer(choice.isCorrect, advanceQuestion);
    },
    [showFeedback, question.choices, onAnswer, advanceQuestion],
  );

  return (
    <div className="mt-6 space-y-5">
      {/* Context */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="space-y-1 text-center">
          <span className="text-surface-400">{t("bakaze")}</span>
          <p className="text-lg font-bold text-surface-900">
            {getKazeName(question.context.bakaze)}
          </p>
        </div>
        <div className="space-y-1 text-center">
          <span className="text-surface-400">{t("jikaze")}</span>
          <p className="text-lg font-bold text-surface-900">
            {getKazeName(question.context.jikaze)}
          </p>
        </div>
      </div>

      {/* Question */}
      <p className="text-center text-sm font-medium text-surface-600">
        {t("selectCorrectHead")}
      </p>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-3">
        {question.choices.map((choice, i) => {
          const { borderClass, bgClass } = getFeedbackStyles(
            showFeedback,
            selectedHai === choice.hai,
            choice.isCorrect,
          );

          return (
            <ChoiceButton
              key={`${question.id}-${choice.hai}`}
              index={i}
              onSelect={handleChoiceSelect}
              disabled={showFeedback || isCountingDown}
              borderClass={borderClass}
              bgClass={bgClass}
              className="flex-col gap-5"
            >
              <div className="scale-125">
                <Hai hai={choice.hai} />
              </div>
            </ChoiceButton>
          );
        })}
      </div>
    </div>
  );
}
