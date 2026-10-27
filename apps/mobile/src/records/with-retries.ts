import {
  wait,
  withRetries as retryWhile,
} from "@mahjong-scoring/features/session/with-retries";

import { isRetryableFailure } from "./failure-policy";
import type { RecordsApiResult } from "./records-api";

export { wait };

/**
 * 通信の失敗だけを、間を空けて数回送り直す
 * 通信の再送
 *
 * サーバーが断った（4xx 等）失敗は送り直さず、そのまま返す。送り直す失敗の
 * 分け方は `failure-policy.ts`、間隔と仕組みは features の `withRetries`
 * （web の結果送信と同じ）。
 *
 * @param send - 1 回の送信
 * @param delaysMs - 送り直すまでの待ち時間の列（長さが再送の回数）
 */
export function withRetries<T>(
  send: () => Promise<RecordsApiResult<T>>,
  delaysMs?: readonly number[],
): Promise<RecordsApiResult<T>> {
  return retryWhile(
    send,
    (result) => "error" in result && isRetryableFailure(result.error),
    delaysMs,
  );
}
