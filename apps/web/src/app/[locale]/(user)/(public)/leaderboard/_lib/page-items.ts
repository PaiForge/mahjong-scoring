/** ページ送りに並べる 1 項目。数字のページか、間を詰めた省略記号 */
export type PageItem = number | "ellipsis";

/** 省略せずに並べられる中ほどのページ数（両端の 2 ページは別に必ず出す） */
const MAX_VISIBLE = 5;

/** `from` から `to` までの連番（両端を含む） */
function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}

/**
 * ページ送りに並べる項目
 *
 * 総ページ数が少なければ全ページを並べる。多いときは先頭・末尾・今のページと
 * その前後を残し、飛んだ区間を省略記号 1 つに詰める。
 */
export function buildPageItems(
  currentPage: number,
  totalPages: number,
): readonly PageItem[] {
  if (totalPages <= MAX_VISIBLE + 2) return range(1, totalPages);

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  return [
    1,
    ...(start > 2 ? (["ellipsis"] as const) : []),
    ...range(start, end),
    ...(end < totalPages - 1 ? (["ellipsis"] as const) : []),
    totalPages,
  ];
}
