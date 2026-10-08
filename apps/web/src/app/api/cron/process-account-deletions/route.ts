import { NextResponse } from "next/server";

import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { logExternalError } from "@/lib/log-error";
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
export async function GET(request: Request): Promise<NextResponse> {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await processPendingAccountDeletions();
    console.log(
      `[cron/process-account-deletions] processed=${result.processed} completed=${result.completed}`,
    );
    return NextResponse.json(result);
  } catch (error) {
    logExternalError(
      "cron/process-account-deletions",
      "failed to process pending deletions",
      error,
    );
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
