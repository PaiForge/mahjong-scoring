import { getTranslations } from 'next-intl/server';

import { createAdminClient } from '../../../lib/supabase/admin';
import { AdminLogPageLayout, logSearchParamsCache } from '../_components/admin-log-page-layout';

import { ActivityLogRow } from './_components/activity-log-row';
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
        logs.map((log) => (
          <ActivityLogRow
            key={log.id}
            log={log}
            profileMap={profileMap}
            emailMap={emailMap}
          />
        ))
      )}
    </AdminLogPageLayout>
  );
}
