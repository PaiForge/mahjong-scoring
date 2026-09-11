"use client";

import { useTranslations } from "next-intl";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { PRACTICE_SCROLL_ANCHOR_ID } from "../../_lib/scroll-anchor";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * プレイ画面のローディングスケルトン
 * 待ち別練習ボードスケルトン
 *
 * 本体（MachiScoreBoardInner の最初の段階 = 待ち牌の選択）と同じ
 * ContentContainer・space-y 構成を保ち、実コンテンツ表示時の CLS を防ぐ。
 * 盤面の枠の位置合わせは総合演習のスケルトンと同じ。
 */
export function MachiScoreBoardSkeleton() {
  const t = useTranslations("machiScore");

  return (
    <ContentContainer id={PRACTICE_SCROLL_ANCHOR_ID} fillViewport>
      <PageTitle>{t("title")}</PageTitle>

      <div className="space-y-4 sm:space-y-6 md:space-y-8" aria-hidden>
        {/* Question: 状況行 + 手牌が入る盤面ひと枠ぶんの高さ */}
        <SkeletonBar
          radius="xl"
          className="-mx-4 -mt-4 h-36 sm:mx-0 sm:mt-4"
          tone={100}
        />

        {/* 出題文 + 牌の一覧（種類ごとに 1 行、9 列） + 選択数 + 回答ボタン */}
        <div className="space-y-4">
          <SkeletonBar className="mx-auto h-5 w-48" tone={100} />
          <div className="space-y-2">
            {["manzu", "pinzu", "souzu", "jihai"].map((row) => (
              <div key={row} className="grid grid-cols-9 gap-1 sm:gap-2">
                {Array.from({ length: row === "jihai" ? 7 : 9 }, (_, i) => (
                  <SkeletonBar
                    key={i}
                    radius="lg"
                    className="min-h-12 sm:min-h-16"
                    tone={100}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <SkeletonBar className="mx-auto h-4 w-24" tone={100} />
            <SkeletonBar radius="lg" className="h-12 w-full" />
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

        {/* Footer actions: わからない / 終了する */}
        <div className="flex flex-col items-center gap-3">
          <SkeletonBar className="h-5 w-20" tone={100} />
          <SkeletonBar className="h-5 w-20" tone={100} />
        </div>
      </div>
    </ContentContainer>
  );
}
