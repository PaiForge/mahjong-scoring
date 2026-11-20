import "server-only";

import { getPublicProfileByUsername } from "../db/queries";
import { reports } from "../db/schema";
import { writeAsAccount } from "../users/account-write-lock";
import type { ReportInput } from "@mahjong-scoring/features/reports/report";

import { notifyOperatorOfReport } from "./notify";

/**
 * 通報の受付の結果
 *
 * - `done` — 受け付けた（同じ人への未対応の通報がすでにあれば、行を増やさずに `done`）
 * - `notFound` — そのユーザー名の人がいない（退会・BAN 済みを含む。公開プロフィールが
 *   404 の人は通報の対象にならない）
 * - `self` — 自分自身は通報できない
 * - `accountClosing` — 通報した人の退会を受け付けた後なので書かなかった
 */
export type CreateReportResult =
  "done" | "notFound" | "self" | "accountClosing";

/**
 * 通報を受け付け、運営者に知らせる
 * 通報受付
 *
 * web の Server Action から呼ぶ。認証・回数制限・
 * 入力の検証（`validateReportInput`）は呼び出し側が済ませる。相手は公開の
 * ユーザー名で指す（ブロックと同じ理由）。相手のプロフィールはこの時点の
 * 内容を `snapshot` に写す。
 */
export async function createReport(
  reporterId: string,
  targetUsername: string,
  input: ReportInput,
): Promise<CreateReportResult> {
  // 通報できる相手 = 公開プロフィールが見える相手。条件と写す列を
  // 公開プロフィールの取得と分けて持たない（片方だけ変わると食い違う）
  const target = await getPublicProfileByUsername(targetUsername);
  if (!target) return "notFound";
  if (target.id === reporterId) return "self";

  const { id: targetUserId, ...snapshot } = target;
  const outcome = await writeAsAccount(reporterId, async (tx) => {
    const [inserted] = await tx
      .insert(reports)
      .values({
        reporterId,
        targetUserId,
        reason: input.reason,
        detail: input.detail,
        snapshot,
      })
      .onConflictDoNothing()
      .returning({ id: reports.id });
    return inserted;
  });
  if (!outcome.written) return "accountClosing";
  // 重ねての通報（未対応のものがすでにある）は知らせ直さない
  if (outcome.value !== undefined) {
    await notifyOperatorOfReport({
      reportId: outcome.value.id,
      targetUsername: target.username,
      reason: input.reason,
      detail: input.detail,
    });
  }
  return "done";
}
