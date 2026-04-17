import { getTranslations } from 'next-intl/server';

import { createAdminClient } from '../../../lib/supabase/admin';
import { AdminLogPageLayout, logSearchParamsCache } from '../_components/admin-log-page-layout';

import { AuditLogRow } from './_components/audit-log-row';
import { fetchAuditLogPageData } from './_lib/queries';

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
  const { page, action: actionFilter, user: rawUser } = await logSearchParamsCache.parse(searchParams);
  const t = await getTranslations('admin');
  const adminClient = createAdminClient();
  const userFilter = rawUser.trim();

  const { logs, currentPage, totalPages, profileMap, emailMap } =
    await fetchAuditLogPageData(adminClient, page, actionFilter, userFilter);

  return (
    <AdminLogPageLayout
      title={t('auditLog')}
      basePath="/admin/audit-log"
      actionFilter={actionFilter}
      userFilter={userFilter}
      filterActionOptions={
        <>
          <option value="ban">ban</option>
          <option value="unban">unban</option>
        </>
      }
      i18n={{
        filterByAction: t('auditLogTable.filterByAction'),
        allActions: t('auditLogTable.allActions'),
        filterByUser: t('auditLogTable.filterByUser'),
        filter: t('auditLogTable.filter'),
        userFilterPlaceholder: t('auditLogTable.userFilterPlaceholder'),
      }}
      columns={[
        { label: t('auditLogTable.action') },
        { label: t('auditLogTable.target') },
        { label: t('auditLogTable.actor') },
        { label: t('auditLogTable.reason') },
        { label: t('auditLogTable.ipAddress') },
        { label: t('auditLogTable.timestamp') },
      ]}
      currentPage={currentPage}
      totalPages={totalPages}
    >
      {logs.length === 0 ? (
        <tr>
          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
            {t('auditLogTable.noLogsFound')}
          </td>
        </tr>
      ) : (
        logs.map((log) => (
          <AuditLogRow
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
