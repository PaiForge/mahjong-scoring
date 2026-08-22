import { getTranslations } from "next-intl/server";

import type { User } from "@supabase/supabase-js";
import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { formatAdminDate } from "@/app/admin/_lib/format-date";
import { buildProfileMap } from "@/app/admin/_lib/log-query-helpers";
import { createSearchParamsCache, parseAsInteger } from "nuqs/server";

import { getOptionalUser } from "../../../lib/auth";
import { getPaginationData, DEFAULT_PAGE_SIZE } from "../../../lib/pagination";
import { createAdminClient } from "../../../lib/supabase/admin";
import { PaginationNav } from "@/app/(user)/_components/pagination-nav";

import { TableEmptyRow } from "../_components/table-empty-row";

import { StatusBadge } from "./_components/status-badge";
import { BanButton } from "./_components/ban-button";
import { UnbanButton } from "./_components/unban-button";

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
});

/** ユーザー一覧テーブルの列数（メール・ユーザー名・表示名・状態・登録日・操作） */
const USER_TABLE_COLUMN_COUNT = 6;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();

  const { page } = await searchParamsCache.parse(searchParams);
  const adminClient = createAdminClient();
  const t = await getTranslations("admin");

  // 現在のユーザー ID を取得（自分自身の BAN を防ぐため）
  const currentUser = await getOptionalUser();

  const { data: usersData, error } = await adminClient.auth.admin.listUsers({
    page,
    perPage: DEFAULT_PAGE_SIZE,
  });
  if (error) {
    // Next.js error boundary に委任する意図的な throw
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  const users: User[] = usersData.users ?? [];
  const totalCount = usersData.total ?? 0;

  const pagination = getPaginationData(page, totalCount);

  const profileMap = await buildProfileMap(users.map((u) => u.id));

  const buildHref = (p: number) => `/admin/users?page=${String(p)}`;

  return (
    <div className="space-y-6">
      <AdminPageTitle>{t("users")}</AdminPageTitle>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 font-medium">{t("usersTable.email")}</th>
              <th className="px-4 py-3 font-medium">
                {t("usersTable.username")}
              </th>
              <th className="px-4 py-3 font-medium">
                {t("usersTable.displayName")}
              </th>
              <th className="px-4 py-3 font-medium">
                {t("usersTable.status")}
              </th>
              <th className="px-4 py-3 font-medium">
                {t("usersTable.createdAt")}
              </th>
              <th className="px-4 py-3 font-medium">
                {t("usersTable.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <TableEmptyRow
                columnCount={USER_TABLE_COLUMN_COUNT}
                label={t("usersTable.noUsersFound")}
              />
            ) : (
              users.map((user) => {
                const profile = profileMap.get(user.id);
                const isBanned = profile?.bannedAt != null;
                const isCurrentUser = currentUser?.id === user.id;
                return (
                  <tr key={user.id} className="border-t border-gray-200">
                    <td className="px-4 py-3">{user.email ?? "-"}</td>
                    <td className="px-4 py-3">{profile?.username ?? "-"}</td>
                    <td className="px-4 py-3">{profile?.displayName ?? "-"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge isBanned={isBanned} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatAdminDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {!isCurrentUser &&
                        (isBanned ? (
                          <UnbanButton targetUserId={user.id} />
                        ) : (
                          <BanButton targetUserId={user.id} />
                        ))}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PaginationNav
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        buildHref={buildHref}
      />
    </div>
  );
}
