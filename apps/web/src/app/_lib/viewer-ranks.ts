import { callApi } from "@/lib/api-client";
import type { RankSlug } from "@/lib/ranks/registry";

/** `/api/ranks/me` のレスポンス本文 */
export interface ViewerRanksResponse {
  readonly rankSlugs: readonly RankSlug[];
}

/**
 * 閲覧中のユーザーの達成済み段級位スラッグを取得する。
 * 未ログインなら空配列、取得失敗は undefined。
 *
 * 昇級試験の説明ページ（静的配信）の開始ボタン出し分けが使う。
 * サーバーコンポーネントで cookie を読むとページが動的レンダリングに
 * 落ちるため、`fetchViewerProfile` と同じくクライアントから Route Handler を
 * 叩く。取得失敗（undefined）を呼び出し側がどう倒すかは呼び出し側の責務 —
 * 表示の出し分けは受験可に倒してよい（受験資格の強制はサーバー側の
 * ガードが持つ）。
 *
 * ビューア段級位取得
 */
export async function fetchViewerRankSlugs(): Promise<
  readonly RankSlug[] | undefined
> {
  const result = await callApi<ViewerRanksResponse>("/api/ranks/me");
  if (!result.ok) return undefined;
  return result.data.rankSlugs;
}
