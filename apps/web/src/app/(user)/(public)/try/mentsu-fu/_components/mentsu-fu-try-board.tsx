"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "@/app/(user)/(public)/practice/_components/practice-footer-actions";
import { LessonQuestionCard } from "@/app/(user)/(public)/lessons/_components/lesson-question-card";
import type {
  LessonChoice,
  LessonQuestion,
} from "@mahjong-scoring/features/lessons/quiz";
import { lessonQuiz } from "@mahjong-scoring/features/lessons/quizzes";

/**
 * 体験に出す問題。レッスン「面子の符」の確認問題のうち、么九牌の暗刻（8 符）
 *
 * 明刻の 2 符から「暗で 2 倍・么九牌で 2 倍」を重ねる問題で、解説を読むと
 * 面子の符の数え方の骨組みが 1 問で見える。基準の明刻（2 符）だけでは
 * 倍にしていく仕組みに触れずに終わる。
 */
const TRY_QUESTION_KEY = "ankouYaochu";

const { questions, choices } = lessonQuiz("mentsu-fu");

/** 体験に出す問題を引く。確認問題の並びを変えても同じ問題を指す */
function tryQuestion(): LessonQuestion {
  const found = questions.find(({ key }) => key === TRY_QUESTION_KEY);
  if (found === undefined) {
    throw new Error(`mentsu-fu の確認問題に ${TRY_QUESTION_KEY} が無い`);
  }
  return found;
}

const question = tryQuestion();

/**
 * 符の計算の体験の盤面
 * 符の体験盤面
 *
 * レッスン「面子の符」の確認問題 1 問を、レッスンと同じ部品
 * （{@link LessonQuestionCard}）で解かせる。時計もライフも記録も無く、
 * 間違えても正解と解説が出る。答え合わせのあとは解き直しを置かず、
 * 行き先（`afterAnswer` のレッスン・練習への導線）だけを出す。
 */
export function MentsuFuTryBoard({
  afterAnswer,
}: {
  /**
   * 答え合わせのあとにだけ出す導線。サーバーコンポーネントを渡すため、
   * ページから要素で受け取る
   */
  readonly afterAnswer?: ReactNode;
} = {}) {
  const t = useTranslations("lessons");
  const [selected, setSelected] = useState<LessonChoice | undefined>(undefined);
  const [showHint, setShowHint] = useState(false);
  const isAnswered = selected !== undefined;

  const handleSelect = (choiceIndex: number) => {
    if (isAnswered) return;
    setSelected(choices[choiceIndex]);
  };

  return (
    <>
      <section className="space-y-4">
        <LessonQuestionCard
          messageKey="mentsuFu"
          question={question}
          choices={choices}
          selected={selected}
          showHint={showHint}
          onSelect={handleSelect}
        />
        {!isAnswered && (
          <PracticeFooterActions>
            <PracticeFooterAction
              onClick={() => setShowHint(true)}
              disabled={showHint}
            >
              {t("showHint")}
            </PracticeFooterAction>
          </PracticeFooterActions>
        )}
      </section>
      {isAnswered && afterAnswer}
    </>
  );
}
