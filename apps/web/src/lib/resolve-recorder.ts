import "server-only";

import { authenticateAndCheckBan, type AuthUser } from "@/lib/auth";

/**
 * 記録を書いてよい本人を決める
 * 記録者解決
 *
 * 書き込む Action なので認証に加えて BAN を確かめる（{@link authenticateAndCheckBan}）。
 * 未認証はエラーにせず `anonymous` に読み替える — チャレンジ・試験・レッスンは
 * 未ログインでも最後まで受けられ、記録が残らないだけだから。クライアント側で
 * 事前の認証チェックを要らなくし、サーバーの cookie を唯一の認証ソースにする。
 *
 * `@/lib/auth` と別のモジュールに置くのは、テストが `@/lib/auth` を丸ごと
 * 差し替えても、この関数が差し替え後の `authenticateAndCheckBan` を読むため。
 */
export async function resolveRecorder(): Promise<
  | { readonly user: AuthUser }
  | { readonly skipped: "anonymous" }
  | { readonly error: "banned" }
> {
  const auth = await authenticateAndCheckBan();
  if (!("error" in auth)) return { user: auth.user };
  return auth.error === "unauthorized"
    ? { skipped: "anonymous" }
    : { error: auth.error };
}
