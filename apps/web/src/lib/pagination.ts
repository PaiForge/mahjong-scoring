/**
 * ページネーションユーティリティ
 *
 * アプリ全体で使い回す汎用ページネーション関数。
 */

export const DEFAULT_PAGE_SIZE = 20;

/**
 * クエリ文字列の `?page=` をページ番号として読む
 * ページ番号の解釈
 *
 * 未指定・配列・数値として読めない値・0 以下は 1 ページ目。上限には丸めない
 * （件数を知っている側が `getPaginationData` 等で扱う）。
 *
 * @param raw - `searchParams.page` の値
 */
export function parsePageParam(raw: string | string[] | undefined): number {
  const page = typeof raw === "string" ? parseInt(raw, 10) : 1;
  return Number.isFinite(page) && page > 0 ? page : 1;
}

/** ページネーション算出結果 */
interface PaginationData {
  currentPage: number;
  totalPages: number;
  limit: number;
  offset: number;
}

/**
 * ページネーションパラメータを算出する。
 *
 * @param page - リクエストされたページ番号（1始まり）
 * @param totalCount - 全件数
 * @param pageSize - 1ページあたりの表示件数
 */
export function getPaginationData(
  page: number,
  totalCount: number,
  pageSize = DEFAULT_PAGE_SIZE,
): PaginationData {
  const currentPage = Math.max(1, page);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const limit = pageSize;
  const offset = (currentPage - 1) * pageSize;

  return { currentPage, totalPages, limit, offset };
}
