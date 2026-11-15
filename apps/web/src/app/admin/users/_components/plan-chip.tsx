import { getTranslations } from "next-intl/server";
import Link from "next/link";

import {
  planBadgeOf,
  type PlanBadge,
} from "@mahjong-scoring/features/billing/plan-badge";

import { ProBadge, VipBadge } from "@/app/_components/plan-badges";
import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";
import { adminChipClasses } from "@/app/admin/_lib/chip-classes";
import { formatAdminDate } from "@/app/admin/_lib/format-date";
import type { PlanStatus } from "@/lib/billing/plan-status";

import { USER_DETAIL_SECTION_IDS } from "../_lib/detail-section-ids";

interface PlanChipProps {
  readonly plan: PlanStatus;
}

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
 * 文言はマイページの状態の見出し（`mypagePlan.status.*`）と同じ。Pro / VIP の別は
 * 横に置くラベル（`ProBadge` / `VipBadge`）が示す。購入と付与が重なる人は
 * `planStatusOf` が選んだ 1 つの状態だけを出す。
 */
async function planLabel(plan: PlanStatus): Promise<string> {
  const tPlan = await getTranslations("mypagePlan");
  return ((): string => {
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
}

/**
 * Pro / VIP のラベル 1 つ
 *
 * 利用者がマイページで見るものと同じ部品（`app/_components/plan-badges`）を使い、
 * 運営が見るラベルと外観をそろえる。
 */
async function PlanBadgeMark({ badge }: { readonly badge: PlanBadge }) {
  const t = await getTranslations("admin");
  const label = t(`usersTable.planBadges.${badge}`);
  return badge === "vip" ? (
    <VipBadge label={label} />
  ) : (
    <ProBadge label={label} />
  );
}

/**
 * 管理画面のプラン状況（ユーザー詳細の見出し）
 * プランチップ
 *
 * Pro / VIP のラベルの横に、期限まで入れた状態の全文を灰のチップで添える。
 * 購入の Pro か付与の VIP かは `planBadgeOf` で `PlanStatus.kind` から導き、
 * ここで `kind === "granted"` を書き直さない（マイページ・アプリと対応をそろえる）。
 */
export async function PlanChip({ plan }: PlanChipProps) {
  const badge = planBadgeOf(plan);
  return (
    <span className="inline-flex items-center gap-1.5">
      {badge && <PlanBadgeMark badge={badge} />}
      <span className={adminChipClasses("neutral")}>
        {await planLabel(plan)}
      </span>
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
  const label = await planLabel(plan);
  return (
    <Link
      href={`/admin/users/${userId}#${BADGE_SECTIONS[badge]}`}
      title={label}
      aria-label={label}
      className={`inline-flex rounded-full hover:opacity-80 ${FOCUS_RING_CLASSES}`}
    >
      <PlanBadgeMark badge={badge} />
    </Link>
  );
}
