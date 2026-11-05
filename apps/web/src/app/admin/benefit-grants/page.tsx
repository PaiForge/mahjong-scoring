import { getTranslations } from "next-intl/server";
import { createSearchParamsCache, parseAsInteger } from "nuqs/server";

import { AdminPaginationNav } from "@/app/admin/_components/admin-pagination-nav";
import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { TableEmptyRow } from "@/app/admin/_components/table-empty-row";
import { TableHead } from "@/app/admin/_components/table-head";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

import { BenefitGrantRow } from "./_components/benefit-grant-row";
import { fetchBenefitGrantsPageData } from "./_lib/queries";
import { BENEFIT_GRANT_TABLE_COLUMNS } from "./_lib/table-columns";

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
});

/**
 * 特典の手動付与一覧
 *
 * @description
 * Stripe の決済を伴わずに付けた Pro の特典（`benefit_grants`）を新しい順に
 * 並べ、有効な付与を取り消す。付与そのものはユーザー詳細（`/admin/users/[id]`）の
 * 「Pro 付与」から行う（付与先を選ぶ UI をここに重ねない）。
 * @flow 一覧で状態を見る → 有効な行の「取り消し」→ 理由を入れて確定
 */
export default async function AdminBenefitGrantsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();

  const { page } = await searchParamsCache.parse(searchParams);
  const t = await getTranslations("admin.benefitGrants");
  const { grants, currentPage, totalPages, profileMap, emailMap } =
    await fetchBenefitGrantsPageData(createAdminClient(), page);
  const now = new Date();

  const buildHref = (p: number) => `/admin/benefit-grants?page=${String(p)}`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <AdminPageTitle>{t("listTitle")}</AdminPageTitle>
        <p className="text-sm text-surface-600">{t("listDescription")}</p>
      </div>

      <div className="admin-table">
        <table className="w-full text-left text-sm">
          <TableHead
            labels={BENEFIT_GRANT_TABLE_COLUMNS.map((key) => t(`table.${key}`))}
          />
          <tbody>
            {grants.length === 0 ? (
              <TableEmptyRow
                columnCount={BENEFIT_GRANT_TABLE_COLUMNS.length}
                label={t("table.empty")}
              />
            ) : (
              grants.map((grant) => (
                <BenefitGrantRow
                  key={grant.id}
                  grant={grant}
                  now={now}
                  profileMap={profileMap}
                  emailMap={emailMap}
                />
              ))
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
