import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { PrimaryLinkButton } from "@/app/_components/primary-link-button";
import { SectionTitle } from "@/app/_components/section-title";
import type { PracticeResultViewProps } from "../_lib/create-practice-result-page";
import { ResultScoreBar } from "./result-score-bar";

/**
 * 練習結果画面の共通ビュー
 * 練習結果表示
 *
 * Server Component。`resultBlock` / `leaderboardBlock` の `Suspense` 境界が
 * React Server Components のストリーミング機構で正しく機能するよう、このビュー
 * 自体を Server Component として描画する。
 *
 * 以前は `"use client"` だったが、Client Component の props として渡された
 * `<Suspense>` 境界は RSC シリアライズのタイミング上 fallback → 実コンテンツの
 * 置換が期待通りに動作しない（スケルトンと実コンテンツが同時に描画される）
 * 事象が発生したため、Server Component 化した。
 *
 * 子要素の `ResultScoreBar` は内部で `useTranslations` を呼ぶ Client Component
 * だが、Server 親の子として通常通り動作する（RSC の方向制約に合致）。
 *
 * 表示順:
 * 1. PageTitle（練習名） — 即時描画
 * 2. 「結果」セクション（ScoreBar） — 即時描画（親 page.tsx の searchParams から props で受け取る）
 * 3. `resultBlock` — 経験値 / 登録 CTA（Suspense 境界）
 * 4. アクションボタン（もう一度 / 練習一覧に戻る） — 即時描画
 * 5. `children` — 練習種別固有の追加コンテンツ（問題別フィードバック等）
 * 6. `leaderboardBlock` — リーダーボードプレビュー（Suspense 境界）
 */
export async function ResultView({
  practiceTitle,
  playHref,
  correct,
  total,
  resultBlock,
  leaderboardBlock,
  children,
}: PracticeResultViewProps) {
  const tc = await getTranslations("challenge");

  return (
    <ContentContainer>
      <PageTitle>{practiceTitle}</PageTitle>

      <section className="mt-6 space-y-3">
        <SectionTitle>{tc("resultSectionTitle")}</SectionTitle>
        <ResultScoreBar correct={correct} total={total} />
      </section>

      {/* 結果ブロック: 経験値 / 登録 CTA。Suspense + ResultBlockSkeleton で包まれている。 */}
      {resultBlock}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <PrimaryLinkButton href={playHref}>{tc("retryButton")}</PrimaryLinkButton>
        <Link
          href="/practice"
          className="inline-flex items-center justify-center rounded-lg border border-surface-200 px-6 py-2.5 text-sm font-semibold text-surface-600 transition-colors hover:bg-surface-100"
        >
          {tc("backToList")}
        </Link>
      </div>

      {/* 練習種別固有の追加コンテンツ（問題別フィードバック一覧など） */}
      {children}

      {/* リーダーボードプレビュー。Suspense + LeaderboardSkeleton で包まれている。 */}
      {leaderboardBlock}
    </ContentContainer>
  );
}
