import { NextResponse } from "next/server";

import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { logExternalError } from "@/lib/log-error";
import { notifyExpiredPlans } from "@/lib/notifications/plan-expiry";

/**
 * Pro の期限切れを本人に通知する日次バッチの受け口
 * 期限切れ通知Cron
 *
 * @description
 * `vercel.json` の `crons` が 1 日 1 回呼ぶ。処理の中身は
 * `lib/notifications/plan-expiry.ts`。ここは `CRON_SECRET` の検証と結果の
 * 応答だけを行う。手で叩いて確かめるときも同じヘッダを付ける:
 *
 * ```
 * curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/notify-plan-expiry
 * ```
 *
 * 何度呼んでも通知は増えない（同じ購入行には 1 通）。失敗は 500 を返して
 * ログに残す。Vercel の cron は失敗しても再試行しないが、翌日の実行が
 * 7 日の窓で拾い直す。
 */
export async function GET(request: Request): Promise<NextResponse> {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await notifyExpiredPlans();
    console.log(
      `[cron/notify-plan-expiry] expired=${result.expired} stillActive=${result.stillActive} candidates=${result.candidates} notified=${result.notified}`,
    );
    return NextResponse.json(result);
  } catch (error) {
    logExternalError(
      "cron/notify-plan-expiry",
      "failed to notify expired plans",
      error,
    );
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
