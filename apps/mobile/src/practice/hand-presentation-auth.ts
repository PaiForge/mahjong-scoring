import type { HandPresentationAuth } from "@mahjong-scoring/features/board/use-hand-presentation";

import type { AuthStatus } from "../auth/use-auth";

/**
 * アプリのログイン状態を、手牌の見せ方の準備に渡す形にする
 * 手牌表示用認証状態変換
 *
 * 接続先の無いビルド（`unavailable`）は未ログインと同じに扱う。ログイン中なのに
 * ユーザーがまだ無い瞬間は、未ログインと決めずに読み込み中として待つ。
 *
 * @param status ログインの状態
 * @param userId ログイン中のユーザー ID
 */
export function toHandPresentationAuth(
  status: AuthStatus,
  userId: string | undefined,
): HandPresentationAuth {
  if (status === "unavailable" || status === "signedOut") {
    return { kind: "signedOut" };
  }
  if (status === "loading" || userId === undefined) return { kind: "loading" };
  return { kind: "signedIn", userId };
}
