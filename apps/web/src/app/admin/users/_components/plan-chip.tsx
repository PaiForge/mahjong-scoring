import { getTranslations } from "next-intl/server";
import Link from "next/link";

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

import { USER_DETAIL_SECTION_IDS } from "../_lib/detail-section-ids";

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
 * ラベルの種類ごとの、ユーザー詳細の飛び先の節。購入の Pro は購入履歴、
 * 付与の VIP は特典付与（期限と取り消しの操作がそこにある）
 */
const BADGE_SECTIONS: Readonly<Record<PlanBadge, string>> = {
  pro: USER_DETAIL_SECTION_IDS.purchases,
  vip: USER_DETAIL_SECTION_IDS.grants,
};

/**
 * プラン状況の全文（期限・買い切り・付与の別を含む）
 *
 * 文言はマイページの状態の見出し（`mypagePlan.status.*`）と同じで、VIP のときだけ
 * 先頭に "VIP" を付ける。購入と付与が重なる人は `planStatusOf` が選んだ 1 つの状態だけを出す。
 */
async function planLabel(plan: PlanStatus): Promise<string> {
  const [t, tPlan] = await Promise.all([
    getTranslations("admin"),
    getTranslations("mypagePlan"),
  ]);
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
  return planBadgeOf(plan) === "vip"
    ? `${t("usersTable.planBadges.vip")} ${label}`
    : label;
}

/**
 * 管理画面のプラン状況のチップ（ユーザー詳細の見出し）
 * プランチップ
 *
 * 購入の Pro か付与の VIP かは `planBadgeOf` で `PlanStatus.kind` から導き、
 * ここで `kind === "granted"` を書き直さない（マイページ・アプリと対応をそろえる）。
 */
export async function PlanChip({ plan }: PlanChipProps) {
  const badge = planBadgeOf(plan);
  return (
    <span className={adminChipClasses(badge ? BADGE_TONES[badge] : "neutral")}>
      {await planLabel(plan)}
    </span>
  );
}

interface PlanChipLinkProps {
  readonly plan: PlanStatus;
  /** ユーザー詳細へのリンクに使う利用者 ID */
  readonly userId: string;
}

/**
 * ユーザー一覧の「プラン」列の短いチップ
 * プランチップ（一覧）
 *
 * 期限まで入れた全文は列を横に伸ばすので、一覧では `Pro` / `VIP` だけを出す。
 * 全文は `title`（ホバー）に持たせ、チップを押すとユーザー詳細の該当する節
 * （Pro は購入履歴、VIP は特典付与）へ飛ぶ。無料はラベルを持たないので何も描かない
 * — 大半の行が無料で、Pro / VIP だけを目に留めるため。
 */
export async function PlanChipLink({ plan, userId }: PlanChipLinkProps) {
  const badge = planBadgeOf(plan);
  if (!badge) return null;
  const t = await getTranslations("admin");
  const label = await planLabel(plan);
  return (
    <Link
      href={`/admin/users/${userId}#${BADGE_SECTIONS[badge]}`}
      title={label}
      aria-label={label}
      className={`${adminChipClasses(BADGE_TONES[badge])} hover:opacity-80`}
    >
      {t(`usersTable.planBadges.${badge}`)}
    </Link>
  );
}
