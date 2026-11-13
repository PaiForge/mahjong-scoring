/**
 * Supabase Auth の失敗の HTTP ステータスの読み方
 * 認証エラーステータス
 *
 * ログイン・登録・パスワードの再設定・確認メールの再送・Apple でログインの各画面が、
 * 失敗を辞書の文言に写す前に同じ 2 つを見分ける。画面ごとの理由
 * （`weak_password`・`email_not_confirmed` 等のコード）と、どちらを先に見るかは
 * 各画面が持つ。
 *
 * このモジュールは純粋（React Native・Supabase を読まない）。
 */

/**
 * 回数の上限に当たった失敗か（429）
 * 認証回数超過判定
 *
 * @param status - Supabase Auth のエラーの `status`
 */
export function isAuthRateLimited(status: number | undefined): boolean {
  return status === 429;
}

/**
 * サーバーの応答を受け取れなかった失敗か（通信できない）
 * 認証通信断判定
 *
 * supabase-js は応答が無い失敗を `status` 無しか 0 で返す。エラー自体が無い
 * （`error?.status` が undefined）ときも同じ扱いになるので、呼ぶ側は失敗だと
 * 分かっている場面でだけ使う。
 *
 * @param status - Supabase Auth のエラーの `status`
 */
export function isAuthNetworkError(status: number | undefined): boolean {
  return status === undefined || status === 0;
}
