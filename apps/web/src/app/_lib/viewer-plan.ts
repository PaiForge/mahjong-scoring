import { callApi } from "@/lib/api-client";
import type { ViewerPlan, ViewerPlanResponse } from "@/lib/billing/viewer-plan";

/**
 * 閲覧中のユーザーの購入の状態（追加購入を売るか・付与中か）を取得する。
 * 未ログインは null、取得失敗は undefined。
 *
 * 料金ページ（静的配信）の購入ボタンの出し分けが使う。サーバーコンポーネントで
 * cookie を読むとページが動的レンダリングに落ちるため、`fetchViewerRankSlugs` と
 * 同じくクライアントから Route Handler を叩く。取得失敗（undefined）は購入ボタンへ
 * 倒してよい — 有効な購入があれば Checkout の作成がサーバーで拒む。
 *
 * ビューアプラン状態取得
 */
export async function fetchViewerPlan(): Promise<
  ViewerPlan | null | undefined
> {
  const result = await callApi<ViewerPlanResponse>("/api/plan/me");
  if (!result.ok) return undefined;
  return result.data.plan;
}
