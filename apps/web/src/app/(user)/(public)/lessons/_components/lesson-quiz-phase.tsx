"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/app/(user)/_components/button";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "@/app/(user)/(public)/practice/_components/practice-footer-actions";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";
import type {
  LessonChoice,
  LessonQuestion,
} from "@mahjong-scoring/features/lessons/quiz";
import { LessonQuestionCard } from "./lesson-question-card";
import { LessonQuizSteps } from "./lesson-quiz-steps";

/**
 * レッスンの確認問題の段階（`quiz`）
 * 確認問題の段階
 *
 * 答えると「次へ」（最後の問題なら「終える」）が出る。答える前はヒントと
 * 「本文を読み返す」だけ。
 */
export function LessonQuizPhase({
  messageKey,
  question,
  choices,
  selected,
  showHint,
  index,
  total,
  onSelect,
  onShowHint,
  onNext,
  onReviewBody,
}: {
  readonly messageKey: string;
  readonly question: LessonQuestion;
  readonly choices: readonly LessonChoice[];
  readonly selected: LessonChoice | undefined;
  readonly showHint: boolean;
  readonly index: number;
  readonly total: number;
  readonly onSelect: (choiceIndex: number) => void;
  readonly onShowHint: () => void;
  readonly onNext: () => void;
  readonly onReviewBody: () => void;
}) {
  const t = useTranslations("lessons");
  const isAnswered = selected !== undefined;
  const isLast = index === total - 1;
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <SectionTitle>{t("quizTitle")}</SectionTitle>
        <LessonQuizSteps
          current={index}
          total={total}
          label={t("progress", { index: index + 1, total })}
        />

        <LessonQuestionCard
          messageKey={messageKey}
          question={question}
          choices={choices}
          selected={selected}
          showHint={showHint}
          onSelect={onSelect}
        />
      </section>

      <div className={`flex flex-col ${SUB_LINK_GAP}`}>
        {isAnswered && (
          <Button size="lg" fullWidth onClick={onNext}>
            {isLast ? t("finish") : t("next")}
          </Button>
        )}
        <PracticeFooterActions>
          {!isAnswered && (
            <PracticeFooterAction onClick={onShowHint} disabled={showHint}>
              {t("showHint")}
            </PracticeFooterAction>
          )}
          <PracticeFooterAction onClick={onReviewBody}>
            {t("reviewBody")}
          </PracticeFooterAction>
        </PracticeFooterActions>
      </div>
    </div>
  );
}
