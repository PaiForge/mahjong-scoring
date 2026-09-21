"use client";

import { useTranslations } from "next-intl";

import { PracticePlayLoadingFallback } from "@/app/(user)/(public)/practice/_components/practice-play-loading-fallback";
import { BOARD_HEIGHT_BY_SLUG } from "@/app/(user)/(public)/practice/_lib/board-area-height";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";
import { practiceMenuBySlug } from "@/lib/db/practice-menu-types";

interface Props {
  /** 試験のスラッグ。loading.tsx を置いたディレクトリと揃える */
  readonly slug: PracticeMenuSlug;
}

/**
 * 昇級試験の出題画面（`/exam/<級>/play`）の読み込み中スケルトン
 * 試験出題ローディング
 *
 * 解いている画面と同じ形（`PracticePlayLoadingFallback`）を、実物と同じ試験名・
 * ミス上限・盤面の高さで描く。見出しを辞書から引くためクライアントコンポーネント。
 * 練習の play / training と模試は静的ルートで境界を持たないため、これを使うのは
 * 本番の試験だけ。
 */
export function ExamPlayLoading({ slug }: Props) {
  const menu = practiceMenuBySlug(slug);
  const t = useTranslations(menu.namespace);

  return (
    <PracticePlayLoadingFallback
      practiceTitle={t("title")}
      mistakeLimit={menu.mistakeLimit}
      boardHeight={BOARD_HEIGHT_BY_SLUG[slug]}
    />
  );
}
