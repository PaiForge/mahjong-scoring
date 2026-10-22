import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { MaskedEmail } from "@/app/admin/_components/masked-email";
import {
  formatAdminDate,
  formatAdminDateTime,
} from "@/app/admin/_lib/format-date";
import { isKnownAuthProvider } from "@/lib/auth-provider";
import { formatAmount } from "@/lib/billing/prices";
import {
  benefitGrantStateOf,
  purchaseProviderOf,
  purchaseStateOf,
} from "@/lib/billing/plan-status";
import { PurchaseKind } from "@mahjong-scoring/features/billing/plans";
import { PurchaseProvider } from "@mahjong-scoring/features/billing/provider";
import type { Profile } from "@/lib/db";
import {
  highestRank,
  isRankSlug,
} from "@mahjong-scoring/features/ranks/registry";

import { RevokeGrantButton } from "../../../benefit-grants/_components/revoke-grant-button";
import { BanButton } from "../../_components/ban-button";
import { UnbanButton } from "../../_components/unban-button";
import { GrantBenefitsButton } from "../../_components/grant-benefits-button";
import { PublicProfileLink } from "../../_components/public-profile-link";
import { UserStatus } from "../../_lib/user-status";
import type { UserDetail } from "../_lib/queries";
import { DetailSection, DetailTable, InfoRow } from "./detail-section";

/** 付与者・操作者の表示（ユーザー名 → ID） */
function actorDisplay(id: string, profileMap: Map<string, Profile>): string {
  return profileMap.get(id)?.username ?? id;
}

/** ユーザー詳細の各節に渡るもの */
interface SectionProps {
  readonly detail: UserDetail;
  readonly status: UserStatus;
  /** ページを描いた時刻（購入・付与の有効期限の判定） */
  readonly now: Date;
}

/** アカウント（ID・メール・ユーザー名・ロール・ログイン方法・日時） */
export async function AccountSection({
  detail,
  status,
}: Pick<SectionProps, "detail" | "status">) {
  const t = await getTranslations("admin.userDetail");
  const { authUser, profile } = detail;
  const provider = authUser.app_metadata.provider;
  return (
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
          {isKnownAuthProvider(provider)
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
  );
}

/** 学習状況（段級位・EXP・チャレンジ数・レッスンの完了数・取った級の一覧） */
export async function LearningSection({
  detail,
}: Pick<SectionProps, "detail">) {
  const [t, tRanks] = await Promise.all([
    getTranslations("admin.userDetail"),
    getTranslations("ranks.names"),
  ]);
  const currentRank = highestRank(
    detail.ranks.map((r) => r.rankSlug).filter(isRankSlug),
  );
  return (
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
        <InfoRow label={t("learning.lessonCompletionCount")}>
          {detail.lessonCompletionCount.toLocaleString("ja-JP")}
        </InfoRow>
      </dl>
      {detail.ranks.length > 0 && (
        <ul className="space-y-1 border-t border-surface-100 pt-2 text-sm">
          {detail.ranks.map((rank) => (
            <li key={rank.rankSlug} className="flex justify-between gap-4">
              <span>
                {isRankSlug(rank.rankSlug)
                  ? tRanks(rank.rankSlug)
                  : rank.rankSlug}
              </span>
              <span className="text-surface-500">
                {formatAdminDate(rank.grantedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  );
}

/** 購入（Stripe / App Store）の一覧 */
export async function PurchasesSection({
  detail,
  now,
}: Pick<SectionProps, "detail" | "now">) {
  const [t, tPlan] = await Promise.all([
    getTranslations("admin.userDetail"),
    getTranslations("mypagePlan"),
  ]);
  return (
    <DetailSection title={t("purchases.title")}>
      <DetailTable
        headers={[
          t("purchases.date"),
          t("purchases.item"),
          t("purchases.provider"),
          t("purchases.amount"),
          t("purchases.period"),
          t("purchases.state"),
        ]}
        isEmpty={detail.purchases.length === 0}
        emptyLabel={t("purchases.empty")}
      >
        {detail.purchases.map((purchase) => (
          <tr key={purchase.id} className="border-t border-surface-200">
            <td className="px-3 py-2 whitespace-nowrap">
              {formatAdminDate(purchase.createdAt)}
            </td>
            <td className="px-3 py-2 whitespace-nowrap">
              {purchase.kind === PurchaseKind.Lifetime
                ? tPlan("history.kind.lifetime")
                : tPlan("history.kind.pass")}
            </td>
            <td className="px-3 py-2 whitespace-nowrap">
              {purchaseProviderOf(purchase) === PurchaseProvider.Apple
                ? t("purchases.providerApple")
                : t("purchases.providerStripe")}
            </td>
            <td className="px-3 py-2 whitespace-nowrap tabular-nums">
              {formatAmount(purchase.amount, purchase.currency)}
            </td>
            <td className="px-3 py-2 whitespace-nowrap text-surface-500">
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
  );
}

/** 手動付与（benefit_grants）の一覧。有効なものは取り消せる */
export async function GrantsSection({
  detail,
  now,
}: Pick<SectionProps, "detail" | "now">) {
  const [t, tGrants] = await Promise.all([
    getTranslations("admin.userDetail"),
    getTranslations("admin.benefitGrants"),
  ]);
  return (
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
            <tr key={grant.id} className="border-t border-surface-200">
              <td className="px-3 py-2 whitespace-nowrap text-surface-500">
                {formatAdminDate(grant.startsAt)}
                {" 〜 "}
                {grant.expiresAt
                  ? formatAdminDate(grant.expiresAt)
                  : t("permanent")}
              </td>
              <td className="px-3 py-2">
                {grant.reason}
                {grant.revokeReason && (
                  <span className="mt-1 block text-xs text-surface-500">
                    {tGrants("table.revokedReason", {
                      reason: grant.revokeReason,
                    })}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-surface-500">
                {actorDisplay(grant.grantedBy, detail.actorProfileMap)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {tGrants(`state.${state}`)}
              </td>
              <td className="px-3 py-2">
                {state === "active" && <RevokeGrantButton grantId={grant.id} />}
              </td>
            </tr>
          );
        })}
      </DetailTable>
    </DetailSection>
  );
}

/** モデレーション履歴と、監査ログ・アクティビティログへの導線 */
export async function ModerationSection({
  detail,
}: Pick<SectionProps, "detail">) {
  const t = await getTranslations("admin.userDetail");
  // 監査ログ・アクティビティログの「ユーザーで絞り込み」はユーザー名かメールで引く
  const logFilter = encodeURIComponent(
    detail.profile?.username ?? detail.authUser.email ?? "",
  );
  return (
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
          <tr key={entry.id} className="border-t border-surface-200 align-top">
            <td className="px-3 py-2 font-medium whitespace-nowrap">
              {entry.action}
            </td>
            <td className="px-3 py-2">{entry.reason ?? "-"}</td>
            <td className="px-3 py-2 text-surface-500">
              {actorDisplay(entry.actorId, detail.actorProfileMap)}
            </td>
            <td className="px-3 py-2 whitespace-nowrap text-surface-500">
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
  );
}

/**
 * 操作（Pro の付与・BAN / BAN 解除）
 *
 * 退会済みは付与も BAN も意味を持たない（ログインできず戻らない）ので出さない。
 * 付与は自分にもできる（運営者の動作確認・制限解除のため）。BAN と違い相手を
 * 害さない操作なので isCurrentUser で隠さない。
 */
export async function ActionsSection({
  detail,
  status,
  isCurrentUser,
}: Pick<SectionProps, "detail" | "status"> & {
  readonly isCurrentUser: boolean;
}) {
  const t = await getTranslations("admin.userDetail");
  if (status === UserStatus.Deleted) return undefined;
  const targetUserId = detail.authUser.id;
  return (
    <DetailSection title={t("actions.title")}>
      <div className="flex flex-wrap gap-2">
        <GrantBenefitsButton targetUserId={targetUserId} />
        {!isCurrentUser &&
          (status === UserStatus.Banned ? (
            <UnbanButton targetUserId={targetUserId} />
          ) : (
            <BanButton targetUserId={targetUserId} />
          ))}
      </div>
    </DetailSection>
  );
}
