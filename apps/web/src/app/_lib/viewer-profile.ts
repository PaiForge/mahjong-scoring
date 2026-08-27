import { callApi } from "@/lib/api-client";

/**
 * ヘッダーのアカウント表示に必要なプロフィール情報。
 * ビューアプロフィール
 */
export interface ViewerProfile {
  readonly avatarUrl: string | null;
  /** 表示名（未設定ならユーザー名）。アバター画像の alt に使う */
  readonly name: string;
}

/** `/api/profile/me` のレスポンス本文 */
export interface ViewerProfileResponse {
  readonly profile: ViewerProfile | null;
}

/**
 * 閲覧中のユーザーのプロフィール表示情報を取得する。
 * 未ログイン・プロフィール未作成（仮登録）・取得失敗はいずれも undefined。
 *
 * アバター URL はクライアントの Supabase セッションに載らないため、サーバーの
 * `profiles` を引く必要がある。ルートレイアウトで cookie を読むとその配下すべてが
 * 動的レンダリングになり静的化が効かなくなるため、サーバーコンポーネントから
 * props で渡す形は採らない。Server Action ではなく Route Handler を叩くのは、
 * Server Action の応答が現在のページの再レンダリング（RSC ペイロード）を伴い、
 * 単なる読み取りには重いため。
 *
 * 取得失敗を undefined に倒すことで、アバターの代わりに既定のユーザーアイコンが
 * 出るだけになり、認証状態の表示自体は壊れない。
 *
 * ビューアプロフィール取得
 */
export async function fetchViewerProfile(): Promise<ViewerProfile | undefined> {
  const result = await callApi<ViewerProfileResponse>("/api/profile/me");
  if (!result.ok) return undefined;
  return result.data.profile ?? undefined;
}
