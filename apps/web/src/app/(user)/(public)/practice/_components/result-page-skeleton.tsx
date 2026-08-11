"use client";

import { useTranslations } from "next-intl";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { buildResultBreadcrumb } from "../_lib/result-breadcrumb";
import { ResultBlockSkeleton } from "./result-block-skeleton";
import { LeaderboardSkeleton } from "./leaderboard-skeleton";

interface ResultPageSkeletonProps {
  /** 結果ページと同じ練習名を表示してタイトル帯を一致させる */
  readonly practiceTitle: string;
  /** 練習説明ページの URL。結果ページと同じパンくずを組み立てるために使う。 */
  readonly introHref?: string;
}

/**
 * 結果ページの読み込み中スケルトン
 * 結果ページスケルトン
 *
 * チャレンジ終了直後（スコア保存 → 結果ページへの遷移中）に表示する。
 * 以前はこの間 `ChallengeShell` が何も描画せず main が真っ白になっていた。
 * 結果ページ（`ResultView`）と同じレイアウト（タイトル帯・結果見出し・スコアバー・
 * 経験値ブロック・アクションボタン・リーダーボード・パンくず）の placeholder を
 * 出すことで、白画面を排し、結果ページの実描画へ滑らかに繋ぐ。
 *
 * パンくずは `ResultView` と同じ `buildResultBreadcrumb` で組み立てる
 * （こちらは Client Component なので `useTranslations` を使う）。
 */
export function ResultPageSkeleton({
  practiceTitle,
  introHref,
}: ResultPageSkeletonProps) {
  const tc = useTranslations("challenge");
  const tp = useTranslations("practice");

  return (
    <ContentContainer
      breadcrumb={buildResultBreadcrumb({
        practiceListLabel: tp("title"),
        practiceTitle,
        resultLabel: tc("resultSuffix"),
        introHref,
      })}
    >
      <PageTitle>{practiceTitle}</PageTitle>

      {/* 結果ページ（ResultView）と同じ space-y-8 で間隔を揃え、遷移時のズレを防ぐ */}
      <div className="space-y-8">
        {/* 「結果」見出し + スコアバー */}
        <section aria-hidden="true" className="space-y-3">
          <div className="h-7 w-24 animate-pulse rounded bg-surface-200" />
          <div className="h-8 w-full animate-pulse rounded-md bg-surface-100" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-surface-200" />
        </section>

        {/* 経験値 / 登録 CTA */}
        <ResultBlockSkeleton />

        {/* アクションボタン（もう一度 / 練習一覧に戻る）。ResultView と同じ縦積み・全幅。 */}
        <div aria-hidden="true" className="space-y-3">
          <div className="h-11 w-full animate-pulse rounded-lg bg-surface-200" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-surface-100" />
        </div>

        {/* リーダーボードプレビュー */}
        <LeaderboardSkeleton />
      </div>
    </ContentContainer>
  );
}
