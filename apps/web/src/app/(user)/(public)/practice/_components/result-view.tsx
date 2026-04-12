"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { PrimaryLinkButton } from "@/app/_components/primary-link-button";
import { SectionTitle } from "@/app/_components/section-title";
import type { PracticeResultViewProps } from "../_lib/create-practice-result-page";
import { LeaderboardPreview } from "./leaderboard-preview";
import { ResultScoreBar } from "./result-score-bar";

/**
 * 練習結果画面の共通クライアントコンポーネント
 * 練習結果表示
 *
 * 表示順:
 * 1. PageTitle（練習名）
 * 2. 「結果」セクション（ScoreBar）
 * 3. children（EXP セクション / 問題別フィードバック等、サーバから渡される）
 * 4. アクションボタン（もう一度 / 練習一覧に戻る）
 * 5. リーダーボードプレビュー（上位3名 + 詳細リンク）
 */
export function ResultView({
  practiceTitle,
  playHref,
  leaderboardRows,
  leaderboardDetailPath,
  children,
}: PracticeResultViewProps) {
  const searchParams = useSearchParams();
  const tc = useTranslations("challenge");

  const correct = Number(searchParams.get("correct") ?? 0);
  const total = Number(searchParams.get("total") ?? 0);

  return (
    <ContentContainer>
      <PageTitle>{practiceTitle}</PageTitle>

      <section className="mt-6 space-y-3">
        <SectionTitle>{tc("resultSectionTitle")}</SectionTitle>
        <ResultScoreBar correct={correct} total={total} />
      </section>

      {/*
        結果ブロック: 経験値セクション（`ExpGainDisplay`）と、
        練習種別ごとの追加コンテンツ（問題別フィードバック一覧など）。
        Next.js で推奨される `children` スロット経由で Server Component の
        要素を安全に受け取る。
      */}
      {children}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <PrimaryLinkButton href={playHref}>{tc("retryButton")}</PrimaryLinkButton>
        <Link
          href="/practice"
          className="inline-flex items-center justify-center rounded-lg border border-surface-200 px-6 py-2.5 text-sm font-semibold text-surface-600 transition-colors hover:bg-surface-100"
        >
          {tc("backToList")}
        </Link>
      </div>

      {/* リーダーボードプレビュー（上位3名 + 全体リンク） */}
      <LeaderboardPreview rows={leaderboardRows} detailPath={leaderboardDetailPath} />
    </ContentContainer>
  );
}
