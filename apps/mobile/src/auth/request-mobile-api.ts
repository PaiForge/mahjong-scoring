import {
  apiFailureOf,
  callMobileApi,
  errorOf,
  type ApiFailure,
  type MobileApiInit,
} from "./api-client";
import { readJson } from "./read-json";

/** アプリ向け API の結果（成功の値か、失敗の理由） */
export type MobileApiResult<T, F> =
  { readonly value: T } | { readonly error: F };

/**
 * 要求を送り、成功なら応答を検証して返す
 * アプリAPI要求
 *
 * 送れなかった・名義が変わっていた（{@link callMobileApi} の失敗）はその理由、
 * 成功の本文が契約の形でなければ `unknown`、失敗の応答は `failureOf` で丸める。
 *
 * @param path - API のパス
 * @param init - 要求の指定。端末に預けた記録を送るので、名義（`asUser`）を必ず渡す
 * @param parse - 成功の本文を契約の形に検証する。形が違えば undefined
 * @param failureOf - 失敗の応答を理由に丸める
 */
export async function requestMobileApi<T, F>(
  path: string,
  init: MobileApiInit & { readonly asUser: string },
  parse: (body: unknown) => T | undefined,
  failureOf: (response: Response) => Promise<F>,
): Promise<MobileApiResult<T, ApiFailure | F>> {
  const response = await callMobileApi(path, init);
  if (typeof response === "string") return { error: response };
  if (response.ok) {
    const value = parse(await readJson(response));
    return value === undefined ? { error: "unknown" } : { value };
  }
  return { error: await failureOf(response) };
}

/**
 * 失敗の応答を、API 固有の理由・サーバーの一時的な失敗・共通の理由の順に丸める
 * アプリAPI失敗の丸め
 *
 * 本文の `error` が API 固有の理由なら、その理由（503 の「Apple に届かない」
 * 等を含む）。そうでない 5xx（503 を除く）は `serverError` で、同じ要求を
 * 送り直してよい。それ以外は共通の理由（{@link apiFailureOf}）。
 *
 * @param response - 失敗の応答
 * @param isDomainError - API 固有の理由かを判定する型ガード
 */
export async function domainFailureOf<E>(
  response: Response,
  isDomainError: (value: unknown) => value is E,
): Promise<E | ApiFailure | "serverError"> {
  const error = await errorOf(response.clone());
  if (isDomainError(error)) return error;
  if (response.status >= 500 && response.status !== 503) return "serverError";
  return apiFailureOf(response);
}
