import { getTranslations } from 'next-intl/server';

import { createSearchParamsCache, parseAsInteger, parseAsString } from 'nuqs/server';

import { PageTitle } from '@/app/_components/page-title';
import { PaginationNav } from '@/app/_components/pagination-nav';
import { createAdminClient } from '../../../lib/supabase/admin';

import { fetchAuditLogPageData } from './_lib/queries';

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  action: parseAsString.withDefault(''),
  user: parseAsString.withDefault(''),
});

/**
 * 監査ログページ
 *
 * @description 管理者の操作履歴（BAN / BAN解除など）を時系列で表示する。
 * @flow フィルタ条件を指定 → テーブルに結果表示 → ページネーションで遷移
 */
export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page, action: actionFilter, user: rawUser } = await searchParamsCache.parse(searchParams);
  const t = await getTranslations('admin');
  const adminClient = createAdminClient();
  const userFilter = rawUser.trim();

  const { logs, currentPage, totalPages, profileMap, emailMap } =
    await fetchAuditLogPageData(adminClient, page, actionFilter, userFilter);

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (actionFilter) params.set('action', actionFilter);
    if (userFilter) params.set('user', userFilter);
    return `/admin/audit-log?${params.toString()}`;
  };

  return (
    <div>
      <PageTitle className="mb-6">{t('auditLog')}</PageTitle>

      {/* フィルタ */}
      <form className="mb-6 flex items-end gap-4">
        <div>
          <label htmlFor="action-filter" className="mb-1 block text-sm font-medium">
            {t('auditLogTable.filterByAction')}
          </label>
          <select
            id="action-filter"
            name="action"
            defaultValue={actionFilter}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">{t('auditLogTable.allActions')}</option>
            <option value="ban">ban</option>
            <option value="unban">unban</option>
          </select>
        </div>
        <div>
          <label htmlFor="user-filter" className="mb-1 block text-sm font-medium">
            {t('auditLogTable.filterByUser')}
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
          {t('auditLogTable.filter')}
        </button>
      </form>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 font-medium">{t('auditLogTable.action')}</th>
              <th className="px-4 py-3 font-medium">{t('auditLogTable.target')}</th>
              <th className="px-4 py-3 font-medium">{t('auditLogTable.actor')}</th>
              <th className="px-4 py-3 font-medium">{t('auditLogTable.reason')}</th>
              <th className="px-4 py-3 font-medium">{t('auditLogTable.ipAddress')}</th>
              <th className="px-4 py-3 font-medium">{t('auditLogTable.timestamp')}</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {t('auditLogTable.noLogsFound')}
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const targetProfile = profileMap.get(log.targetId);
                const targetDisplay =
                  targetProfile?.username ?? emailMap.get(log.targetId) ?? log.targetId;
                const actorDisplay = emailMap.get(log.actorId) ?? log.actorId;

                return (
                  <tr key={log.id} className="border-t border-gray-200">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          log.action === 'ban'
                            ? 'bg-red-100 text-red-700'
                            : log.action === 'unban'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">{targetDisplay}</td>
                    <td className="px-4 py-3 text-gray-500">{actorDisplay}</td>
                    <td className="px-4 py-3">
                      {log.reason ? (
                        <span title={log.reason}>
                          {log.reason.length > 50 ? `${log.reason.slice(0, 50)}...` : log.reason}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{log.ipAddress ?? '-'}</td>
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
