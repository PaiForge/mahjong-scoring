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
 * （件数を知っている側が `resolvePagination` で扱う）。
 *
 * @param raw - `searchParams.page` の値
 */
export function parsePageParam(raw: string | string[] | undefined): number {
  const page = typeof raw === "string" ? parseInt(raw, 10) : 1;
  return Number.isFinite(page) && page > 0 ? page : 1;
}

/**
 * 要求されたページ番号を 1〜最終ページに丸める
 * ページ番号丸め
 *
 * 件数が減った後の古いリンク（3 件しかないのに `?page=9`）を最終ページに
 * 寄せる。件数が 0 でも 1 ページ目を返す。
 *
 * @param requested - 要求されたページ番号（1始まり）
 * @param totalPages - 総ページ数（0 は 1 ページ扱い）
 */
export function clampPage(requested: number, totalPages: number): number {
  return Math.max(1, Math.min(requested, totalPages));
}

/**
 * 要求されたページを件数で確定し、そのページの取り出し位置を返す
 * ページ確定
 *
 * 範囲外のページ（3 件しかないのに `?page=9`）は最終ページに丸め、
 * 件数が 0 でも 1 ページ目にする。「件数を知ってからページを決める」側
 * （通知・チャレンジ履歴・ランキング・お知らせ・管理画面の一覧）はこれを通し、
 * 丸めの規則を取得関数ごとに書き起こさない — 書き起こすと規則を直した
 * ときに片側だけが直る。
 *
 * @param requestedPage - 要求されたページ番号（1始まり。上限に丸める前の値）
 * @param totalCount - 全件数
 * @param pageSize - 1ページあたりの表示件数
 */
export function resolvePagination(
  requestedPage: number,
  totalCount: number,
  pageSize = DEFAULT_PAGE_SIZE,
): PaginationData {
  const lastPage = getPaginationData(1, totalCount, pageSize).totalPages;
  return getPaginationData(
    clampPage(requestedPage, lastPage),
    totalCount,
    pageSize,
  );
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
 * 最終ページには丸めない。件数を数える前に要求されたページの取り出し位置
 * だけ先に出す（件数と行を並行して引く）ときに使い、ページの確定は
 * `resolvePagination` で行う。
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
