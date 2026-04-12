import type { ReactNode } from 'react';

import { createSearchParamsCache, parseAsInteger, parseAsString } from 'nuqs/server';

import { PageTitle } from '../../_components/page-title';
import { PaginationNav } from '../../_components/pagination-nav';

/**
 * 管理画面ログページ共通の検索パラメータキャッシュ（ログ検索パラメータ）
 *
 * `page` / `action` / `user` の 3 パラメータを共通化。
 */
export const logSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  action: parseAsString.withDefault(''),
  user: parseAsString.withDefault(''),
});

/** テーブルのカラム定義（列ヘッダ） */
interface ColumnDef {
  /** i18n 済みの表示ラベル */
  readonly label: string;
}

/** 管理画面ログページ共通レイアウトの Props */
interface AdminLogPageLayoutProps {
  /** ページタイトル（i18n 済み文字列） */
  readonly title: string;
  /** ページネーションリンクのベースパス（例: `/admin/activity-log`） */
  readonly basePath: string;
  /** 現在のアクションフィルタ値 */
  readonly actionFilter: string;
  /** 現在のユーザーフィルタ値 */
  readonly userFilter: string;
  /** アクションフィルタの select 内 option 要素群 */
  readonly filterActionOptions: ReactNode;
  /** フィルタラベル・プレースホルダ用 i18n キー群 */
  readonly i18n: {
    readonly filterByAction: string;
    readonly allActions: string;
    readonly filterByUser: string;
    readonly filter: string;
    readonly userFilterPlaceholder: string;
  };
  /** テーブルカラム定義 */
  readonly columns: readonly ColumnDef[];
  /** ログ行の描画（テーブルボディの中身） */
  readonly children: ReactNode;
  /** 現在のページ番号 */
  readonly currentPage: number;
  /** 総ページ数 */
  readonly totalPages: number;
}

/**
 * 管理画面ログページ共通レイアウト（管理ログ共通テンプレート）
 *
 * アクティビティログ・監査ログなど、フィルタ + テーブル + ページネーションの
 * 共通構造を提供するサーバーコンポーネント。
 */
export function AdminLogPageLayout({
  title,
  basePath,
  actionFilter,
  userFilter,
  filterActionOptions,
  i18n,
  columns,
  children,
  currentPage,
  totalPages,
}: AdminLogPageLayoutProps) {
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (actionFilter) params.set('action', actionFilter);
    if (userFilter) params.set('user', userFilter);
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div>
      <PageTitle className="mb-6">{title}</PageTitle>

      {/* フィルタ */}
      <form className="mb-6 flex items-end gap-4">
        <div>
          <label htmlFor="action-filter" className="mb-1 block text-sm font-medium">
            {i18n.filterByAction}
          </label>
          <select
            id="action-filter"
            name="action"
            defaultValue={actionFilter}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">{i18n.allActions}</option>
            {filterActionOptions}
          </select>
        </div>
        <div>
          <label htmlFor="user-filter" className="mb-1 block text-sm font-medium">
            {i18n.filterByUser}
          </label>
          <input
            id="user-filter"
            name="user"
            type="text"
            defaultValue={userFilter}
            placeholder={i18n.userFilterPlaceholder}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-900 transition-colors"
        >
          {i18n.filter}
        </button>
      </form>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col) => (
                <th key={col.label} className="px-4 py-3 font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>

      <PaginationNav
        currentPage={currentPage}
        totalPages={totalPages}
        buildHref={buildHref}
      />
    </div>
  );
}
