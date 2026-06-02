import type { ReactNode } from "react";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { ResultBlockSkeleton } from "./result-block-skeleton";
import { LeaderboardSkeleton } from "./leaderboard-skeleton";

interface ResultPageSkeletonProps {
  /** 結果ページと同じ練習名を表示してタイトル帯を一致させる */
  readonly title: ReactNode;
}

/**
 * 結果ページの読み込み中スケルトン
 * 結果ページスケルトン
 *
 * チャレンジ終了直後（スコア保存 → 結果ページへの遷移中）に表示する。
 * 以前はこの間 `ChallengeShell` が何も描画せず main が真っ白になっていた。
 * 結果ページ（`ResultView`）と同じレイアウト（タイトル帯・結果見出し・スコアバー・
 * 経験値ブロック・アクションボタン・リーダーボード）の placeholder を出すことで、
 * 白画面を排し、結果ページの実描画へ滑らかに繋ぐ。
 */
export function ResultPageSkeleton({ title }: ResultPageSkeletonProps) {
  return (
    <ContentContainer>
      <PageTitle>{title}</PageTitle>

      {/* 「結果」見出し + スコアバー */}
      <section aria-hidden="true" className="mt-6 space-y-3">
        <div className="h-7 w-24 animate-pulse rounded bg-surface-200" />
        <div className="h-8 w-full animate-pulse rounded-md bg-surface-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-surface-200" />
      </section>

      {/* 経験値 / 登録 CTA */}
      <ResultBlockSkeleton />

      {/* アクションボタン（もう一度 / 練習一覧に戻る） */}
      <div aria-hidden="true" className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="h-11 w-full animate-pulse rounded-lg bg-surface-200 sm:w-40" />
        <div className="h-11 w-full animate-pulse rounded-lg bg-surface-100 sm:w-40" />
      </div>

      {/* リーダーボードプレビュー */}
      <LeaderboardSkeleton />
    </ContentContainer>
  );
}
