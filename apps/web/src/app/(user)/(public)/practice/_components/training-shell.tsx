"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { InfinityIcon } from "@/app/_components/icons/infinity-icon";

interface TrainingShellProps {
  /** 画面上部に表示する練習名（PageTitle に渡す） */
  readonly title: ReactNode;
  /** 正解数 */
  readonly correctCount: number;
  /** 出題数 */
  readonly totalCount: number;
  /** 「終了」リンクの遷移先（練習説明ページ等） */
  readonly exitHref: string;
  /** 練習本体のUI */
  readonly children: ReactNode;
  /** 内部ラッパーの max-w クラス（既定: "max-w-md"） */
  readonly maxWidth?: string;
}

/**
 * トレーニング共通シェル（ステータスバー・ContentContainer）
 *
 * チャレンジの {@link import("./challenge-shell").ChallengeShell} と異なり、
 * タイマー・ライフ・カウントダウン・結果ページ遷移を持たない。
 * 時間無制限の反復練習に用い、ユーザーは「終了」リンクで任意に離脱する。
 */
export function TrainingShell({
  title,
  correctCount,
  totalCount,
  exitHref,
  children,
  maxWidth = "max-w-md",
}: TrainingShellProps) {
  const tc = useTranslations("challenge");
  const tt = useTranslations("training");

  return (
    <ContentContainer>
      <PageTitle>{title}</PageTitle>

      <div className={`mx-auto ${maxWidth}`}>
        {/* Status bar */}
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1 text-surface-500">
            <InfinityIcon className="size-4" />
            {tt("modeLabel")}
          </span>
          <span className="text-surface-500">
            {tc("score")}:{" "}
            <span className="font-semibold text-surface-900">{correctCount}</span>
            <span className="text-surface-400"> / {totalCount}</span>
          </span>
        </div>

        {/* Game content area */}
        <div>{children}</div>

        {/* Exit link */}
        <div className="mt-6 text-center">
          <Link
            href={exitHref}
            className="text-sm text-surface-400 underline transition-colors hover:text-surface-600"
          >
            {tt("exitButton")}
          </Link>
        </div>
      </div>
    </ContentContainer>
  );
}
