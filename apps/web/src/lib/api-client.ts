/**
 * 内部 Route Handler の呼び出し規約（クライアント側）
 * 内部APIクライアント
 *
 * サーバー側の契約は `lib/api-auth.ts` の `authorizeApiRequest` に一元化されており、
 * 失敗時は必ず `{ error: string }` を返す（429 は `"rateLimited"`、401 は `"unauthorized"`）。
 * このモジュールはその契約を消費する側の唯一の定義で、各呼び出し元が
 * `res.ok` 判定とエラーコード取り出しを書き直さずに済むようにする。
 */

/** 内部 API 呼び出しの結果 */
export type ApiResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: string };

/** レートリミット時に返るエラーコード（`authorizeApiRequest` が 429 で返す） */
export const API_ERROR_RATE_LIMITED = "rateLimited";

/** 未認証時に返るエラーコード（`authorizeApiRequest` が 401 で返す） */
export const API_ERROR_UNAUTHORIZED = "unauthorized";

/** 本文を読めない・エラーコードが無いときのフォールバック */
export const API_ERROR_UNKNOWN = "unknown";

/**
 * 内部 API を呼び出し、成功時は本文を、失敗時はエラーコードを返す
 * 内部API呼び出し
 *
 * ネットワーク例外も `{ ok: false }` に正規化するため、呼び出し側で
 * try/catch を書く必要はない。
 *
 * @param path - `/api/...` のパス
 * @param init - fetch のオプション
 */
export async function callApi<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    return { ok: false, error: API_ERROR_UNKNOWN };
  }

  if (!res.ok) {
    // 本文が空・非 JSON でもエラーコードは必ず返す
    const body = (await res.json().catch(() => ({}))) as {
      error?: unknown;
    };
    const error =
      typeof body.error === "string" && body.error.length > 0
        ? body.error
        : API_ERROR_UNKNOWN;
    return { ok: false, error };
  }

  // 204 や本文なしの成功も許容する
  const data = (await res.json().catch(() => undefined)) as T;
  return { ok: true, data };
}
