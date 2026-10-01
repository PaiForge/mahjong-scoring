import type { BenefitGrant, Purchase } from "@/lib/db";

import { PurchaseKind } from "./plans";

/**
 * 購入記録から導く「いまの状態」
 * プラン状態
 *
 * - `lifetime` — 有効な買い切りを持つ
 * - `pass` — 有効なパスを持つ。`until` は（重ね買いを含めた）最後の期限
 * - `free` — どちらも無い
 *
 * 特典の有無は `lib/entitlements/has-benefit.ts` が決める。ここは
 * マイページの表示のための要約で、判定には使わない。
 */
export type PlanStatus =
  | { readonly kind: "lifetime" }
  | { readonly kind: "pass"; readonly until: Date }
  | { readonly kind: "free" };

/**
 * 購入履歴 1 行の状態
 * 購入状態
 *
 * - `refunded` — 取り消し済み（返金・不正）
 * - `active` — 有効（買い切りは常にこれ）
 * - `scheduled` — 重ね買いで、前のパスの期限から始まる
 * - `expired` — 期限切れ
 */
export type PurchaseState = "refunded" | "active" | "scheduled" | "expired";

/** 購入の状態（表示用） */
export function purchaseStateOf(purchase: Purchase, now: Date): PurchaseState {
  if (purchase.revokedAt) return "refunded";
  if (purchase.kind === PurchaseKind.Lifetime) return "active";
  if (purchase.expiresAt && purchase.expiresAt <= now) return "expired";
  if (purchase.startsAt > now) return "scheduled";
  return "active";
}

/**
 * 手動付与 1 行の状態
 * 付与状態
 *
 * - `revoked` — 取り消し済み
 * - `expired` — 期限切れ
 * - `active` — 有効（無期限は常にこれ）
 *
 * 付与は常に付与時刻から始まるので、購入の `scheduled` に当たる状態は無い。
 * マイページと管理画面の一覧の両方が使う。
 */
export type BenefitGrantState = "revoked" | "expired" | "active";

/** 付与の状態（表示用） */
export function benefitGrantStateOf(
  grant: BenefitGrant,
  now: Date,
): BenefitGrantState {
  if (grant.revokedAt) return "revoked";
  if (grant.expiresAt && grant.expiresAt <= now) return "expired";
  return "active";
}

/** いまの状態（表示用） */
export function planStatusOf(
  purchases: readonly Purchase[],
  now: Date,
): PlanStatus {
  const valid = purchases.filter((purchase) => !purchase.revokedAt);
  if (valid.some((purchase) => purchase.kind === PurchaseKind.Lifetime)) {
    return { kind: "lifetime" };
  }

  // 開始待ちのパスも含めて、最後の期限を「〜まで」に出す
  let until: Date | undefined;
  for (const purchase of valid) {
    if (!purchase.expiresAt || purchase.expiresAt <= now) continue;
    if (!until || purchase.expiresAt > until) until = purchase.expiresAt;
  }
  return until ? { kind: "pass", until } : { kind: "free" };
}

/** 日付を「2026/10/31」の形にする（JST）。表の列幅を取らない */
export function formatPlanDateShort(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(date);
}

/** 日付を「2026年10月31日」の形にする（JST） */
export function formatPlanDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(date);
}
