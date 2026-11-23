import type { BenefitGrant, Purchase } from "@/lib/db";

import { planStatusOf, purchaseBlockOf } from "./plan-status";

/**
 * 料金ページへ返す「いま追加購入を売らない理由」（`PurchaseBlock` の JSON の形）
 * 追加購入の停止理由（応答）
 *
 * 語彙は `plan-status.ts` の `PurchaseBlock` と同じで、期限だけ ISO 8601 の文字列。
 */
export type ViewerPurchaseBlock =
  | { readonly kind: "none" }
  | { readonly kind: "lifetime" }
  | {
      readonly kind: "until";
      /** 止めている購入の中で最も遅い期限（ISO 8601）。これを過ぎれば買える */
      readonly until: string;
      /** 止めている購入のどれかが開始済みか（false は開始待ちだけ） */
      readonly inUse: boolean;
    };

/**
 * 料金ページの購入ボタンの出し分けに要る、閲覧者の購入の状態
 * 閲覧者のプラン状態
 *
 * プラン状況の全体（`PlanStatus`）は返さない — 料金ページが決めるのは「どの売り方の
 * ボタンを出すか」で、それは {@link ViewerPurchaseBlock} だけで決まる。状況から
 * 要るのは「運営からの付与で Pro か」だけなので、その 1 点を `granted` に持つ。
 * 購入状況の全体はマイページ（`/mypage/plan`）が出す。
 */
export interface ViewerPlan {
  readonly purchaseBlock: ViewerPurchaseBlock;
  /**
   * 手動付与で Pro のとき（`planStatusOf` が `granted`）だけ持つ。`until` は付与の
   * 期限（ISO 8601）で、無期限なら無い。付与は購入を止めない（`offersPurchase` の
   * TSDoc）ので、料金ページは購入ボタンを出したまま、付与中であることを添える。
   */
  readonly granted?: { readonly until?: string };
}

/** `/api/plan/me` のレスポンス本文。未ログインは `plan: null` */
export interface ViewerPlanResponse {
  readonly plan: ViewerPlan | null;
}

/**
 * 購入と付与の行から、料金ページへ返す状態を組み立てる
 * 閲覧者のプラン状態の導出
 *
 * 販売可否はサーバーの拒否と同じ規則（`purchaseBlockOf`）、付与中かはマイページと
 * 同じ規則（`planStatusOf`）で決める。条件をここに書き直さない。
 */
export function viewerPlanOf(
  purchases: readonly Purchase[],
  grants: readonly BenefitGrant[],
  now: Date,
): ViewerPlan {
  const block = purchaseBlockOf(purchases, now);
  const status = planStatusOf(purchases, grants, now);
  return {
    purchaseBlock:
      block.kind === "until"
        ? { ...block, until: block.until.toISOString() }
        : block,
    ...(status.kind === "granted"
      ? {
          granted: status.until ? { until: status.until.toISOString() } : {},
        }
      : {}),
  };
}
