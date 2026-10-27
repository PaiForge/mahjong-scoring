import "server-only";

import { authenticateAndCheckBan, isVerifiedUserUnavailable } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth-user";

/**
 * 記録を書けない理由
 * 記録者エラーコード
 *
 * - `banned`: BAN されたユーザー。記録しない
 * - `authUnavailable`: 認証サーバーが答えられず、ログイン済みかどうかが
 *   分からなかった。未ログインではないので `anonymous` にしない — 読み替えると
 *   記録が「期待された no-op」として黙って捨てられる。送り直せば通る失敗
 *   （アプリの `authUnavailable` と同じ扱い）
 */
export type RecorderErrorCode = "banned" | "authUnavailable";

/**
 * 記録を書いてよい本人を決める
 * 記録者解決
 *
 * 書き込む Action なので認証に加えて BAN を確かめる（{@link authenticateAndCheckBan}）。
 * 未認証はエラーにせず `anonymous` に読み替える — チャレンジ・試験・レッスンは
 * 未ログインでも最後まで受けられ、記録が残らないだけだから。クライアント側で
 * 事前の認証チェックを要らなくし、サーバーの cookie を唯一の認証ソースにする。
 *
 * ただし認証サーバーに問い合わせられなかった `unauthorized` は `anonymous` に
 * しない（{@link RecorderErrorCode} の `authUnavailable`）。`isVerifiedUserUnavailable`
 * は同じリクエスト内の問い合わせの結果を読むだけで、往復は増えない。
 *
 * `@/lib/auth` と別のモジュールに置くのは、テストが `@/lib/auth` を丸ごと
 * 差し替えても、この関数が差し替え後の `authenticateAndCheckBan` を読むため。
 */
export async function resolveRecorder(): Promise<
  | { readonly user: AuthUser }
  | { readonly skipped: "anonymous" }
  | { readonly error: RecorderErrorCode }
> {
  const auth = await authenticateAndCheckBan();
  if (!("error" in auth)) return { user: auth.user };
  if (auth.error !== "unauthorized") return { error: auth.error };
  if (await isVerifiedUserUnavailable()) return { error: "authUnavailable" };
  return { skipped: "anonymous" };
}
