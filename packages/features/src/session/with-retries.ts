/**
 * 通信の失敗を送り直すまでの待ち時間（ミリ秒）の既定。尽きたら呼び出し側に
 * 任せる（利用者に再接続を促す・結果画面へ進む等）
 * 再送の間隔
 *
 * 短い間隔で 3 回なのは、送り直しで救えるのは瞬間的な途切れ（回線の
 * 切り替わり・サーバーの再起動・別のインスタンスなら通る回数制限）だけで、
 * 数秒待っても戻らない障害は送り直しでは救えないため。合計で 3.5 秒ほど
 * 待たせるだけに留める
 */
export const RETRY_DELAYS_MS = [500, 1000, 2000] as const;

/** 指定ミリ秒待つ */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 送り直してよい結果だけを、間を空けて数回送り直す
 * 通信の再送
 *
 * 結果が「送り直してよい」かは呼び出し側の `shouldRetry` が決める（アプリは
 * 通信や一時的な障害、web はチャレンジの Action の失敗の表 `challenge-failure-policy.ts`）。
 * サーバーが断った（もう送っても変わらない）結果はそのまま返す。`send` が
 * 投げる例外は扱わない — 例外も送り直したいなら `send` の中で結果に畳む。
 *
 * @param send - 1 回の送信
 * @param shouldRetry - この結果なら送り直してよいか
 * @param delaysMs - 送り直すまでの待ち時間の列（長さが再送の回数）
 */
export async function withRetries<T>(
  send: () => Promise<T>,
  shouldRetry: (result: T) => boolean,
  delaysMs: readonly number[] = RETRY_DELAYS_MS,
): Promise<T> {
  let result = await send();
  for (const delay of delaysMs) {
    if (!shouldRetry(result)) break;
    await wait(delay);
    result = await send();
  }
  return result;
}
