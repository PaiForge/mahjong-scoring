"use client";

import { useTranslations } from "next-intl";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { PRACTICE_SCROLL_ANCHOR_ID } from "../../_lib/scroll-anchor";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * プレイ画面のローディングスケルトン
 * 練習ボードスケルトン
 *
 * 本体（ScorePracticeBoardInner の最終レンダリング）と同じ ContentContainer・
 * space-y 構成を保つことで、実コンテンツ表示時の CLS を防ぐ。
 * PageTitle は静的なため実際のタイトルを表示する。
 */
export function ScorePracticeBoardSkeleton() {
  const t = useTranslations("score");

  return (
    <ContentContainer id={PRACTICE_SCROLL_ANCHOR_ID}>
      <PageTitle>{t("title")}</PageTitle>

      <div className="space-y-4 sm:space-y-6 md:space-y-8" aria-hidden>
        {/* Question: 状況行 + 手牌が入る盤面ひと枠ぶんの高さ */}
        <SkeletonBar radius="xl" className="mt-4 h-36" tone={100} />

        {/* Answer area: 翻・符・点数の select（各 label 付き）、回答するボタン、わからないリンク */}
        <div className="space-y-5">
          {["han", "fu", "score"].map((field) => (
            <div key={field} className="space-y-2">
              <SkeletonBar className="h-4 w-16" tone={100} />
              <SkeletonBar radius="lg" className="h-12" tone={100} />
            </div>
          ))}
          {/* 回答するボタン（実体は primary 色のため一段濃いトーンで表現） */}
          <SkeletonBar radius="lg" className="h-12 w-full" />
          {/* わからない */}
          <div className="flex justify-center pt-1">
            <SkeletonBar className="h-4 w-16" tone={100} />
          </div>
        </div>

        {/* Footer: 正解 / 不正解 カウンタ */}
        <div className="flex items-center justify-center gap-12">
          {["correct", "incorrect"].map((k) => (
            <div key={k} className="flex items-center gap-3">
              <SkeletonBar radius="full" className="h-8 w-8" tone={100} />
              <SkeletonBar className="h-6 w-6" tone={100} />
            </div>
          ))}
        </div>

        {/* Quit button */}
        <div className="flex justify-center">
          <SkeletonBar className="h-5 w-20" tone={100} />
        </div>
      </div>
    </ContentContainer>
  );
}
