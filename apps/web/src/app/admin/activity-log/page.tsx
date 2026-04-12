import { getTranslations } from 'next-intl/server';

import { createSearchParamsCache, parseAsInteger, parseAsString } from 'nuqs/server';

import { PageTitle } from '@/app/_components/page-title';
import { PaginationNav } from '@/app/_components/pagination-nav';
import { createAdminClient } from '../../../lib/supabase/admin';

import { fetchActivityLogPageData } from './_lib/queries';

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  action: parseAsString.withDefault(''),
  user: parseAsString.withDefault(''),
});

/**
 * アクティビティログページ
 *
 * @description ユーザーの行動履歴（ログイン・ログアウト等）を時系列で表示する。
 * @flow フィルタ条件を指定 → テーブルに結果表示 → ページネーションで遷移
 */
export default async function AdminActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page, action: actionFilter, user: rawUser } = await searchParamsCache.parse(searchParams);
  const t = await getTranslations('admin');
  const adminClient = createAdminClient();
  const userFilter = rawUser.trim();

  const { logs, currentPage, totalPages, profileMap, emailMap, actionTypes } =
    await fetchActivityLogPageData(adminClient, page, actionFilter, userFilter);

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (actionFilter) params.set('action', actionFilter);
    if (userFilter) params.set('user', userFilter);
    return `/admin/activity-log?${params.toString()}`;
  };

  return (
    <div>
      <PageTitle className="mb-6">{t('activityLog')}</PageTitle>

      {/* フィルタ */}
      <form className="mb-6 flex items-end gap-4">
        <div>
          <label htmlFor="action-filter" className="mb-1 block text-sm font-medium">
            {t('activityLogTable.filterByAction')}
          </label>
          <select
            id="action-filter"
            name="action"
            defaultValue={actionFilter}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">{t('activityLogTable.allActions')}</option>
            {actionTypes.map((at) => (
              <option key={at.action} value={at.action}>
                {at.action}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="user-filter" className="mb-1 block text-sm font-medium">
            {t('activityLogTable.filterByUser')}
          </label>
          <input
            id="user-filter"
            name="user"
            type="text"
            defaultValue={userFilter}
            placeholder="email or username"
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-900 transition-colors"
        >
          {t('activityLogTable.filter')}
        </button>
      </form>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 font-medium">{t('activityLogTable.action')}</th>
              <th className="px-4 py-3 font-medium">{t('activityLogTable.username')}</th>
              <th className="px-4 py-3 font-medium">{t('activityLogTable.target')}</th>
              <th className="px-4 py-3 font-medium">{t('activityLogTable.metadata')}</th>
              <th className="px-4 py-3 font-medium">{t('activityLogTable.timestamp')}</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  {t('activityLogTable.noLogsFound')}
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const profile = profileMap.get(log.userId);
                const userDisplay =
                  profile?.username ?? emailMap.get(log.userId) ?? log.userId;
                const targetDisplay = log.targetId
                  ? (profileMap.get(log.targetId)?.username ??
                      emailMap.get(log.targetId) ??
                      log.targetId)
                  : '-';

                return (
                  <tr key={log.id} className="border-t border-gray-200">
                    <td className="px-4 py-3">
                      <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">{userDisplay}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {log.targetType ? `${log.targetType}: ${targetDisplay}` : targetDisplay}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <code className="text-xs">
                          {JSON.stringify(log.metadata).slice(0, 80)}
                        </code>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(log.createdAt).toLocaleString('ja-JP')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
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
