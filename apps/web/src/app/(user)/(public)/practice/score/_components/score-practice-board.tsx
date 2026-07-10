"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { isOya } from "@mahjong-scoring/core";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { useScorePracticeStore } from "../_hooks/use-score-practice-store";
import type { UserAnswer } from "@mahjong-scoring/core";
import { useIsClient } from "../../_hooks/use-is-client";
import { useScrollToElement } from "../../_hooks/use-scroll-to-element";
import { PRACTICE_SCROLL_ANCHOR_ID } from "../../_lib/scroll-anchor";
import {
  parseGeneratorOptionsFromParams,
  parseModeFlagsFromParams,
} from "../_lib/parse-practice-params";
import { QuestionDisplay } from "./question-display";
import { ScorePracticeAnswerForm } from "./score-practice-answer-form";
import { ScorePracticeBoardSkeleton } from "./score-practice-board-skeleton";
import { ResultDisplay } from "./result-display";
import { ScoreCounter } from "../../_components/score-counter";

/** 正解トーストの表示スタイル */
const CORRECT_TOAST_STYLE = {
  background: "#E6FFFA",
  color: "#2C7A7B",
  fontWeight: "bold",
} as const;

function ScorePracticeBoardInner() {
  const t = useTranslations("score");
  const tc = useTranslations("challenge");
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentQuestion,
    userAnswer,
    judgementResult,
    isAnswered,
    stats,
    generateNewQuestion,
    submitAnswer,
    nextQuestion,
  } = useScorePracticeStore();

  const isClient = useIsClient();
  const initializedRef = useRef(false);

  // 練習開始直後（最初の問題が用意されたら）、グローバルヘッダ分のオフセットを
  // 解消して問題を画面上部へ表示する
  useScrollToElement(PRACTICE_SCROLL_ANCHOR_ID, Boolean(currentQuestion));

  const initializeQuestion = useCallback(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const params = new URLSearchParams(searchParams.toString());
    useScorePracticeStore
      .getState()
      .setOptions(parseGeneratorOptionsFromParams(params));

    generateNewQuestion();
  }, [searchParams, generateNewQuestion]);

  useEffect(() => {
    if (isClient && !currentQuestion) {
      initializeQuestion();
    }
  }, [isClient, currentQuestion, initializeQuestion]);

  const { requireYaku, simplifyMangan, requireFuForMangan, autoNext } =
    parseModeFlagsFromParams(new URLSearchParams(searchParams.toString()));

  const handleBackToSetup = useCallback(() => {
    router.push("/practice/score");
  }, [router]);

  const handleNext = useCallback(() => {
    nextQuestion();
  }, [nextQuestion]);

  const handleSubmit = useCallback(
    (answer: UserAnswer) => {
      submitAnswer(answer, requireYaku, simplifyMangan, requireFuForMangan);

      if (autoNext) {
        const state = useScorePracticeStore.getState();
        if (state.judgementResult?.isCorrect) {
          toast.success(t("board.correct"), {
            duration: 1500,
            position: "top-center",
            style: CORRECT_TOAST_STYLE,
          });
          nextQuestion();
        }
      }
    },
    [
      submitAnswer,
      nextQuestion,
      requireYaku,
      simplifyMangan,
      requireFuForMangan,
      autoNext,
      t,
    ],
  );

  // クライアントマウント前・問題生成前はどちらも本体と同形のスケルトンを表示し、
  // 実コンテンツへの差し替え時にレイアウトシフト（CLS）が起きないようにする。
  if (!isClient || !currentQuestion) {
    return <ScorePracticeBoardSkeleton />;
  }

  return (
    <ContentContainer id={PRACTICE_SCROLL_ANCHOR_ID}>
      <PageTitle>{t("title")}</PageTitle>

      {/* 要素間の余白を ContentContainer カードのパディング（p-4 sm:p-6 md:p-8）と同じ
          レスポンシブ値に揃え、最終要素である「終了する」の上下余白を均等にする。 */}
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Question */}
        <div className="rounded-xl border border-surface-200 bg-white p-2 sm:p-6">
          <QuestionDisplay question={currentQuestion} />
        </div>

        {/* Answer area */}
        <div className="rounded-xl border border-surface-200 bg-white p-4 sm:p-6">
          {isAnswered && userAnswer && judgementResult ? (
            <ResultDisplay
              question={currentQuestion}
              userAnswer={userAnswer}
              result={judgementResult}
              onNext={handleNext}
              requireYaku={requireYaku}
              simplifyMangan={simplifyMangan}
              requireFuForMangan={requireFuForMangan}
            />
          ) : (
            <ScorePracticeAnswerForm
              key={stats.total}
              onSubmit={handleSubmit}
              disabled={isAnswered}
              isTsumo={currentQuestion.isTsumo}
              isOya={isOya(currentQuestion.jikaze)}
              requireYaku={requireYaku}
              simplifyMangan={simplifyMangan}
              requireFuForMangan={requireFuForMangan}
              onSkip={handleNext}
            />
          )}
        </div>

        {/* Footer: 正解 / 不正解 カウンタ（旧・上部の "0 / 0" を移設） */}
        <ScoreCounter
          correct={stats.correct}
          incorrect={stats.total - stats.correct}
          correctLabel={t("board.correctLabel")}
          incorrectLabel={t("board.incorrectLabel")}
        />

        {/* Quit button */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleBackToSetup}
            className="text-sm text-surface-400 underline transition-colors hover:text-surface-600"
          >
            {tc("quitButton")}
          </button>
        </div>
      </div>
    </ContentContainer>
  );
}

/**
 * 点数計算練習のメインボード
 * 練習ボード
 */
export function ScorePracticeBoard() {
  return (
    <Suspense fallback={<ScorePracticeBoardSkeleton />}>
      <ScorePracticeBoardInner />
    </Suspense>
  );
}
