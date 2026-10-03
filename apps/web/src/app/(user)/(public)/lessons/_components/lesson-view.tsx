"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/app/(user)/_components/button";
import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { SignUpPanel } from "@/app/(user)/_components/sign-up-panel";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { ChoiceButton } from "@/app/(user)/(public)/practice/_components/choice-button";
import { FeedbackFrame } from "@/app/(user)/(public)/practice/_components/feedback-frame";
import { JudgementMark } from "@/app/(user)/(public)/practice/_components/judgement-mark";
import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "@/app/(user)/(public)/practice/_components/practice-footer-actions";
import { PromptLabel } from "@/app/(user)/(public)/practice/_components/prompt-label";
import { QuestionPrompt } from "@/app/(user)/(public)/practice/_components/question-prompt";
import { getFeedbackStyles } from "@/app/(user)/(public)/practice/_lib/feedback-styles";
import { useAuth } from "@/app/_contexts/auth-context";
import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";
import {
  MANGAN_KO_RON_LESSON_CHOICES,
  MANGAN_KO_RON_LESSON_QUESTIONS,
} from "@mahjong-scoring/features/lessons/mangan-ko-ron";
import type { LessonSlug } from "@mahjong-scoring/features/lessons/registry";
import { chapterHref } from "@mahjong-scoring/features/routes";

import { completeLesson } from "../_actions/complete-lesson";

interface LessonViewProps {
  readonly slug: LessonSlug;
  /** 対応する章。未ログインの人が続きを読みに行く先 */
  readonly chapterSlug: CurriculumChapterSlug;
  /** 説明の本文（サーバーで描いたもの） */
  readonly explanation: ReactNode;
}

/** レッスンの段階 */
type Phase = "learn" | "quiz" | "done";

/** 点数を日本語ロケールの桁区切りで表示する */
function formatPoints(points: number): string {
  return points.toLocaleString("ja-JP");
}

/**
 * レッスンの進行（説明 → 確認問題 → できたことの確認）
 * レッスン進行
 *
 * 確認問題はチャレンジの盤面と同じ部品（選択肢ボタン・正誤の枠・出題文）で
 * 描くが、時計もライフも無い。間違えても止まらず、正解と解説を見せてから
 * 次へ進む。練習と違って「何問正解したか」は結果に残さない — 最後に
 * 出すのは覚えた内容で、正答数はその場で添えるだけ。
 *
 * 完了の記録は最後の問題を解いた時点で 1 回だけ Server Action を呼ぶ
 * （ログイン済みのときだけ。未ログインは受けられるが記録は残らない）。
 * やり直しても二重には記録しない（サーバー側も冪等）。
 *
 * 問題と選択肢は今のところ「子のロン（満貫以上）」のものを直接読む。
 * レッスンを足すときに slug から引く表にする（ページ側のコメント参照）。
 */
export function LessonView({
  slug,
  chapterSlug,
  explanation,
}: LessonViewProps) {
  const t = useTranslations("lessons");
  const tLesson = useTranslations("lessons.manganKoRon");
  const tScoreTable = useTranslations("scoreTable");
  const { user } = useAuth();

  const questions = MANGAN_KO_RON_LESSON_QUESTIONS;
  const choices = MANGAN_KO_RON_LESSON_CHOICES;

  const [phase, setPhase] = useState<Phase>("learn");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | undefined>(undefined);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const recorded = useRef(false);

  const question = questions[index];
  const isAnswered = selected !== undefined;
  const isCorrect = isAnswered && selected === question.answer;
  const isLast = index === questions.length - 1;

  useEffect(() => {
    if (phase !== "done" || recorded.current || !user) return;
    recorded.current = true;
    void completeLesson(slug);
  }, [phase, user, slug]);

  const handleSelect = useCallback(
    (choiceIndex: number) => {
      if (isAnswered) return;
      const value = choices[choiceIndex];
      setSelected(value);
      if (value === question.answer) {
        setCorrectCount((count) => count + 1);
      }
    },
    [isAnswered, choices, question.answer],
  );

  const handleNext = () => {
    if (isLast) {
      setPhase("done");
      return;
    }
    setIndex(index + 1);
    setSelected(undefined);
    setShowHint(false);
  };

  const handleRetry = () => {
    setPhase("learn");
    setIndex(0);
    setSelected(undefined);
    setShowHint(false);
    setCorrectCount(0);
  };

  if (phase === "learn") {
    return (
      <div className="space-y-8">
        <section className="space-y-3">
          <SectionTitle>{t("learnTitle")}</SectionTitle>
          {explanation}
        </section>
        <Button size="lg" fullWidth onClick={() => setPhase("quiz")}>
          {t("startQuiz", { count: questions.length })}
        </Button>
      </div>
    );
  }

  if (phase === "quiz") {
    return (
      <div className="space-y-6">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle>{t("quizTitle")}</SectionTitle>
            <span className="text-sm font-bold tabular-nums text-surface-600">
              {t("progress", { index: index + 1, total: questions.length })}
            </span>
          </div>

          <FeedbackFrame
            showFeedback={isAnswered}
            lastAnswerCorrect={isAnswered ? isCorrect : undefined}
            className="space-y-3 p-6 text-center"
          >
            <PromptLabel>{t("conditionLabel")}</PromptLabel>
            <p
              className="text-xl font-bold text-surface-900"
              data-testid="lesson-condition"
            >
              {tLesson("condition", {
                han: question.han,
                tier: tScoreTable(question.tierKey),
              })}
            </p>
            {/* ヒントは選択肢に手を付ける前に見られる。答えそのものではなく
                倍率の言い方で、表を思い出す手がかりにする */}
            {showHint && !isAnswered && (
              <p className="text-sm text-amber-900" data-testid="lesson-hint">
                <span className="font-bold">{t("hintLabel")}: </span>
                {tLesson(`questions.${question.tierKey}.hint`)}
              </p>
            )}
            {isAnswered && (
              <p
                className={`flex items-center justify-center gap-1.5 text-sm font-bold ${isCorrect ? "text-success-strong" : "text-destructive-strong"}`}
                data-testid="lesson-judgement"
              >
                <JudgementMark
                  verdict={isCorrect ? "correct" : "incorrect"}
                  tone="inherit"
                />
                {isCorrect
                  ? t("correct")
                  : t("incorrect", { answer: formatPoints(question.answer) })}
              </p>
            )}
            {isAnswered && (
              <p className="text-sm leading-relaxed text-surface-700">
                {tLesson(`questions.${question.tierKey}.explanation`)}
              </p>
            )}
          </FeedbackFrame>

          <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {choices.map((choice, choiceIndex) => {
              const { borderClass, bgClass } = getFeedbackStyles(
                isAnswered,
                selected === choice,
                choice === question.answer,
              );
              return (
                <ChoiceButton
                  key={choice}
                  index={choiceIndex}
                  onSelect={handleSelect}
                  disabled={isAnswered}
                  borderClass={borderClass}
                  bgClass={bgClass}
                  className="text-lg font-bold tabular-nums"
                >
                  {formatPoints(choice)}
                </ChoiceButton>
              );
            })}
          </div>
        </section>

        {isAnswered ? (
          <Button size="lg" fullWidth onClick={handleNext}>
            {isLast ? t("finish") : t("next")}
          </Button>
        ) : (
          <PracticeFooterActions>
            <PracticeFooterAction
              onClick={() => setShowHint(true)}
              disabled={showHint}
            >
              {t("showHint")}
            </PracticeFooterAction>
          </PracticeFooterActions>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <SectionTitle>{t("doneTitle")}</SectionTitle>
        <HighlightPanel>
          <p className="text-base font-bold leading-relaxed text-surface-900">
            {tLesson("achievement")}
          </p>
          <p
            className="mt-2 text-sm text-surface-700"
            data-testid="lesson-score"
          >
            {correctCount === questions.length
              ? t("doneScorePerfect", { total: questions.length })
              : t("doneScore", {
                  correct: correctCount,
                  total: questions.length,
                })}
          </p>
        </HighlightPanel>
      </section>

      {user ? (
        <LinkButton
          href="/"
          size="lg"
          fullWidth
          trailingIcon={<ChevronRightIcon className="size-5" />}
        >
          {t("continueHome")}
        </LinkButton>
      ) : (
        <SignUpPanel
          title={t("signUp.title")}
          description={t("signUp.description")}
          cta={t("signUp.cta")}
          secondary={{
            label: t("signUp.secondary"),
            href: chapterHref(chapterSlug),
          }}
        />
      )}

      <PracticeFooterActions>
        <PracticeFooterAction onClick={handleRetry}>
          {t("retry")}
        </PracticeFooterAction>
      </PracticeFooterActions>
    </div>
  );
}
