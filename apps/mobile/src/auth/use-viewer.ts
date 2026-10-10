import { useAuth } from "./use-auth";

/**
 * ゲストも読める画面の閲覧者
 *
 * - `pending` — ログインの状態を読んでいる（読み終えるまで要求を送らない）
 * - `ready` — 読み終えた。`viewerId` はログイン中のユーザー、ゲストなら undefined
 */
export type Viewer =
  | { readonly kind: "pending" }
  | { readonly kind: "ready"; readonly viewerId: string | undefined };

/**
 * ランキング・公開プロフィールのように、ゲストも読めて、ログイン中なら
 * 中身が変わる画面の閲覧者を返す
 * 閲覧者フック
 *
 * 起動直後は保存したセッションを読み終えるまで `pending`。そこでゲストとして
 * 読むと、ログイン中なのに本人の順位が無い応答を一度見せてしまう。
 */
export function useViewer(): Viewer {
  const { status, user } = useAuth();
  if (status === "loading") return { kind: "pending" };
  return {
    kind: "ready",
    viewerId: status === "signedIn" ? user?.id : undefined,
  };
}
