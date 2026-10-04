import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";

/**
 * 目次（`/learn`）の章の行に付ける id
 * 目次アンカー id
 *
 * 章の抜粋から「目次へ」で抜けた人を、目次の中の同じ章の位置に着地させる
 * ためのもの。id を持つのは `/learn` の目次だけで、抜粋（練習・道場・
 * ダッシュボード）の章の行には付けない — 同じページに同じ章が 2 度並ぶと
 * id が重複する。
 */
export function chapterTocAnchorId(slug: CurriculumChapterSlug): string {
  return `chapter-${slug}`;
}

/** 目次の、その章の行へ着地するパス */
export function chapterTocHref(slug: CurriculumChapterSlug): string {
  return `/learn#${chapterTocAnchorId(slug)}`;
}
