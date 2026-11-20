import "server-only";

import { Resend } from "resend";

import { SITE_NAME } from "@/app/_lib/metadata";
import { SITE_URL } from "@/config";
import { logExternalError } from "@/lib/log-error";
import { readOperatorMailConfig } from "@/lib/operator-mail";
import type {
  ProblemReportContext,
  ProblemReportReason,
} from "@mahjong-scoring/features/problem-reports/problem-report";

/** メールに出す理由の名前（運営者だけが読むので辞書を通さない） */
const REASON_LABELS: Record<ProblemReportReason, string> = {
  wrong_score: "点数が違う",
  wrong_yaku: "役・翻数が違う",
  wrong_fu: "符が違う",
  wrong_machi: "待ち牌が違う",
  invalid_board: "盤面がおかしい",
  other: "その他",
};

/** メールに出す画面の名前（運営者だけが読むので辞書を通さない） */
const CONTEXT_LABELS: Record<ProblemReportContext, string> = {
  "agari-score": "和了形の点数計算",
  "tenpai-score": "聴牌形の点数計算",
  "daily-problem": "本日の問題",
};

/** 通知に載せる報告の中身 */
export interface ProblemReportNotification {
  readonly reportId: string;
  readonly reason: ProblemReportReason;
  readonly detail: string | null;
  readonly context: ProblemReportContext;
}

/**
 * 問題の報告が届いたことを運営者にメールで知らせる
 * 問題報告通知
 *
 * 宛先はお問い合わせの受信先（`CONTACT_TO_EMAIL`）と同じ。報告した人と盤面は
 * 書かない（管理画面で見る）。呼ぶのは、その問題に未対応の報告が他に無いときだけ
 * （`create-problem-report.ts`）で、同じ誤りに報告が集まってもメールは 1 通になる。
 *
 * 送れなくても報告の受付は失敗にしない — 報告は DB に残り、管理画面の
 * 未対応の一覧に出る。失敗（未設定・送信エラー）はサーバーログに残す。
 */
export async function notifyOperatorOfProblemReport(
  report: ProblemReportNotification,
): Promise<void> {
  const mail = readOperatorMailConfig();
  if (!mail) {
    console.error(
      "[notifyOperatorOfProblemReport] RESEND_API_KEY / CONTACT_TO_EMAIL が未設定のため問題の報告を知らせられません",
    );
    return;
  }
  const reason = REASON_LABELS[report.reason];
  const lines = [
    "出題した問題の誤りが報告されました。",
    "",
    `理由: ${reason}`,
    `詳細: ${report.detail ?? "（なし）"}`,
    `画面: ${CONTEXT_LABELS[report.context]}`,
    "",
    `${SITE_URL}/admin/problem-reports/${report.reportId}`,
  ];
  try {
    const { error } = await new Resend(mail.apiKey).emails.send({
      from: mail.from,
      to: mail.to,
      subject: `[${SITE_NAME}] 問題の報告: ${reason}`,
      text: lines.join("\n"),
    });
    if (error) {
      logExternalError(
        "notifyOperatorOfProblemReport",
        "Resend API error",
        error,
      );
    }
  } catch (cause) {
    logExternalError(
      "notifyOperatorOfProblemReport",
      "送信に失敗しました",
      cause,
    );
  }
}
