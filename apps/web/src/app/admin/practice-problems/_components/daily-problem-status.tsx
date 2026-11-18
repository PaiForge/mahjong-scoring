import { getTranslations } from "next-intl/server";
import { isDailyProblemDisabled } from "@/lib/daily-problem/today";
import { readDailyProblemStatus } from "../_lib/daily-problem-status";
import { DailyProblemControl } from "./daily-problem-control";

/** 本日の問題の在庫と日単位の公開状態。問題の差し替えは行わない。 */
export async function DailyProblemStatus() {
  const [t, status] = await Promise.all([
    getTranslations("admin.dailyProblem"),
    readDailyProblemStatus(new Date()),
  ]);
  return (
    <section className="admin-panel space-y-4 p-6">
      <h3 className="text-lg font-semibold text-surface-900">{t("title")}</h3>
      <p className="text-sm">
        {isDailyProblemDisabled() ? t("disabled") : t("enabled")}
      </p>
      <p className="text-sm">
        {t("inventory", {
          total: status.total,
          checked: status.checked,
          eligible: status.eligible,
        })}
      </p>
      <p className="text-sm text-surface-600">{t("note")}</p>
      {status.recent.length === 0 && <p className="text-sm">{t("empty")}</p>}
      {status.recent.map((row) => (
        <DailyProblemControl
          key={row.day}
          day={row.day}
          withheldReason={row.withheldReason}
        />
      ))}
    </section>
  );
}
