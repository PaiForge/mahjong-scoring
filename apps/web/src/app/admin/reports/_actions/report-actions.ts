"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-types";
import { purgeLeaderboardCache } from "@/lib/cache-tags";
import { getClientIp } from "@/lib/client-ip";
import { db, profiles, reports, type TransactionClient } from "@/lib/db";
import { logExternalError } from "@/lib/log-error";
import { deleteAvatarObject } from "@/lib/users/avatar";

import { requireAdminActor } from "../../_lib/auth";
import { banUser } from "../../users/_actions/ban-user";
import { normalizeModerationReason } from "../../users/_lib/moderation-reason";
import {
  ModerationActionKind,
  recordModerationAction,
} from "../../users/_lib/moderation";
import { revalidateAdminUsers } from "../../users/_lib/revalidate";

/** 通報への対応の失敗理由 */
export type ReportActionError =
  "unauthorized" | "invalidReason" | "notFound" | "failed";

interface AdminContext {
  readonly actorId: string;
  readonly reason: string;
  readonly report: { readonly id: string; readonly targetUserId: string };
}

/** 管理者・理由・未対応の通報を確かめる（3 つの操作で共通の入口） */
async function prepare(
  reportId: string,
  reason: string,
): Promise<AdminContext | { readonly error: ReportActionError }> {
  const admin = await requireAdminActor("unauthorized");
  if ("error" in admin) return admin;
  const trimmed = normalizeModerationReason(reason);
  if (trimmed === undefined) return { error: "invalidReason" };
  const [report] = await db
    .select({ id: reports.id, targetUserId: reports.targetUserId })
    .from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.status, "open")))
    .limit(1);
  if (!report) return { error: "notFound" };
  return { actorId: admin.actorId, reason: trimmed, report };
}

/**
 * 同じ人への未対応の通報をすべて対応済みにする
 *
 * BAN もプロフィールの削除も「その人」への対応なので、通報した人が別々でも
 * まとめて閉じる（1 件ずつ同じ対応を繰り返させない）。
 */
async function resolveOpenReportsFor(
  tx: TransactionClient,
  context: AdminContext,
  ipAddress: string | undefined,
  via: ModerationActionKind,
): Promise<void> {
  const resolved = await tx
    .update(reports)
    .set({
      status: "resolved",
      resolvedBy: context.actorId,
      resolvedAt: new Date(),
    })
    .where(
      and(
        eq(reports.targetUserId, context.report.targetUserId),
        eq(reports.status, "open"),
      ),
    )
    .returning({ id: reports.id });
  await recordModerationAction(tx, {
    actorId: context.actorId,
    action: ModerationActionKind.ResolveReport,
    targetId: context.report.targetUserId,
    reason: context.reason,
    ipAddress,
    metadata: { reportIds: resolved.map((r) => r.id), via },
  });
}

function revalidateReportViews(): void {
  revalidatePath("/admin/reports", "layout");
  revalidatePath("/admin", "page");
}

/**
 * 通報された人を BAN し、その人への未対応の通報を対応済みにする
 * BAN して解決
 *
 * BAN そのものはユーザー詳細の BAN と同じ処理（`banUser`。Auth と DB の
 * 二段階・ロールバック付き）を通す。BAN が済んでから通報を閉じる。
 */
export async function banAndResolveReportAction(
  reportId: string,
  reason: string,
): Promise<ActionResult<ReportActionError>> {
  const context = await prepare(reportId, reason);
  if ("error" in context) return context;

  const banned = await banUser(context.report.targetUserId, context.reason);
  if ("error" in banned) {
    return {
      error: banned.error === "unauthorized" ? "unauthorized" : "failed",
    };
  }

  const ipAddress = await getClientIp();
  try {
    await db.transaction((tx) =>
      resolveOpenReportsFor(tx, context, ipAddress, ModerationActionKind.Ban),
    );
  } catch (error) {
    logExternalError("banAndResolveReport", "failed to resolve", error);
    return { error: "failed" };
  }
  revalidateReportViews();
  return { success: true };
}

/**
 * 通報された人のプロフィールの内容を消し、未対応の通報を対応済みにする
 * プロフィールを消して解決
 *
 * BAN より軽い対応。表示名・自己紹介・アバター・SNS を空にし、アカウントと
 * 成績は残す。ユーザー名は消さない（URL とランキングの識別子で、空にできない）
 * — ユーザー名そのものが不適切なら BAN で対応する。
 */
export async function clearProfileAndResolveReportAction(
  reportId: string,
  reason: string,
): Promise<ActionResult<ReportActionError>> {
  const context = await prepare(reportId, reason);
  if ("error" in context) return context;
  const targetId = context.report.targetUserId;
  const ipAddress = await getClientIp();

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(profiles)
        .set({
          displayName: null,
          bio: null,
          avatarUrl: null,
          xUsername: null,
          instagramUsername: null,
          youtubeHandle: null,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, targetId));
      await recordModerationAction(tx, {
        actorId: context.actorId,
        action: ModerationActionKind.ClearProfile,
        targetId,
        reason: context.reason,
        ipAddress,
        metadata: { reportId: context.report.id },
      });
      await resolveOpenReportsFor(
        tx,
        context,
        ipAddress,
        ModerationActionKind.ClearProfile,
      );
    });
  } catch (error) {
    logExternalError("clearProfileAndResolveReport", "failed to clear", error);
    return { error: "failed" };
  }

  // 参照を切った後なので、画像の削除に失敗しても誰も指していない画像が残るだけ
  try {
    await deleteAvatarObject(targetId);
  } catch (error) {
    logExternalError("clearProfileAndResolveReport", "avatar removal", error);
  }
  // ランキングの行は表示名とアバターを持つ
  purgeLeaderboardCache();
  revalidateAdminUsers();
  revalidateReportViews();
  return { success: true };
}

/**
 * 通報を対応不要として閉じる
 * 対応不要
 *
 * この 1 件だけを閉じる（同じ人への他の通報は内容が違いうるので、それぞれ見る）。
 */
export async function dismissReportAction(
  reportId: string,
  reason: string,
): Promise<ActionResult<ReportActionError>> {
  const context = await prepare(reportId, reason);
  if ("error" in context) return context;
  const ipAddress = await getClientIp();
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(reports)
        .set({
          status: "dismissed",
          resolvedBy: context.actorId,
          resolvedAt: new Date(),
        })
        .where(eq(reports.id, context.report.id));
      await recordModerationAction(tx, {
        actorId: context.actorId,
        action: ModerationActionKind.DismissReport,
        targetId: context.report.targetUserId,
        reason: context.reason,
        ipAddress,
        metadata: { reportId: context.report.id },
      });
    });
  } catch (error) {
    logExternalError("dismissReport", "failed to dismiss", error);
    return { error: "failed" };
  }
  revalidateReportViews();
  return { success: true };
}
