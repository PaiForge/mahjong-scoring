import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { MaskedEmail } from "@/app/admin/_components/masked-email";
import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import {
  formatAdminDate,
  formatAdminDateTime,
} from "@/app/admin/_lib/format-date";
import { getOptionalUser } from "@/lib/auth";
import { formatAmount } from "@/lib/billing/prices";
import {
  benefitGrantStateOf,
  planStatusOf,
  purchaseStateOf,
  type PlanStatus,
} from "@/lib/billing/plan-status";
import { PurchaseKind } from "@mahjong-scoring/features/billing/plans";
import type { Profile } from "@/lib/db";
import { highestRank, isRankSlug } from "@/lib/ranks/registry";
import { createAdminClient } from "@/lib/supabase/admin";

import { RevokeGrantButton } from "../../benefit-grants/_components/revoke-grant-button";
import { BanButton } from "../_components/ban-button";
import { GrantBenefitsButton } from "../_components/grant-benefits-button";
import { PublicProfileLink } from "../_components/public-profile-link";
import { StatusBadge } from "../_components/status-badge";
import { UnbanButton } from "../_components/unban-button";
import { UserStatus, resolveUserStatus } from "../_lib/user-status";

import {
  DetailSection,
  DetailTable,
  InfoRow,
} from "./_components/detail-section";
import { fetchUserDetail } from "./_lib/queries";

/** 付与者・操作者の表示（ユーザー名 → ID） */
function actorDisplay(id: string, profileMap: Map<string, Profile>): string {
  return profileMap.get(id)?.username ?? id;
}

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
  const [t, tPlan, tGrants, tRanks, detail, currentUser] = await Promise.all([
    getTranslations("admin.userDetail"),
    getTranslations("mypagePlan"),
    getTranslations("admin.benefitGrants"),
    getTranslations("ranks.names"),
    fetchUserDetail(createAdminClient(), id),
    getOptionalUser(),
  ]);
  if (!detail) notFound();

  const { authUser, profile } = detail;
  const now = new Date();
  const status = resolveUserStatus(profile, authUser, now);
  const plan = planStatusOf(detail.purchases, detail.grants, now);
  const currentRank = highestRank(
    detail.ranks.map((r) => r.rankSlug).filter(isRankSlug),
  );
  const isCurrentUser = currentUser?.id === authUser.id;
  const provider = authUser.app_metadata.provider;

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

  // 監査ログ・アクティビティログの「ユーザーで絞り込み」はユーザー名かメールで引く
  const logFilter = encodeURIComponent(
    profile?.username ?? authUser.email ?? "",
  );

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
        <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-gray-700">
          {planLabel(plan)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection title={t("account.title")}>
          <dl>
            <InfoRow label={t("account.id")}>
              <code className="text-xs">{authUser.id}</code>
            </InfoRow>
            <InfoRow label={t("account.email")}>
              <MaskedEmail
                email={authUser.email}
                labels={{
                  revealEmail: t("account.revealEmail"),
                  hideEmail: t("account.hideEmail"),
                }}
              />
            </InfoRow>
            <InfoRow label={t("account.username")}>
              {status === UserStatus.Active && profile ? (
                <PublicProfileLink username={profile.username} />
              ) : (
                (profile?.username ?? "-")
              )}
            </InfoRow>
            <InfoRow label={t("account.displayName")}>
              {profile?.displayName ?? "-"}
            </InfoRow>
            <InfoRow label={t("account.role")}>
              {detail.roles.includes("admin")
                ? t("account.roles.admin")
                : t("account.roles.user")}
            </InfoRow>
            <InfoRow label={t("account.provider")}>
              {provider === "email" || provider === "google"
                ? t(`account.providers.${provider}`)
                : (provider ?? "-")}
            </InfoRow>
            <InfoRow label={t("account.emailConfirmedAt")}>
              {authUser.email_confirmed_at
                ? formatAdminDateTime(authUser.email_confirmed_at)
                : t("account.emailUnconfirmed")}
            </InfoRow>
            <InfoRow label={t("account.createdAt")}>
              {formatAdminDateTime(authUser.created_at)}
            </InfoRow>
            <InfoRow label={t("account.lastSignInAt")}>
              {formatAdminDateTime(authUser.last_sign_in_at)}
            </InfoRow>
            {profile?.bannedAt && (
              <InfoRow label={t("account.bannedAt")}>
                {formatAdminDateTime(profile.bannedAt)}
              </InfoRow>
            )}
            {profile?.deletedAt && (
              <InfoRow label={t("account.deletedAt")}>
                {formatAdminDateTime(profile.deletedAt)}
              </InfoRow>
            )}
          </dl>
        </DetailSection>

        <DetailSection title={t("learning.title")}>
          <dl>
            <InfoRow label={t("learning.currentRank")}>
              {currentRank ? tRanks(currentRank.slug) : t("learning.noRank")}
            </InfoRow>
            <InfoRow label={t("learning.totalExp")}>
              {detail.totalExp.toLocaleString("ja-JP")}
            </InfoRow>
            <InfoRow label={t("learning.challengeCount")}>
              {detail.challengeCount.toLocaleString("ja-JP")}
            </InfoRow>
            <InfoRow label={t("learning.chapterReadCount")}>
              {detail.chapterReadCount.toLocaleString("ja-JP")}
            </InfoRow>
          </dl>
          {detail.ranks.length > 0 && (
            <ul className="space-y-1 border-t border-gray-100 pt-2 text-sm">
              {detail.ranks.map((rank) => (
                <li key={rank.rankSlug} className="flex justify-between gap-4">
                  <span>
                    {isRankSlug(rank.rankSlug)
                      ? tRanks(rank.rankSlug)
                      : rank.rankSlug}
                  </span>
                  <span className="text-gray-500">
                    {formatAdminDate(rank.grantedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DetailSection>
      </div>

      <DetailSection title={t("purchases.title")}>
        <DetailTable
          headers={[
            t("purchases.date"),
            t("purchases.item"),
            t("purchases.amount"),
            t("purchases.period"),
            t("purchases.state"),
          ]}
          isEmpty={detail.purchases.length === 0}
          emptyLabel={t("purchases.empty")}
        >
          {detail.purchases.map((purchase) => (
            <tr key={purchase.id} className="border-t border-gray-200">
              <td className="px-3 py-2 whitespace-nowrap">
                {formatAdminDate(purchase.createdAt)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {purchase.kind === PurchaseKind.Lifetime
                  ? tPlan("history.kind.lifetime")
                  : tPlan("history.kind.pass")}
              </td>
              <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                {formatAmount(purchase.amount, purchase.currency)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                {formatAdminDate(purchase.startsAt)}
                {" 〜 "}
                {purchase.expiresAt
                  ? formatAdminDate(purchase.expiresAt)
                  : t("permanent")}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {tPlan(`history.state_${purchaseStateOf(purchase, now)}`)}
              </td>
            </tr>
          ))}
        </DetailTable>
      </DetailSection>

      <DetailSection title={t("grants.title")}>
        <DetailTable
          headers={[
            t("grants.period"),
            t("grants.reason"),
            t("grants.grantedBy"),
            t("grants.state"),
            t("grants.actions"),
          ]}
          isEmpty={detail.grants.length === 0}
          emptyLabel={t("grants.empty")}
        >
          {detail.grants.map((grant) => {
            const state = benefitGrantStateOf(grant, now);
            return (
              <tr key={grant.id} className="border-t border-gray-200">
                <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                  {formatAdminDate(grant.startsAt)}
                  {" 〜 "}
                  {grant.expiresAt
                    ? formatAdminDate(grant.expiresAt)
                    : t("permanent")}
                </td>
                <td className="px-3 py-2">
                  {grant.reason}
                  {grant.revokeReason && (
                    <span className="mt-1 block text-xs text-gray-500">
                      {tGrants("table.revokedReason", {
                        reason: grant.revokeReason,
                      })}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-500">
                  {actorDisplay(grant.grantedBy, detail.actorProfileMap)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {tGrants(`state.${state}`)}
                </td>
                <td className="px-3 py-2">
                  {state === "active" && (
                    <RevokeGrantButton grantId={grant.id} />
                  )}
                </td>
              </tr>
            );
          })}
        </DetailTable>
      </DetailSection>

      <DetailSection title={t("moderation.title")}>
        <DetailTable
          headers={[
            t("moderation.action"),
            t("moderation.reason"),
            t("moderation.actor"),
            t("moderation.date"),
          ]}
          isEmpty={detail.moderationEntries.length === 0}
          emptyLabel={t("moderation.empty")}
        >
          {detail.moderationEntries.map((entry) => (
            <tr key={entry.id} className="border-t border-gray-200 align-top">
              <td className="px-3 py-2 font-medium whitespace-nowrap">
                {entry.action}
              </td>
              <td className="px-3 py-2">{entry.reason ?? "-"}</td>
              <td className="px-3 py-2 text-gray-500">
                {actorDisplay(entry.actorId, detail.actorProfileMap)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                {formatAdminDateTime(entry.createdAt)}
              </td>
            </tr>
          ))}
        </DetailTable>
        <p className="flex flex-wrap gap-x-4 text-sm">
          <Link
            href={`/admin/audit-log?user=${logFilter}`}
            className={TEXT_LINK_CLASSES}
          >
            {t("moderation.viewAuditLog")}
          </Link>
          <Link
            href={`/admin/activity-log?user=${logFilter}`}
            className={TEXT_LINK_CLASSES}
          >
            {t("moderation.viewActivityLog")}
          </Link>
        </p>
      </DetailSection>

      {/* 退会済みは付与も BAN も意味を持たない（ログインできず戻らない） */}
      {status !== UserStatus.Deleted && (
        <DetailSection title={t("actions.title")}>
          {/* 付与は自分にもできる（運営者の動作確認・制限解除のため）。
              BAN と違い相手を害さない操作なので isCurrentUser で隠さない */}
          <div className="flex flex-wrap gap-2">
            <GrantBenefitsButton targetUserId={authUser.id} />
            {!isCurrentUser &&
              (status === UserStatus.Banned ? (
                <UnbanButton targetUserId={authUser.id} />
              ) : (
                <BanButton targetUserId={authUser.id} />
              ))}
          </div>
        </DetailSection>
      )}
    </div>
  );
}
