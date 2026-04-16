/* eslint-disable turbo/no-undeclared-env-vars -- 開発専用デバッグ機能。turbo のキャッシュキーには入れない。 */

/**
 * デバッグ用の人工遅延
 * 開発専用遅延ユーティリティ
 *
 * 結果画面の Suspense スケルトン表示や CLS を目視確認するために、
 * `AsyncResultBlock` / `AsyncLeaderboardBlock` などサーバー側の非同期ツリー
 * の先頭で呼び出す。`DEBUG_RESULT_DELAY_MS` 環境変数が設定されたときのみ
 * 指定 ms だけ `setTimeout` で遅延させる。
 *
 * 安全対策:
 * - `NODE_ENV === 'production'` の場合は常に no-op（二重防御）
 * - 環境変数未設定・0・NaN はいずれも no-op
 *
 * 使い方:
 *   # .env.local または起動時に指定
 *   DEBUG_RESULT_DELAY_MS=3000 pnpm dev
 *
 * 本番ビルドに残しても害はないよう、プロダクションでは必ず早期 return する。
 */
export async function debugResultDelay(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;

  const raw = process.env.DEBUG_RESULT_DELAY_MS;
  if (!raw) return;

  const ms = Number(raw);
  if (!Number.isFinite(ms) || ms <= 0) return;

  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
