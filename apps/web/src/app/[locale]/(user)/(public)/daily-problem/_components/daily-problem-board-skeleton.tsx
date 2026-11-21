"use client";

import { useTranslations } from "next-intl";

import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { useScrollToElement } from "@/app/[locale]/(user)/(public)/practice/_hooks/use-scroll-to-element";
import { PRACTICE_SCROLL_ANCHOR_ID } from "@/app/[locale]/(user)/(public)/practice/_lib/scroll-anchor";
import { ScoreAnswerFormSkeleton } from "@/app/[locale]/(user)/(public)/practice/agari-score/_components/agari-score-board-skeleton";

/**
 * 本日の問題の読み込み中スケルトン
 * 本日の問題スケルトン
 *
 * ページ（`page.tsx`）と同じ ContentContainer（スクロール先の id・`fillViewport`・
 * パンくず）と見出しに、盤面と回答欄の形を置く。本体に差し替わったときに
 * 位置もスクロールも動かないよう、和了形の点数計算のスケルトンと同じく
 * 描画の前に盤面の先頭へ送る（`useScrollToElement`）。
 *
 * 盤面は実物と同じく <sm でカードの上端と左右に密着させる（`-mx-4 -mt-4`）。
 * 回答欄は点数だけの形にする — 回答する項目は端末ローカルの設定で決まり、
 * ここでは読めないので、その設定の既定（点数だけを答える）に合わせる。
 */
export function DailyProblemBoardSkeleton() {
  const t = useTranslations("dailyProblem");
  useScrollToElement(PRACTICE_SCROLL_ANCHOR_ID);

  return (
    <ContentContainer
      id={PRACTICE_SCROLL_ANCHOR_ID}
      fillViewport
      breadcrumb={[{ label: t("title") }]}
    >
      <PageTitle>{t("title")}</PageTitle>
      <div className="space-y-4 sm:space-y-6 md:space-y-8" aria-hidden>
        <SkeletonBar
          radius="xl"
          className="-mx-4 -mt-4 h-36 sm:mx-0 sm:mt-4"
          tone={100}
        />
        <ScoreAnswerFormSkeleton requireHanFu={false} />
      </div>
    </ContentContainer>
  );
}
