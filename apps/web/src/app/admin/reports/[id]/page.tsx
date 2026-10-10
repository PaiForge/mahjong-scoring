import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import type { Profile, ReportedProfileSnapshot } from "@/lib/db";
import { isReportReason } from "@mahjong-scoring/features/reports/report";

import { formatAdminDateTime } from "../../_lib/format-date";
import {
  DetailSection,
  InfoRow,
} from "../../users/[id]/_components/detail-section";
import { ReportActionButtons } from "../_components/report-action-buttons";
import { ReportStatusChip } from "../_components/report-status-chip";
import { fetchReportDetail } from "../_lib/queries";

/** プロフィールの SNS をまとめて 1 行にする */
function snsLine(p: {
  readonly xUsername: string | null;
  readonly instagramUsername: string | null;
  readonly youtubeHandle: string | null;
}): string {
  const parts = [
    p.xUsername && `X @${p.xUsername}`,
    p.instagramUsername && `Instagram @${p.instagramUsername}`,
    p.youtubeHandle && `YouTube @${p.youtubeHandle}`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "-";
}

/** 通報した時点 / 今のプロフィールを同じ並びで出す */
async function ProfileRows({
  profile,
}: {
  readonly profile: ReportedProfileSnapshot | Profile;
}) {
  const t = await getTranslations("admin.reports.profileFields");
  return (
    <dl>
      <InfoRow label={t("username")}>@{profile.username}</InfoRow>
      <InfoRow label={t("displayName")}>{profile.displayName ?? "-"}</InfoRow>
      <InfoRow label={t("bio")}>
        <span className="whitespace-pre-wrap">{profile.bio ?? "-"}</span>
      </InfoRow>
      <InfoRow label={t("avatar")}>
        {profile.avatarUrl ? (
          // 管理画面だけで見る通報の証拠。next/image の最適化を通す必要は無い
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          "-"
        )}
      </InfoRow>
      <InfoRow label={t("sns")}>{snsLine(profile)}</InfoRow>
    </dl>
  );
}

/**
 * 通報の詳細（管理画面）
 *
 * @description
 * 1 件の通報について、理由・詳細・通報した時点のプロフィール・今のプロフィール・
 * 同じ人への他の通報を並べ、未対応なら対応（BAN / プロフィールを消す /
 * 対応不要）を押せる。
 * @flow 通報一覧 → 詳細 → 内容を見比べる → 対応を選び理由を入れて確定 → 一覧へ戻る
 */
export default async function AdminReportDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  // 形の違う ID は DB に問い合わせる前に落とす（uuid 型の比較が例外になる）
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [t, tReasons, detail] = await Promise.all([
    getTranslations("admin.reports"),
    getTranslations("report.reasons"),
    fetchReportDetail(id),
  ]);
  if (!detail) notFound();
  const { report, target, otherReports, profileMap } = detail;
  const username = (userId: string | null) =>
    userId === null
      ? t("report.deletedUser")
      : (profileMap.get(userId)?.username ?? userId);
  const reasonLabel = (reason: string) =>
    isReportReason(reason) ? tReasons(reason) : reason;

  return (
    <div className="space-y-6">
      <Link href="/admin/reports" className={`text-sm ${TEXT_LINK_CLASSES}`}>
        {t("backToList")}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <AdminPageTitle>
          {t("detailTitle", { username: report.snapshot.username })}
        </AdminPageTitle>
        <ReportStatusChip status={report.status} />
      </div>

      {report.status === "open" && (
        <DetailSection title={t("actions.title")}>
          <div className="space-y-3">
            <p className="text-sm text-surface-600">
              {t("actions.description")}
            </p>
            <ReportActionButtons reportId={report.id} />
          </div>
        </DetailSection>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection title={t("report.title")}>
          <dl>
            <InfoRow label={t("report.reason")}>
              {reasonLabel(report.reason)}
            </InfoRow>
            <InfoRow label={t("report.detail")}>
              <span className="whitespace-pre-wrap">
                {report.detail ?? t("report.none")}
              </span>
            </InfoRow>
            <InfoRow label={t("report.reporter")}>
              {username(report.reporterId)}
            </InfoRow>
            <InfoRow label={t("report.createdAt")}>
              {formatAdminDateTime(report.createdAt)}
            </InfoRow>
            {report.resolvedAt && (
              <>
                <InfoRow label={t("report.resolvedBy")}>
                  {username(report.resolvedBy)}
                </InfoRow>
                <InfoRow label={t("report.resolvedAt")}>
                  {formatAdminDateTime(report.resolvedAt)}
                </InfoRow>
              </>
            )}
          </dl>
        </DetailSection>

        <DetailSection title={t("others.title")}>
          {otherReports.length === 0 ? (
            <p className="text-sm text-surface-500">{t("others.empty")}</p>
          ) : (
            <ul className="divide-y divide-surface-100">
              {otherReports.map((other) => (
                <li
                  key={other.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <Link
                    href={`/admin/reports/${other.id}`}
                    className={TEXT_LINK_CLASSES}
                  >
                    {formatAdminDateTime(other.createdAt)} —{" "}
                    {reasonLabel(other.reason)}
                  </Link>
                  <ReportStatusChip status={other.status} />
                </li>
              ))}
            </ul>
          )}
        </DetailSection>

        <DetailSection title={t("snapshot.title")}>
          <p className="text-xs text-surface-500">{t("snapshot.note")}</p>
          <ProfileRows profile={report.snapshot} />
        </DetailSection>

        <DetailSection title={t("current.title")}>
          {target ? (
            <>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href={`/admin/users/${target.id}`}
                  className={TEXT_LINK_CLASSES}
                >
                  {t("current.openUser")}
                </Link>
                {target.bannedAt && (
                  <span className="text-destructive">
                    {t("current.banned")}
                  </span>
                )}
                {target.deletedAt && (
                  <span className="text-surface-500">
                    {t("current.deleted")}
                  </span>
                )}
              </div>
              <ProfileRows profile={target} />
            </>
          ) : (
            <p className="text-sm text-surface-500">{t("current.deleted")}</p>
          )}
        </DetailSection>
      </div>
    </div>
  );
}
