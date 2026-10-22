import { isRetryableFailure } from "./failure-policy";
import type { RecordsApiResult } from "./records-api";

/** 通信の失敗を送り直す間隔（ミリ秒）。尽きたら利用者に再接続を任せる */
const RETRY_DELAYS_MS = [500, 1000, 2000] as const;

/** 指定ミリ秒待つ */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 通信の失敗だけを、間を空けて数回送り直す
 * 通信の再送
 *
 * サーバーが断った（4xx 等）失敗は送り直さず、そのまま返す。
 */
export async function withRetries<T>(
  send: () => Promise<RecordsApiResult<T>>,
): Promise<RecordsApiResult<T>> {
  let result = await send();
  for (const delay of RETRY_DELAYS_MS) {
    if (!("error" in result) || !isRetryableFailure(result.error)) break;
    await wait(delay);
    result = await send();
  }
  return result;
}
