"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { HaiKind } from "@mahjong-scoring/core";
import { Toaster, toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { ContentContainer } from "@/app/_components/content-container";
import { useDrillStore } from "@/stores/use-drill-store";
import type { UserAnswer } from "@mahjong-scoring/core";
import { QuestionDisplay } from "./question-display";
import { AnswerForm } from "./answer-form";
import { ResultDisplay } from "./result-display";

function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
}

function DrillBoardInner() {
  const t = useTranslations("score");
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
  } = useDrillStore();

  const isClient = useIsClient();
  const initializedRef = useRef(false);

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

    useDrillStore.getState().setOptions({
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

  const handleBackToSetup = () => {
    router.push("/practice/score");
  };

  if (!isClient) {
    return (
      <ContentContainer>
        <div className="flex items-center justify-center py-20">
          <div className="text-surface-500">{t("loading")}</div>
        </div>
      </ContentContainer>
    );
  }

  if (!currentQuestion) {
    return (
      <ContentContainer>
        <div className="flex items-center justify-center py-20">
          <div className="text-surface-500">{t("generating")}</div>
        </div>
      </ContentContainer>
    );
  }

  const requireYaku = searchParams.get("mode") === "with_yaku";
  const simplifyMangan = searchParams.get("simple") === "1";
  const requireFuForMangan = searchParams.get("fu_mangan") === "1";
  const autoNext = searchParams.get("auto_next") === "1";

  const handleNext = () => {
    nextQuestion();
  };

  const handleSubmit = (answer: UserAnswer) => {
    submitAnswer(answer, requireYaku, simplifyMangan, requireFuForMangan);

    if (autoNext) {
      const state = useDrillStore.getState();
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
        handleNext();
      }
    }
  };

  return (
    <ContentContainer>
      <Toaster />
      {/* Stats */}
      <div className="mb-4 flex items-center justify-between text-sm text-surface-500">
        <div>
          {t("board.stats", { correct: stats.correct, total: stats.total })}
        </div>
      </div>

      {/* Question */}
      <div className="rounded-xl border border-surface-200 bg-white p-2 shadow-sm sm:p-6">
        <QuestionDisplay question={currentQuestion} />
      </div>

      {/* Answer area */}
      <div className="mt-4 rounded-xl border border-surface-200 bg-white p-4 shadow-sm sm:p-6">
        {isAnswered && userAnswer && judgementResult ? (
          <ResultDisplay
            question={currentQuestion}
            userAnswer={userAnswer}
            result={judgementResult}
            onNext={handleNext}
            onExit={handleBackToSetup}
            requireYaku={requireYaku}
            simplifyMangan={simplifyMangan}
            requireFuForMangan={requireFuForMangan}
          />
        ) : (
          <AnswerForm
            key={stats.total}
            onSubmit={handleSubmit}
            disabled={isAnswered}
            isTsumo={currentQuestion.isTsumo}
            isOya={currentQuestion.jikaze === HaiKind.Ton}
            requireYaku={requireYaku}
            simplifyMangan={simplifyMangan}
            requireFuForMangan={requireFuForMangan}
            onSkip={handleNext}
            onExit={handleBackToSetup}
          />
        )}
      </div>
    </ContentContainer>
  );
}

/**
 * 点数計算ドリルのメインボード
 * ドリルボード
 */
export function DrillBoard() {
  return (
    <Suspense
      fallback={
        <ContentContainer>
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-300 border-t-primary-500" />
          </div>
        </ContentContainer>
      }
    >
      <DrillBoardInner />
    </Suspense>
  );
}
