import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { adminChipClasses } from "@/app/admin/_lib/chip-classes";
import { formatAdminDate } from "@/app/admin/_lib/format-date";
import { getOptionalUser } from "@/lib/auth";
import { planStatusOf, type PlanStatus } from "@/lib/billing/plan-status";
import { createAdminClient } from "@/lib/supabase/admin";

import { StatusBadge } from "../_components/status-badge";
import { resolveUserStatus } from "../_lib/user-status";

import {
  AccountSection,
  ActionsSection,
  GrantsSection,
  LearningSection,
  ModerationSection,
  PurchasesSection,
} from "./_components/user-detail-sections";
import { fetchUserDetail } from "./_lib/queries";

/**
 * ユーザー詳細（管理画面）
 *
 * @description
 * 1 ユーザーについて、アカウント・学習状況・プラン（購入と手動付与）・
 * モデレーション履歴をまとめて見る。Pro 付与と BAN / BAN 解除はここから行う —
 * 相手の状態を確かめずに一覧の行から押す操作ではないため、一覧には置かない。
 * @flow ユーザー一覧の「詳細」→ 状態を確認 → 必要なら操作（理由を入れて確定）
 */
export default async function AdminUserDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  await requireAdminPage();

  const { id } = await params;
  const [t, tPlan, detail, currentUser] = await Promise.all([
    getTranslations("admin.userDetail"),
    getTranslations("mypagePlan"),
    fetchUserDetail(createAdminClient(), id),
    getOptionalUser(),
  ]);
  if (!detail) notFound();

  const { authUser, profile } = detail;
  const now = new Date();
  const status = resolveUserStatus(profile, authUser, now);
  const plan = planStatusOf(detail.purchases, detail.grants, now);
  const isCurrentUser = currentUser?.id === authUser.id;

  const planLabel = (p: PlanStatus): string => {
    switch (p.kind) {
      case "lifetime":
        return tPlan("status.lifetime");
      case "pass":
        return tPlan("status.pass", { until: formatAdminDate(p.until) });
      case "granted":
        return p.until
          ? tPlan("status.grantedUntil", { until: formatAdminDate(p.until) })
          : tPlan("status.granted");
      case "free":
        return tPlan("status.free");
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className={`text-sm ${TEXT_LINK_CLASSES}`}>
        {t("backToList")}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <AdminPageTitle>
          {profile?.username ?? authUser.email ?? authUser.id}
        </AdminPageTitle>
        <StatusBadge status={status} />
        <span
          className={adminChipClasses(
            plan.kind === "free" ? "neutral" : "success",
          )}
        >
          {planLabel(plan)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AccountSection detail={detail} status={status} />
        <LearningSection detail={detail} />
      </div>

      <PurchasesSection detail={detail} now={now} />
      <GrantsSection detail={detail} now={now} />
      <ModerationSection detail={detail} />
      <ActionsSection
        detail={detail}
        status={status}
        isCurrentUser={isCurrentUser}
      />
    </div>
  );
}
