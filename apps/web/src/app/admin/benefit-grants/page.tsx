import { getTranslations } from "next-intl/server";
import { createSearchParamsCache, parseAsInteger } from "nuqs/server";

import { AdminPaginationNav } from "@/app/admin/_components/admin-pagination-nav";
import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { TableEmptyRow } from "@/app/admin/_components/table-empty-row";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

import { BenefitGrantRow } from "./_components/benefit-grant-row";
import { fetchBenefitGrantsPageData } from "./_lib/queries";

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
});

/** 列（対象・内容・期間・理由・付与者・状態・操作） */
const COLUMN_KEYS = [
  "target",
  "plan",
  "period",
  "reason",
  "grantedBy",
  "state",
  "actions",
] as const;

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
          <thead>
            <tr className="border-b border-surface-200">
              {COLUMN_KEYS.map((key) => (
                <th
                  key={key}
                  className="px-4 py-3 font-medium whitespace-nowrap"
                >
                  {t(`table.${key}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grants.length === 0 ? (
              <TableEmptyRow
                columnCount={COLUMN_KEYS.length}
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
