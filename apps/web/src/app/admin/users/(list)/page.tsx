import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { formatAdminDate } from "@/app/admin/_lib/format-date";
import { buildProfileMap } from "@/app/admin/_lib/log-query-helpers";
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

import { getPaginationData } from "@/lib/pagination";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaginationNav } from "@/app/(user)/_components/pagination-nav";

import { MaskedEmail } from "@/app/admin/_components/masked-email";
import { TableEmptyRow } from "@/app/admin/_components/table-empty-row";

import { PublicProfileLink } from "../_components/public-profile-link";
import { StatusBadge } from "../_components/status-badge";
import { UserSearchForm } from "../_components/user-search-form";
import { fetchUsersPageData } from "../_lib/queries";
import { UserStatus, resolveUserStatus } from "../_lib/user-status";

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  user: parseAsString.withDefault(""),
});

/** ユーザー一覧テーブルの列数（メール・ユーザー名・表示名・状態・登録日・詳細） */
const USER_TABLE_COLUMN_COUNT = 6;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();

  const { page, user: rawQuery } = await searchParamsCache.parse(searchParams);
  const query = rawQuery.trim();
  const adminClient = createAdminClient();
  const t = await getTranslations("admin");

  const { users, totalCount } = await fetchUsersPageData(
    adminClient,
    page,
    query,
  );

  const pagination = getPaginationData(page, totalCount);

  const profileMap = await buildProfileMap(users.map((u) => u.id));

  const emailLabels = {
    revealEmail: t("usersTable.revealEmail"),
    hideEmail: t("usersTable.hideEmail"),
  };

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    params.set("page", String(p));
    if (query) params.set("user", query);
    return `/admin/users?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <AdminPageTitle>{t("users")}</AdminPageTitle>

      <UserSearchForm query={query} totalCount={totalCount} />

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 font-medium whitespace-nowrap">
                {t("usersTable.email")}
              </th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">
                {t("usersTable.username")}
              </th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">
                {t("usersTable.displayName")}
              </th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">
                {t("usersTable.status")}
              </th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">
                {t("usersTable.createdAt")}
              </th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">
                {t("usersTable.detail")}
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
                const status = resolveUserStatus(profile);
                return (
                  <tr key={user.id} className="border-t border-gray-200">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <MaskedEmail email={user.email} labels={emailLabels} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {status === UserStatus.Active && profile ? (
                        <PublicProfileLink username={profile.username} />
                      ) : (
                        (profile?.username ?? "-")
                      )}
                    </td>
                    <td className="px-4 py-3">{profile?.displayName ?? "-"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatAdminDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className={TEXT_LINK_CLASSES}
                      >
                        {t("usersTable.detail")}
                      </Link>
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
