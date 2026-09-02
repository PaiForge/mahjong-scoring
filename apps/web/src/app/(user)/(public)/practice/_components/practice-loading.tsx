"use client";

import { usePathname } from "next/navigation";

import { useTranslations } from "next-intl";

import { PageSkeleton } from "@/app/(user)/_components/page-skeleton";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";
import { practiceMenuBySlug } from "@/lib/db/practice-menu-types";
import { rankRequiringMenu } from "@/lib/ranks/registry";
import {
  ExamIntroSkeleton,
  type ExamDemoHeight,
} from "../../exam/_components/exam-intro-skeleton";
import {
  practiceHref,
  practicePlayHref,
  practiceResultHref,
  practiceTrainingHref,
} from "../_lib/practice-catalog";
import { PracticePlayLoadingFallback } from "./practice-play-loading-fallback";
import { BOARD_HEIGHT_BY_SLUG } from "../_lib/board-area-height";
import { PracticeResultLoadingFallback } from "./practice-result-loading-fallback";

interface Props {
  /** ルートスラッグ（例: "machi-fu"）。loading.tsx を置いたディレクトリと揃える */
  readonly slug: PracticeMenuSlug;
  /**
   * 昇級試験の説明ページに出す問題方式のプレビューの高さ。
   * デモは試験ごとに違うため、そのルートの loading.tsx が指定する。
   */
  readonly demoHeight?: ExamDemoHeight;
}

/**
 * 練習ルート（`/practice/<slug>/`）共通のローディングフォールバック
 * 練習ローディング
 *
 * `/practice/<slug>/loading.tsx` は説明・play・training・result の 4 つの子スロット
 * それぞれを Suspense で包む唯一の境界になる。遷移先ごとに実物と同じ形の
 * スケルトンへ振り分ける。
 *
 * - result: 結果ページと同じ形（`PracticeResultLoadingFallback`）
 * - play / training: 解いている画面と同じ形（`PracticePlayLoadingFallback`）
 * - 昇級試験の説明: 試験の説明ページと同じ形（`ExamIntroSkeleton`）。汎用の
 *   `PageSkeleton` は読み物の形で、問題方式のプレビューだけで 250px ある
 *   試験の説明ページとは高さが 2〜3 倍ずれる
 * - それ以外: 汎用スケルトン
 *
 * result 直下に `loading.tsx` を置かない理由は `loading-boundaries.test.ts` 参照
 * （境界が入れ子になり、プリフェッチが外側しか取らないため内側が機能しない）。
 * pathname で振り分けるためクライアントコンポーネント。
 */
export function PracticeLoading({ slug, demoHeight }: Props) {
  const pathname = usePathname();
  const menu = practiceMenuBySlug(slug);
  const t = useTranslations(menu.namespace);

  const isResult = new RegExp(`^${practiceResultHref(slug)}/?$`).test(pathname);
  if (isResult) {
    return <PracticeResultLoadingFallback slug={slug} />;
  }

  // 解いている画面。見出しは実物と同じ練習名を出す
  const isPlaying = [practicePlayHref(slug), practiceTrainingHref(slug)].some(
    (href) => new RegExp(`^${href}/?$`).test(pathname),
  );
  if (isPlaying) {
    return (
      <PracticePlayLoadingFallback
        practiceTitle={t("title")}
        mistakeLimit={menu.mistakeLimit}
        boardHeight={BOARD_HEIGHT_BY_SLUG[slug]}
      />
    );
  }

  // 昇級試験の説明ページ。前提章の数は段級位レジストリが持つため、
  // 章の行数まで実物と揃う
  const isIntro = new RegExp(`^${practiceHref(slug)}/?$`).test(pathname);
  const exam = rankRequiringMenu(menu.menuType);
  if (isIntro && exam) {
    return (
      <ExamIntroSkeleton
        demoHeight={demoHeight}
        chapterCount={exam.rank.learnChapterSlugs.length}
      />
    );
  }

  return <PageSkeleton />;
}
