import type { NextResponse } from "next/server";

import { jsonPrivate } from "../api-response";
import { logExternalError } from "../log-error";

/**
 * アプリ向け API の CORS ヘッダ
 *
 * @design origin を絞らない
 *
 * ネイティブの fetch は CORS を見ないが、画面確認用の Expo の web 版
 * （localhost:8081）はブラウザから別 origin を叩き、`Authorization` ヘッダを
 * 付けるのでプリフライトも飛ぶ。この API は cookie を読まず
 * （`Access-Control-Allow-Credentials` も付けない）、トークンを持つ者しか
 * 本人として振る舞えないので、どの origin から読まれても渡せるものは増えない。
 */
const MOBILE_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
} as const;

/**
 * アプリ向け API の JSON 応答
 * アプリAPI応答
 *
 * 閲覧者に紐づく応答なので共有キャッシュに乗せない（{@link jsonPrivate}）。
 * エラー応答もここを通す — CORS ヘッダが無いと、Expo の web 版では
 * 401 や 429 がネットワークエラーに化けて理由が読めない。
 */
export function mobileJson<T>(body: T, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  for (const [name, value] of Object.entries(MOBILE_CORS_HEADERS)) {
    headers.set(name, value);
  }
  return jsonPrivate(body, { ...init, headers });
}

/**
 * DB 等の失敗を記録して 500 `serverError` を返す
 * アプリAPIサーバーエラー応答
 *
 * アプリは同じ要求を送り直してよい。引数は {@link logExternalError} と同じ。
 */
export function mobileServerError(
  where: string,
  message: string,
  error: unknown,
): NextResponse {
  logExternalError(where, message, error);
  return mobileJson({ error: "serverError" }, { status: 500 });
}

/**
 * プリフライト（OPTIONS）への応答
 * アプリAPIプリフライト応答
 *
 * アプリ向けの各 Route Handler は `export const OPTIONS = mobilePreflight;` で公開する。
 */
export function mobilePreflight(): Response {
  return new Response(null, { status: 204, headers: MOBILE_CORS_HEADERS });
}
