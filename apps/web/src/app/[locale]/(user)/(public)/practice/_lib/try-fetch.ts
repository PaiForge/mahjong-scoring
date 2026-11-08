import { logExternalError } from "@/lib/log-error";

/**
 * 取得の結果。成功なら値を持ち、失敗なら持たない。
 * 取得結果
 *
 * `T` そのものが `undefined` を含むことがある — 「この走行では EXP を付けて
 * いない」「まだ比較できる過去の記録が無い」は、どちらも取得に成功した上での
 * 正常な答えで、値が無いだけ。そこへ取得失敗も `undefined` として混ぜると、
 * 受け取った側は「無い」と「訊けなかった」を見分けられなくなり、DB が落ちて
 * いる画面が記録の無い画面と同じ顔で出る。
 *
 * 失敗を値の不在から分けて持つのがこの型の役目で、どちらの扱いにするかは
 * 受け取る側が決める。
 */
export type Fetched<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false };

/**
 * 取得を試み、例外は記録した上で失敗として返す
 * 取得試行
 *
 * 呼び出し先が投げるのは想定内の失敗（DB・認証サーバーへ届かない）で、
 * 画面としては欠けた部分を諦めて残りを出せばよい。例外のまま上へ流すと
 * ページ全体がエラー境界に落ちるため、ここで値に変える。
 *
 * @param tag - 発生箇所を示す短いタグ（`logExternalError` に渡す）
 * @param what - 何の取得に失敗したかの説明
 * @param fetch - 取得本体
 */
export async function tryFetch<T>(
  tag: string,
  what: string,
  fetch: () => Promise<T>,
): Promise<Fetched<T>> {
  try {
    return { ok: true, value: await fetch() };
  } catch (error) {
    logExternalError(tag, what, error);
    return { ok: false };
  }
}
