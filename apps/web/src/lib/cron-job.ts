import { NextResponse } from "next/server";

import { isAuthorizedCronRequest } from "./cron-auth";
import { logExternalError } from "./log-error";

/**
 * cron の受け口で走らせるバッチ
 * Cronジョブ定義
 */
export interface CronJob<TResult> {
  /** ログの見出し（`cron/<ルート名>`） */
  readonly tag: string;
  /** 失敗したときにログへ残す文 */
  readonly failureMessage: string;
  /** バッチ本体 */
  readonly run: () => Promise<TResult>;
  /** 成功したときにログへ残す結果の要約（`key=value` の並び） */
  readonly summarize: (result: TResult) => string;
}

/**
 * `/api/cron/*` の受け口の共通の流れ
 * Cronジョブ実行
 *
 * `CRON_SECRET` の検証（合わなければ 401 で走らせない）→ バッチを走らせて結果を
 * そのまま JSON で返す → 失敗はログに残して 500。受け口はどのバッチを走らせるか
 * だけを書く。
 */
export async function runCronJob<TResult>(
  request: Request,
  job: CronJob<TResult>,
): Promise<NextResponse> {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await job.run();
    console.log(`[${job.tag}] ${job.summarize(result)}`);
    return NextResponse.json(result);
  } catch (error) {
    logExternalError(job.tag, job.failureMessage, error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
