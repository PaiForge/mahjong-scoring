"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { PRACTICE_SCROLL_ANCHOR_ID } from "../../_lib/scroll-anchor";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

interface ScoreBoardSkeletonFrameProps {
  /** 見出し（`title`）を引く辞書の namespace */
  readonly translationNamespace: "score" | "machiScore";
  /** 盤面の直下に置く回答欄のスケルトン（練習ごとに形が違う） */
  readonly children: ReactNode;
}

/**
 * 点数の無限訓練（和了形の点数計算・聴牌形の点数計算）のプレイ画面スケルトンの外枠
 * 無限訓練ボードスケルトン
 *
 * 見出し・出題の盤面・正解 / 不正解カウンタ・わからない / 終了する の並びは
 * 両練習で同じなので、ここで持つ。回答欄だけを `children` で受け取る。
 * 本体と同じ ContentContainer・space-y 構成を保つことで、実コンテンツ表示時の
 * CLS を防ぐ。`fillViewport` も本体と揃える（スクロール先の id がカード領域に
 * 付く位置を変えないため）。PageTitle は静的なため実際のタイトルを表示する。
 */
export function ScoreBoardSkeletonFrame({
  translationNamespace,
  children,
}: ScoreBoardSkeletonFrameProps) {
  const t = useTranslations(translationNamespace);

  return (
    <ContentContainer id={PRACTICE_SCROLL_ANCHOR_ID} fillViewport>
      <PageTitle>{t("title")}</PageTitle>

      <div className="space-y-4 sm:space-y-6 md:space-y-8" aria-hidden>
        {/* Question: 状況行 + 手牌が入る盤面ひと枠ぶんの高さ。
            盤面は <sm で左右と上を詰めてカードの縁に付くため、同じ
            `-mx-4 -mt-4` で位置と幅を合わせる
            （角丸は radius が段階を持たないため <sm では実物より丸い） */}
        <SkeletonBar
          radius="xl"
          className="-mx-4 -mt-4 h-36 sm:mx-0 sm:mt-4"
          tone={100}
        />

        {children}

        {/* Footer: 正解 / 不正解 カウンタ */}
        <div className="flex items-center justify-center gap-12">
          {["correct", "incorrect"].map((k) => (
            <div key={k} className="flex items-center gap-3">
              <SkeletonBar radius="full" className="h-8 w-8" tone={100} />
              <SkeletonBar className="h-6 w-6" tone={100} />
            </div>
          ))}
        </div>

        {/* Footer actions: わからない / 終了する（本体の gap-3 に合わせる） */}
        <div className="flex flex-col items-center gap-3">
          <SkeletonBar className="h-5 w-20" tone={100} />
          <SkeletonBar className="h-5 w-20" tone={100} />
        </div>
      </div>
    </ContentContainer>
  );
}
