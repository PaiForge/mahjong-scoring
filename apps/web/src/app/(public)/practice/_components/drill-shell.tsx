"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ContentContainer } from "@/app/_components/content-container";
import { useTimedSession } from "../_hooks/use-timed-session";
import { useFinishRedirect } from "../_hooks/use-finish-redirect";
import { QuizTimer } from "./quiz-timer";
import { CHALLENGE_TIME_LIMIT } from "../_lib/challenge-constants";

interface DrillShellProps {
  /** useTimedSession の戻り値 */
  readonly session: ReturnType<typeof useTimedSession>;
  /** リザルトページへのパス（例: "/practice/jantou-fu/result"） */
  readonly resultPath: string;
  /** ドリル本体のUI */
  readonly children: ReactNode;
  /** 内部ラッパーの max-w クラス（既定: "max-w-md"） */
  readonly maxWidth?: string;
}

/**
 * ドリル共通シェル（カウントダウン・ステータスバー・ContentContainer）
 * ドリル共通外殻
 */
export function DrillShell({
  session,
  resultPath,
  children,
  maxWidth = "max-w-md",
}: DrillShellProps) {
  const tc = useTranslations("challenge");

  useFinishRedirect({
    isFinished: session.isFinished,
    correctCount: session.correctCount,
    totalCount: session.totalCount,
    elapsedMs: session.elapsedMs,
    resultPath,
  });

  if (session.isFinished) {
    return undefined;
  }

  return (
    <ContentContainer>
      {/* Countdown overlay */}
      {session.isCountingDown && (
        <div className="fixed inset-0 md:left-64 z-30 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <span className="text-6xl font-bold text-primary-500 animate-pulse">
            {session.countdownValue}
          </span>
        </div>
      )}

      <div className={`mx-auto ${maxWidth}`}>
        {/* Status bar */}
        <div className="flex items-center justify-between text-sm">
          <QuizTimer
            timeRemaining={session.remainingSeconds}
            progress={session.elapsedMs / 1000 / CHALLENGE_TIME_LIMIT}
          />
          <div className="flex items-center gap-3">
            <span className="text-surface-500">
              {tc("score")}: <span className="font-semibold text-surface-900">{session.correctCount}</span>
            </span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: session.mistakeLimit }, (_, i) => (
                <span
                  key={i}
                  className={`text-base ${i < session.remainingLives ? "text-red-500" : "text-surface-200"}`}
                >
                  &#9829;
                </span>
              ))}
            </div>
          </div>
        </div>

        {children}
      </div>
    </ContentContainer>
  );
}
