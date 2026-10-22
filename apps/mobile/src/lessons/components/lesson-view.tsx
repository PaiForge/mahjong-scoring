import { useState, type ReactNode } from "react";
import {
  isSameChoice,
  type LessonChoice,
} from "@mahjong-scoring/features/lessons/quiz";
import { lessonQuiz } from "@mahjong-scoring/features/lessons/quizzes";
import type { QuizLessonSlug } from "@mahjong-scoring/features/lessons/registry";

import {
  useLessonDone,
  useMarkLessonCompleted,
} from "../../records/use-account-progress";
import { hapticJudgement } from "../../lib/haptics";
import { LessonDonePhase } from "./lesson-done-phase";
import { LessonLearnPhase } from "./lesson-learn-phase";
import { LessonQuizPhase } from "./lesson-quiz-phase";

/** レッスンの段階（並びは進む順） */
type LessonPhase = "learn" | "quiz" | "done";

interface LessonViewProps {
  readonly slug: QuizLessonSlug;
  /** 確認問題の辞書の名前空間（`lessons.<messageKey>`） */
  readonly messageKey: string;
  /** 本文（章の本文そのもの） */
  readonly explanation: ReactNode;
  /** 章の末尾（広告・公開日）。確認問題の画面には出さない */
  readonly footer: ReactNode;
  /** 画面の先頭へ戻す（段階・問題が変わったとき） */
  readonly onScrollTop: () => void;
}

/**
 * レッスンの進行（本文 → 確認問題 → できたことの確認）（web の `LessonView`）
 * レッスン進行
 *
 * 確認問題はチャレンジの盤面と同じ部品（選択肢ボタン・正誤の枠・出題文）で
 * 描くが、時計もライフも無い。間違えても止まらず、正解と解説を見せてから
 * 次へ進む。正答数は完了画面で添えるだけで残さない。
 *
 * 最後の問題を解き終えたら完了を記録する。ログイン中はアカウントの未送信へ
 * 積んでからサーバーへ送り、ゲストは端末に残す（web は保存の状態ごとに完了
 * 画面の導線を変えるが、アプリは先に端末へ預けるので失敗の分岐を持たない。
 * 送れなかった分は次の同期で送る）。完了画面の主導線は web と同じ: 本人の進み具合を
 * 踏まえた次の一歩（features の `lessonFollowUp`）。それが道筋の順の次の
 * レッスン（`stepAfterLesson`）と同じなら、ボタンの代わりにそのレッスンの
 * 冒頭のプレビューを出す。級の最後のレッスンでは、ボタンの下に昇級試験までの
 * 残りを添える。次のレッスンへは置き換えて移り、続けて読んでも戻るは 1 回で
 * 学習を始めた画面へ帰る。
 *
 * 完了済みの人が開いたときは、本文の下の「確認問題へ」を控えめな解き直しの
 * リンクに替え、その下に目次の順の次のレッスンと練習への導線を出す。
 *
 * web は段階をブラウザの履歴に積み「戻る」で 1 段階ずつ戻れるが、モバイルの
 * 戻るは画面を閉じる。その代わり確認問題の下に「本文を読み返す」を置き、
 * 本文へ戻っても解いている問題と回答（選んだ答え・ヒント・正答数）は残して、
 * 本文の下のボタンから同じ問題へ戻れるようにする。読み返すたびに最初から
 * 解き直させないため。
 */
export function LessonView({
  slug,
  messageKey,
  explanation,
  footer,
  onScrollTop,
}: LessonViewProps) {
  const completed = useLessonDone(slug);
  const markCompleted = useMarkLessonCompleted();

  const { questions, choices } = lessonQuiz(slug);

  const [phase, setPhase] = useState<LessonPhase>("learn");
  const [finished, setFinished] = useState(false);
  // 確認問題を解いている途中か（本文を読み返しても続きから戻れるように）
  const [inQuiz, setInQuiz] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<LessonChoice | undefined>(undefined);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const question = questions[index];
  const isAnswered = selected !== undefined;
  const isLast = index === questions.length - 1;

  const goTo = (next: LessonPhase) => {
    setPhase(next);
    onScrollTop();
  };

  const handleSelect = (choiceIndex: number) => {
    if (isAnswered) return;
    const choice = choices[choiceIndex];
    setSelected(choice);
    const correct = isSameChoice(choice, question.answer);
    hapticJudgement(correct ? "correct" : "incorrect");
    if (correct) {
      setCorrectCount((count) => count + 1);
    }
  };

  const handleStart = () => {
    // 解き終えたあとに本文から始めたら最初から
    if (finished) {
      setIndex(0);
      setSelected(undefined);
      setShowHint(false);
      setCorrectCount(0);
      setFinished(false);
    }
    setInQuiz(true);
    goTo("quiz");
  };

  const handleNext = () => {
    if (isLast) {
      setFinished(true);
      setInQuiz(false);
      markCompleted(slug);
      goTo("done");
      return;
    }
    setIndex(index + 1);
    setSelected(undefined);
    setShowHint(false);
    onScrollTop();
  };

  if (phase === "learn") {
    return (
      <LessonLearnPhase
        slug={slug}
        completed={completed}
        inQuiz={inQuiz}
        index={index}
        total={questions.length}
        explanation={explanation}
        footer={footer}
        onStart={handleStart}
      />
    );
  }

  if (phase === "quiz") {
    return (
      <LessonQuizPhase
        messageKey={messageKey}
        question={question}
        choices={choices}
        selected={selected}
        showHint={showHint}
        index={index}
        total={questions.length}
        onSelect={handleSelect}
        onShowHint={() => setShowHint(true)}
        onNext={handleNext}
        onReviewBody={() => goTo("learn")}
      />
    );
  }

  return (
    <LessonDonePhase
      slug={slug}
      messageKey={messageKey}
      correctCount={correctCount}
      total={questions.length}
      footer={footer}
      onReviewBody={() => goTo("learn")}
    />
  );
}
