import { getTranslations } from "next-intl/server";
import { createSearchParamsCache } from "nuqs/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { DailyTrendChart } from "@/app/admin/_components/daily-trend-chart";
import { AdminDateRangePicker } from "@/app/admin/_components/admin-date-range-picker";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { getNewUsersPerDay } from "@/app/admin/_lib/dashboard";
import {
  dateRangeParsers,
  defaultStatsDateRange,
} from "@/app/admin/_lib/stats-search-params";

// nuqs のキャッシュはモジュールスコープで組み立てる必要があるため、
// 既定の期間もモジュール評価時の日付で決まる（プロセスが生きている間は固定）。
const searchParamsCache = createSearchParamsCache(
  dateRangeParsers(defaultStatsDateRange(new Date())),
);

export default async function AdminDashboardPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();

  const { from: startDate, to: endDate } =
    await searchParamsCache.parse(searchParams);
  const t = await getTranslations("admin");

  const newUsers = await getNewUsersPerDay(startDate, endDate);

  return (
    <>
      <AdminPageTitle className="mb-2">{t("dashboard")}</AdminPageTitle>
      <p className="mb-6 text-sm text-surface-600">
        {t("dashboardDescription")}
      </p>

      <div className="space-y-6">
        <AdminDateRangePicker startDate={startDate} endDate={endDate} />

        <section className="admin-kpi space-y-2">
          <p className="text-sm font-medium text-surface-600">
            {t("dashboardKpi.newUsersPeriodTotal")}
          </p>
          <p className="text-5xl leading-[56px] font-semibold tracking-tight text-primary-900 tabular-nums">
            {newUsers.total}
          </p>
          <p className="text-xs text-surface-500">
            {startDate} ~ {endDate}
          </p>
        </section>

        <section className="admin-panel p-6">
          <h3 className="mb-4 text-lg font-semibold text-surface-900">
            {t("dashboardKpi.dailyTrends")}
          </h3>
          <DailyTrendChart
            data={newUsers.daily}
            seriesLabel={t("dashboardKpi.newUsers")}
            emptyMessage={t("dashboardKpi.noData")}
          />
        </section>
      </div>
    </>
  );
}
