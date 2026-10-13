import type { NextResponse } from "next/server";

import { runCronJob } from "@/lib/cron-job";
import { processPendingAccountDeletions } from "@/lib/users/delete-account";

/**
 * 終わっていない退会を再開するバッチの受け口
 * 退会再開Cron
 *
 * @description
 * 退会は受付の直後にその場で進めるので、ふつうはここに来る前に終わっている。
 * Storage・Auth の一時障害で残った工程だけを、本人のログインに頼らずに
 * ここで終わらせる（処理の中身は `lib/users/delete-account.ts`）。
 * `vercel.json` の `crons` が 1 日 1 回呼ぶ。手で叩くときも同じヘッダを付ける:
 *
 * ```
 * curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/process-account-deletions
 * ```
 *
 * 何度呼んでも二重に処理しない（工程は冪等で、処理中の要求は貸し出しで飛ばす）。
 */
export function GET(request: Request): Promise<NextResponse> {
  return runCronJob(request, {
    tag: "cron/process-account-deletions",
    failureMessage: "failed to process pending deletions",
    run: processPendingAccountDeletions,
    summarize: (result) =>
      `processed=${result.processed} completed=${result.completed}`,
  });
}
