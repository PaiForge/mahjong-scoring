import type { BenefitGrant, Purchase } from "@/lib/db";

import { PurchaseKind } from "./plans";

/**
 * 購入記録と手動付与から導く「いまの状態」
 * プラン状態
 *
 * - `lifetime` — 有効な買い切りを持つ
 * - `pass` — 有効なパスを持つ。`until` は現在開始済みの購入の期限
 * - `granted` — 手動付与で Pro。`until` は期限、無期限なら undefined
 * - `free` — どれも無い
 *
 * 特典の有無は `lib/entitlements/has-benefit.ts` が決める。ここは
 * マイページの表示のための要約で、判定には使わない。
 *
 * パスと期限付きの付与が重なるときは、後に切れる方の種類で出す
 * （「〜まで」が Pro の終わりを指すようにする）。
 */
export type PlanStatus =
  | { readonly kind: "lifetime" }
  | { readonly kind: "pass"; readonly until: Date }
  | { readonly kind: "granted"; readonly until: Date | undefined }
  | { readonly kind: "free" };

/**
 * 購入履歴 1 行の状態
 * 購入状態
 *
 * - `refunded` — 取り消し済み（返金・不正）
 * - `active` — 開始済みで有効
 * - `scheduled` — 旧実装などの開始待ちの購入
 * - `expired` — 期限切れ
 */
export type PurchaseState = "refunded" | "active" | "scheduled" | "expired";

/** 購入の状態（表示用） */
export function purchaseStateOf(purchase: Purchase, now: Date): PurchaseState {
  if (purchase.revokedAt) return "refunded";
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
  grants: readonly BenefitGrant[],
  now: Date,
): PlanStatus {
  const validPurchases = purchases.filter(
    (purchase) => purchaseStateOf(purchase, now) === "active",
  );
  if (
    validPurchases.some((purchase) => purchase.kind === PurchaseKind.Lifetime)
  ) {
    return { kind: "lifetime" };
  }

  const activeGrants = grants.filter(
    (grant) =>
      grant.startsAt <= now && benefitGrantStateOf(grant, now) === "active",
  );
  if (activeGrants.some((grant) => !grant.expiresAt)) {
    return { kind: "granted", until: undefined };
  }

  // 開始済みの購入と付与だけを現在の状態に含める。開始待ちは履歴に表示する。
  // 種類は最後の期限を持つ方（パス / 付与）
  let latest:
    { readonly kind: "pass" | "granted"; readonly until: Date } | undefined;
  const consider = (kind: "pass" | "granted", expiresAt: Date | null) => {
    if (!expiresAt || expiresAt <= now) return;
    if (!latest || expiresAt > latest.until)
      latest = { kind, until: expiresAt };
  };
  for (const purchase of validPurchases) consider("pass", purchase.expiresAt);
  for (const grant of activeGrants) consider("granted", grant.expiresAt);

  return latest ?? { kind: "free" };
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
