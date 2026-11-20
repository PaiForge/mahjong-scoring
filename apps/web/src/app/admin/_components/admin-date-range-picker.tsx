import { getTranslations } from "next-intl/server";

import { DateRangePicker } from "./date-range-picker";

/**
 * 期間ピッカーのラベルを自分で引いて描く統計ページ向けの包み
 * 期間ピッカー（ラベル解決つき）
 *
 * ラベルは `admin.dashboardKpi.*` の同じ 6 つで、ページごとに引き直さない。
 */
export async function AdminDateRangePicker({
  startDate,
  endDate,
}: {
  readonly startDate: string;
  readonly endDate: string;
}) {
  const t = await getTranslations("admin");

  return (
    <DateRangePicker
      startDate={startDate}
      endDate={endDate}
      labels={{
        from: t("dashboardKpi.from"),
        to: t("dashboardKpi.to"),
        presets: t("dashboardKpi.presets"),
        past7days: t("dashboardKpi.past7days"),
        past28days: t("dashboardKpi.past28days"),
        past90days: t("dashboardKpi.past90days"),
      }}
    />
  );
}
