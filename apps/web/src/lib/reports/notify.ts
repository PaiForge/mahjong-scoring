import "server-only";

import { Resend } from "resend";

import { SITE_NAME } from "@/app/_lib/metadata";
import { SITE_URL } from "@/config";
import { logExternalError } from "@/lib/log-error";
import type { ReportReason } from "@mahjong-scoring/features/reports/report";

/** Resend で送信元ドメインを認証していない環境向けの送信元（お問い合わせと同じ） */
const FALLBACK_FROM_EMAIL = "onboarding@resend.dev";

/** メールの本文に出す理由の名前（運営者だけが読むので辞書を通さない） */
const REASON_LABELS: Record<ReportReason, string> = {
  inappropriate_profile: "不適切な表示名・自己紹介・画像",
  harassment: "誹謗中傷・嫌がらせ",
  impersonation: "なりすまし",
  spam: "宣伝・スパム",
  cheating: "不正な成績",
  other: "その他",
};

/** 通知に載せる通報の中身 */
export interface ReportNotification {
  readonly reportId: string;
  readonly targetUsername: string;
  readonly reason: ReportReason;
  readonly detail: string | null;
}

/**
 * 通報が届いたことを運営者にメールで知らせる
 * 通報通知
 *
 * 利用規約の「通報を 24 時間以内に確認する」を、管理画面を開かなくても
 * 守れるようにするための知らせ。宛先はお問い合わせの受信先
 * （`CONTACT_TO_EMAIL`）と同じ。通報した人は書かない（管理画面で見る）。
 *
 * 送れなくても通報の受付は失敗にしない — 通報は DB に残り、管理画面の
 * 未対応の一覧に出る。失敗は Sentry に残して気づけるようにする。
 */
export async function notifyOperatorOfReport(
  report: ReportNotification,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error(
      "[notifyOperatorOfReport] RESEND_API_KEY / CONTACT_TO_EMAIL が未設定のため通報を知らせられません",
    );
    return;
  }
  const adminUrl = `${SITE_URL}/admin/reports/${report.reportId}`;
  const lines = [
    `@${report.targetUsername} が通報されました。24 時間以内に確認してください。`,
    "",
    `理由: ${REASON_LABELS[report.reason]}`,
    `詳細: ${report.detail ?? "（なし）"}`,
    "",
    adminUrl,
  ];
  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: process.env.CONTACT_FROM_EMAIL || FALLBACK_FROM_EMAIL,
      to,
      subject: `[${SITE_NAME}] 通報: @${report.targetUsername}`,
      text: lines.join("\n"),
    });
    if (error) {
      logExternalError("notifyOperatorOfReport", "Resend API error", error);
    }
  } catch (cause) {
    logExternalError("notifyOperatorOfReport", "送信に失敗しました", cause);
  }
}
