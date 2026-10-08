/** 要求に載せたログイン、または今のログイン（どのユーザーの、どのトークンか） */
export interface Credentials {
  readonly userId: string;
  readonly accessToken: string;
}

/**
 * 401 を受けた後にどうするか
 *
 * - `ignore` — 送った後にログアウト・別ユーザーへの切り替えがあった。今のログインに触らない
 * - `retry` — 同じユーザーのトークンが既に更新されている。そのトークンで送り直す
 * - `refresh` — 送ったトークンがまだ今のもの。共有のクライアントに 1 度更新させてから決める
 */
export type UnauthorizedRecovery =
  | { readonly kind: "ignore" }
  | { readonly kind: "retry"; readonly accessToken: string }
  | { readonly kind: "refresh" };

/**
 * 401 が今のログインに当てはまるかを判断する
 * 401の扱い判定
 *
 * 401 は「送ったトークン」が拒まれたという意味でしかない。応答を待つ間に
 * 別のユーザーでログインし直したり、共有のクライアントがトークンを更新
 * したりしていれば、古い要求の 401 で今のログインを捨ててはいけない。
 *
 * @param sent - 要求に載せたログイン
 * @param current - 401 を受けた時点のログイン。ログアウト済みなら undefined
 */
export function decideUnauthorizedRecovery(
  sent: Credentials,
  current: Credentials | undefined,
): UnauthorizedRecovery {
  if (!current || current.userId !== sent.userId) return { kind: "ignore" };
  if (current.accessToken !== sent.accessToken)
    return { kind: "retry", accessToken: current.accessToken };
  return { kind: "refresh" };
}
