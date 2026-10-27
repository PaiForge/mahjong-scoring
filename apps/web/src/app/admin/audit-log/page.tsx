import { getTranslations } from "next-intl/server";

import { createAdminClient } from "../../../lib/supabase/admin";
import {
  AdminLogPageLayout,
  logSearchParamsCache,
} from "../_components/admin-log-page-layout";
import { requireAdminPage } from "../_lib/auth";
import { ContentActionKind } from "../_lib/content-action";
import { ModerationActionKind } from "../users/_lib/moderation";

import { AuditLogRow } from "./_components/audit-log-row";
import { fetchAuditLogPageData } from "./_lib/queries";

/**
 * 監査ログページ
 *
 * @description 管理者の操作履歴（利用者への BAN / 通報対応 / 特典と、広告・
 * お知らせ・トラッキング ID への操作）を 1 本の時系列で表示する。
 * @flow フィルタ条件を指定 → テーブルに結果表示 → ページネーションで遷移
 */
export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();

  const {
    page,
    action: actionFilter,
    user: rawUser,
  } = await logSearchParamsCache.parse(searchParams);
  const t = await getTranslations("admin");
  const adminClient = createAdminClient();
  const userFilter = rawUser.trim();

  const { logs, currentPage, totalPages, profileMap, emailMap } =
    await fetchAuditLogPageData(adminClient, page, actionFilter, userFilter);

  return (
    <AdminLogPageLayout
      title={t("auditLog")}
      basePath="/admin/audit-log"
      actionFilter={actionFilter}
      userFilter={userFilter}
      filterActionOptions={
        <>
          {[
            ...Object.values(ModerationActionKind),
            ...Object.values(ContentActionKind),
          ].map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </>
      }
      i18n={{
        filterByAction: t("auditLogTable.filterByAction"),
        allActions: t("auditLogTable.allActions"),
        filterByUser: t("auditLogTable.filterByUser"),
        filter: t("auditLogTable.filter"),
        userFilterPlaceholder: t("auditLogTable.userFilterPlaceholder"),
      }}
      columns={[
        { label: t("auditLogTable.action") },
        { label: t("auditLogTable.target") },
        { label: t("auditLogTable.actor") },
        { label: t("auditLogTable.reason") },
        { label: t("auditLogTable.metadata") },
        { label: t("auditLogTable.ipAddress") },
        { label: t("auditLogTable.timestamp") },
      ]}
      currentPage={currentPage}
      totalPages={totalPages}
      isEmpty={logs.length === 0}
      emptyLabel={t("auditLogTable.noLogsFound")}
    >
      {logs.map((log) => (
        <AuditLogRow
          key={log.id}
          log={log}
          profileMap={profileMap}
          emailMap={emailMap}
        />
      ))}
    </AdminLogPageLayout>
  );
}
