import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { ArrowUturnLeftIcon } from "@/app/(user)/_components/icons/arrow-uturn-left-icon";
import { RotateCcwIcon } from "@/app/(user)/_components/icons/rotate-ccw-icon";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";
import type { PracticeResultViewProps } from "../_lib/create-practice-result-page";
import {
  buildResultBreadcrumb,
  resultBreadcrumbParent,
} from "../_lib/result-breadcrumb";
import { PRACTICE_SCROLL_HASH } from "../_lib/scroll-anchor";
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
 * 子要素の `ResultScoreBar` も Server Component であり、`getTranslations` で
 * 翻訳を取得する。
 *
 * 表示順:
 * 1. PageTitle（練習名） — 即時描画
 * 2. 「結果」セクション（ScoreBar） — 即時描画（親 page.tsx の searchParams から props で受け取る）
 * 3. `promotionBlock` — 昇級バナー（昇級時のみ。Suspense 境界）
 * 4. `resultBlock` — 経験値 / 登録 CTA（Suspense 境界）
 * 5. アクションボタン（もう一度 / 設定を変更する）と練習一覧へのリンク — 即時描画
 * 6. `children` — 練習種別固有の追加コンテンツ（問題別フィードバック等）
 * 7. `leaderboardBlock` — リーダーボードプレビュー（Suspense 境界）
 */
export async function ResultView({
  practiceTitle,
  playHref,
  introHref,
  settingsHref,
  correct,
  total,
  promotionBlock,
  resultBlock,
  leaderboardBlock,
  children,
}: PracticeResultViewProps) {
  const tc = await getTranslations("challenge");
  // 親一覧（練習一覧 or 道場）。昇級試験の結果は道場へ帰す
  const parent = resultBreadcrumbParent(introHref);
  const tParent = await getTranslations(parent.namespace);

  return (
    <ContentContainer
      breadcrumb={buildResultBreadcrumb({
        parentLabel: tParent("title"),
        parentHref: parent.href,
        practiceTitle,
        resultLabel: tc("resultSuffix"),
        introHref,
      })}
    >
      <PageTitle>{practiceTitle}</PageTitle>

      {/* カード内のセクション間マージンは space-y で等間隔に統一する */}
      <div className="space-y-8">
        <section className="space-y-3">
          <SectionTitle>{tc("resultSectionTitle")}</SectionTitle>
          <ResultScoreBar correct={correct} total={total} />
        </section>

        {/* 昇級バナー: 今回の保存で段級位が付与されたときだけ現れる（Suspense 境界） */}
        {promotionBlock}

        {/* 結果ブロック: 経験値 / 登録 CTA。Suspense + ResultBlockSkeleton で包まれている。 */}
        {resultBlock}

        {/* アクションボタン。参考プロジェクト準拠で縦積み・全幅。
            「設定を変更する」は出題設定を持つ練習だけに出る（`settingsHref`）。
            練習一覧へは戻り先であって次の行動ではないため、ボタンではなく
            ボタン群の下の補助リンクに置く。

            余白は入れ子の gap で表す。内側 gap-3 がボタン同士のリズム、
            外側 gap-4 が「ボタン群 → 補助リンク」の境界。リンク側に
            padding を足して差を作らない（SUB_LINK_GAP 参照）。 */}
        <div className={`flex flex-col ${SUB_LINK_GAP}`}>
          <div className="flex flex-col gap-3">
            <LinkButton
              href={`${playHref}${PRACTICE_SCROLL_HASH}`}
              size="lg"
              fullWidth
            >
              <RotateCcwIcon className="size-4" />
              {tc("retryButton")}
            </LinkButton>
            {settingsHref !== undefined && (
              <LinkButton
                href={settingsHref}
                variant="neutral"
                size="lg"
                fullWidth
              >
                <ArrowUturnLeftIcon className="size-4" />
                {tc("changeSettingsButton")}
              </LinkButton>
            )}
          </div>
          <p className="text-center">
            <Link href={parent.href} className={`text-sm ${TEXT_LINK_CLASSES}`}>
              {tc(parent.namespace === "dojo" ? "backToDojo" : "backToList")}
            </Link>
          </p>
        </div>

        {/* 練習種別固有の追加コンテンツ（問題別フィードバック一覧など） */}
        {children}

        {/* リーダーボードプレビュー。Suspense + LeaderboardSkeleton で包まれている。 */}
        {leaderboardBlock}
      </div>
    </ContentContainer>
  );
}
