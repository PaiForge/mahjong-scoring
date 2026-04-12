import { getTranslations } from 'next-intl/server';

import { createAdminClient } from '../../../lib/supabase/admin';
import { AdminLogPageLayout, logSearchParamsCache } from '../_components/admin-log-page-layout';

import { fetchActivityLogPageData } from './_lib/queries';

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
  const { page, action: actionFilter, user: rawUser } = await logSearchParamsCache.parse(searchParams);
  const t = await getTranslations('admin');
  const adminClient = createAdminClient();
  const userFilter = rawUser.trim();

  const { logs, currentPage, totalPages, profileMap, emailMap, actionTypes } =
    await fetchActivityLogPageData(adminClient, page, actionFilter, userFilter);

  return (
    <AdminLogPageLayout
      title={t('activityLog')}
      basePath="/admin/activity-log"
      actionFilter={actionFilter}
      userFilter={userFilter}
      filterActionOptions={actionTypes.map((at) => (
        <option key={at.action} value={at.action}>
          {at.action}
        </option>
      ))}
      i18n={{
        filterByAction: t('activityLogTable.filterByAction'),
        allActions: t('activityLogTable.allActions'),
        filterByUser: t('activityLogTable.filterByUser'),
        filter: t('activityLogTable.filter'),
        userFilterPlaceholder: t('activityLogTable.userFilterPlaceholder'),
      }}
      columns={[
        { label: t('activityLogTable.action') },
        { label: t('activityLogTable.username') },
        { label: t('activityLogTable.target') },
        { label: t('activityLogTable.metadata') },
        { label: t('activityLogTable.timestamp') },
      ]}
      currentPage={currentPage}
      totalPages={totalPages}
    >
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
    </AdminLogPageLayout>
  );
}
