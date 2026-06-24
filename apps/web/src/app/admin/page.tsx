import { getTranslations } from "next-intl/server";
import { createSearchParamsCache, parseAsString } from "nuqs/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { DailyTrendChart } from "@/app/admin/_components/daily-trend-chart";
import { DateRangePicker } from "@/app/admin/_components/date-range-picker";
import { daysAgo, getNewUsersPerDay, today } from "@/app/admin/_lib/dashboard";

const searchParamsCache = createSearchParamsCache({
  from: parseAsString.withDefault(daysAgo(28)),
  to: parseAsString.withDefault(today()),
});

export default async function AdminDashboardPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { from: startDate, to: endDate } =
    await searchParamsCache.parse(searchParams);
  const t = await getTranslations("admin");

  const newUsers = await getNewUsersPerDay(startDate, endDate);

  return (
    <div>
      <AdminPageTitle className="mb-2">{t("dashboard")}</AdminPageTitle>
      <p className="mb-6 text-sm text-surface-600">{t("dashboardDescription")}</p>

      <div className="mb-6">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          labels={{
            from: t("dashboardKpi.from"),
            to: t("dashboardKpi.to"),
            past7days: t("dashboardKpi.past7days"),
            past28days: t("dashboardKpi.past28days"),
            past90days: t("dashboardKpi.past90days"),
          }}
        />
      </div>

      <div className="mb-6 rounded-lg border border-surface-200 bg-surface-50 p-6">
        <p className="text-sm text-surface-500">
          {t("dashboardKpi.newUsersPeriodTotal")}
        </p>
        <p className="mt-1 text-3xl font-semibold text-surface-900">
          {newUsers.total}
        </p>
        <p className="mt-1 text-xs text-surface-500">
          {startDate} ~ {endDate} (UTC)
        </p>
      </div>

      <div className="rounded-lg border border-surface-200 bg-surface-50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-surface-900">
          {t("dashboardKpi.dailyTrends")}
        </h2>
        <DailyTrendChart
          data={newUsers.daily}
          seriesLabel={t("dashboardKpi.newUsers")}
          emptyMessage={t("dashboardKpi.noData")}
        />
      </div>
    </div>
  );
}
