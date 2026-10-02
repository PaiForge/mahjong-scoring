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
 * この購入がある間は追加購入を売らないか（販売可否の規則）
 * 追加購入の禁止
 *
 * 取り消されておらず、期限内か永久の購入。開始待ち（`scheduled`）も含む —
 * 重ね買いを許すと先行分の返金時に後続の開始日をどうするかが生じるため、
 * 有効な購入がある間は売り方を問わず売らない。手動付与は購入ではないので
 * この規則の対象外（付与だけの人は買える）。特典の有無の判定
 * （`lib/entitlements/has-benefit.ts`）とは別の問いなので混ぜない。
 *
 * 購入手続きの SQL 側（`checkout-state.ts` の `hasUnexpiredPurchase`）と
 * 同じ条件。マイページの「購入する」の表示とサーバーの拒否が食い違わないよう、
 * 画面側はこちらを使い、条件を直接書き直さない。
 */
export function blocksNewPurchase(purchase: Purchase, now: Date): boolean {
  const state = purchaseStateOf(purchase, now);
  return state === "active" || state === "scheduled";
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
