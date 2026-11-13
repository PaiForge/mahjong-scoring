import { getTranslations } from "next-intl/server";

import {
  planBadgeOf,
  type PlanBadge,
} from "@mahjong-scoring/features/billing/plan-badge";

import {
  adminChipClasses,
  type AdminChipTone,
} from "@/app/admin/_lib/chip-classes";
import { formatAdminDate } from "@/app/admin/_lib/format-date";
import type { PlanStatus } from "@/lib/billing/plan-status";

interface PlanChipProps {
  readonly plan: PlanStatus;
}

/**
 * ラベルの種類ごとのチップの色。購入の Pro は「生きている」状態の緑、
 * 運営が付与した Pro（VIP）は購入と並んでも見分けが付く別の色、無料は灰。
 */
const BADGE_TONES: Readonly<Record<PlanBadge, AdminChipTone>> = {
  pro: "success",
  vip: "special",
};

/**
 * 管理画面のプラン状況のチップ（ユーザー詳細の見出し・ユーザー一覧の「プラン」列）
 * プランチップ
 *
 * 購入の Pro か付与の VIP かは `planBadgeOf` で `PlanStatus.kind` から導き、
 * ここで `kind === "granted"` を書き直さない（マイページ・アプリと対応をそろえる）。
 * 文言はマイページの状態の見出し（`mypagePlan.status.*`）と同じで、VIP のときだけ
 * 先頭に "VIP" を付ける。購入と付与が重なる人は `planStatusOf` が選んだ 1 つの状態だけを出す。
 */
export async function PlanChip({ plan }: PlanChipProps) {
  const [t, tPlan] = await Promise.all([
    getTranslations("admin"),
    getTranslations("mypagePlan"),
  ]);
  const badge = planBadgeOf(plan);

  const label = ((): string => {
    switch (plan.kind) {
      case "lifetime":
        return tPlan("status.lifetime");
      case "pass":
        return tPlan("status.pass", { until: formatAdminDate(plan.until) });
      case "granted":
        return plan.until
          ? tPlan("status.grantedUntil", {
              until: formatAdminDate(plan.until),
            })
          : tPlan("status.granted");
      case "free":
        return tPlan("status.free");
    }
  })();

  return (
    <span className={adminChipClasses(badge ? BADGE_TONES[badge] : "neutral")}>
      {badge === "vip" ? `${t("usersTable.planBadges.vip")} ${label}` : label}
    </span>
  );
}
