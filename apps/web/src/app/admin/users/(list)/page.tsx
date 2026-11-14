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

import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPaginationNav } from "@/app/admin/_components/admin-pagination-nav";

import { MaskedEmail } from "@/app/admin/_components/masked-email";
import { TableEmptyRow } from "@/app/admin/_components/table-empty-row";
import { TableHead } from "@/app/admin/_components/table-head";

import { LoginProviderIcons } from "../_components/login-provider-icons";
import { PlanChipLink } from "../_components/plan-chip";
import { PublicProfileLink } from "../_components/public-profile-link";
import { StatusBadge } from "../_components/status-badge";
import { UserSearchForm } from "../_components/user-search-form";
import { readLoginProviders } from "../_lib/login-providers";
import { fetchPlanStatusMap, fetchUsersPageData } from "../_lib/queries";
import { USER_TABLE_COLUMNS } from "../_lib/table-columns";
import { UserStatus, resolveUserStatus } from "../_lib/user-status";

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  user: parseAsString.withDefault(""),
});

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

  const { users, totalCount, currentPage, totalPages } =
    await fetchUsersPageData(adminClient, page, query);

  const now = new Date();
  const userIds = users.map((u) => u.id);
  const [profileMap, planStatusMap] = await Promise.all([
    buildProfileMap(userIds),
    fetchPlanStatusMap(userIds, now),
  ]);

  const emailLabels = {
    revealEmail: t("usersTable.revealEmail"),
    hideEmail: t("usersTable.hideEmail"),
  };

  const providerLabels = {
    email: t("userDetail.account.providers.email"),
    google: t("userDetail.account.providers.google"),
    apple: t("userDetail.account.providers.apple"),
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

      <div className="admin-table">
        <table className="w-full text-left text-sm">
          <TableHead
            labels={USER_TABLE_COLUMNS.map((key) => t(`usersTable.${key}`))}
          />
          <tbody>
            {users.length === 0 ? (
              <TableEmptyRow
                columnCount={USER_TABLE_COLUMNS.length}
                label={t("usersTable.noUsersFound")}
              />
            ) : (
              users.map((user) => {
                const profile = profileMap.get(user.id);
                const status = resolveUserStatus(profile, user, now);
                const plan = planStatusMap.get(user.id);
                return (
                  <tr key={user.id} className="border-t border-surface-200">
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
                    <td className="px-4 py-3">
                      {plan ? (
                        <PlanChipLink plan={plan} userId={user.id} />
                      ) : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <LoginProviderIcons
                        providers={readLoginProviders(user.app_metadata)}
                        labels={providerLabels}
                      />
                    </td>
                    <td className="px-4 py-3 text-surface-500">
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

      <AdminPaginationNav
        currentPage={currentPage}
        totalPages={totalPages}
        buildHref={buildHref}
      />
    </div>
  );
}
