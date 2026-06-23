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
import { QuestionDisplay } from "./question-display";
import { ScorePracticeAnswerForm } from "./score-practice-answer-form";
import { ResultDisplay } from "./result-display";

/** スクロール先の最上部要素 id（練習開始時にここまでスクロールする） */
const SCROLL_ANCHOR_ID = "practice-session";

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
  useScrollToElement(SCROLL_ANCHOR_ID, Boolean(currentQuestion));

  const initializeQuestion = useCallback(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const params = new URLSearchParams(searchParams.toString());

    const allowedRanges: ("non_mangan" | "mangan_plus")[] = [];
    const rangesValues = params.getAll("ranges");

    if (rangesValues.length > 0) {
      if (rangesValues.includes("non")) allowedRanges.push("non_mangan");
      if (rangesValues.includes("plus")) allowedRanges.push("mangan_plus");
    } else {
      allowedRanges.push("non_mangan", "mangan_plus");
    }

    let includeParent = true;
    let includeChild = true;
    const rolesValues = params.getAll("roles");
    if (rolesValues.length > 0) {
      includeParent = rolesValues.includes("oya");
      includeChild = rolesValues.includes("ko");
    }

    useScorePracticeStore.getState().setOptions({
      allowedRanges,
      includeParent,
      includeChild,
    });

    generateNewQuestion();
  }, [searchParams, generateNewQuestion]);

  useEffect(() => {
    if (isClient && !currentQuestion) {
      initializeQuestion();
    }
  }, [isClient, currentQuestion, initializeQuestion]);

  const requireYaku = searchParams.get("mode") === "with_yaku";
  const simplifyMangan = searchParams.get("simple") === "1";
  const requireFuForMangan = searchParams.get("fu_mangan") === "1";
  const autoNext = searchParams.get("auto_next") === "1";

  const handleBackToSetup = useCallback(() => {
    router.push("/practice/score");
  }, [router]);

  const handleNext = useCallback(() => {
    nextQuestion();
  }, [nextQuestion]);

  const handleSubmit = useCallback((answer: UserAnswer) => {
    submitAnswer(answer, requireYaku, simplifyMangan, requireFuForMangan);

    if (autoNext) {
      const state = useScorePracticeStore.getState();
      if (state.judgementResult?.isCorrect) {
        toast.success(t("board.correct"), {
          duration: 1500,
          position: "top-center",
          style: {
            background: "#E6FFFA",
            color: "#2C7A7B",
            fontWeight: "bold",
          },
        });
        nextQuestion();
      }
    }
  }, [submitAnswer, nextQuestion, requireYaku, simplifyMangan, requireFuForMangan, autoNext, t]);

  // クライアントマウント前・問題生成前はどちらも本体と同形のスケルトンを表示し、
  // 実コンテンツへの差し替え時にレイアウトシフト（CLS）が起きないようにする。
  if (!isClient || !currentQuestion) {
    return <ScorePracticeBoardSkeleton />;
  }

  return (
    <ContentContainer id={SCROLL_ANCHOR_ID}>
      <PageTitle>{t("title")}</PageTitle>

      {/* 要素間の余白を ContentContainer カードのパディング（p-4 sm:p-6 md:p-8）と同じ
          レスポンシブ値に揃え、最終要素である「終了する」の上下余白を均等にする。 */}
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-surface-500">
          <div>
            {t("board.stats", { correct: stats.correct, total: stats.total })}
          </div>
        </div>

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
 * プレイ画面のローディングスケルトン
 *
 * 本体（ScorePracticeBoardInner の最終レンダリング）と同じ ContentContainer・
 * カードラッパー・space-y 構成を保つことで、実コンテンツ表示時の CLS を防ぐ。
 * PageTitle は静的なため実際のタイトルを表示する。
 */
function ScorePracticeBoardSkeleton() {
  const t = useTranslations("score");

  return (
    <ContentContainer id={SCROLL_ANCHOR_ID}>
      <PageTitle>{t("title")}</PageTitle>

      <div className="space-y-4 sm:space-y-6 md:space-y-8" aria-hidden>
        {/* Stats */}
        <div className="h-5 w-32 animate-pulse rounded bg-surface-100" />

        {/* Question */}
        <div className="rounded-xl border border-surface-200 bg-white p-2 sm:p-6">
          <div className="space-y-6">
            <div className="h-20 animate-pulse rounded-lg bg-surface-100" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 animate-pulse rounded-lg bg-surface-100" />
              <div className="h-20 animate-pulse rounded-lg bg-surface-100" />
            </div>
          </div>
        </div>

        {/* Answer area: 翻・符・点数の select（各 label 付き）、回答するボタン、スキップリンク */}
        <div className="rounded-xl border border-surface-200 bg-white p-4 sm:p-6">
          <div className="space-y-5">
            {["han", "fu", "score"].map((field) => (
              <div key={field} className="space-y-2">
                <div className="h-4 w-16 animate-pulse rounded bg-surface-100" />
                <div className="h-12 animate-pulse rounded-lg bg-surface-100" />
              </div>
            ))}
            {/* 回答するボタン（実体は primary 色のため一段濃いトーンで表現） */}
            <div className="h-12 w-full animate-pulse rounded-lg bg-surface-200" />
            {/* スキップ */}
            <div className="flex justify-center pt-1">
              <div className="h-4 w-16 animate-pulse rounded bg-surface-100" />
            </div>
          </div>
        </div>

        {/* Quit button */}
        <div className="flex justify-center">
          <div className="h-5 w-20 animate-pulse rounded bg-surface-100" />
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
