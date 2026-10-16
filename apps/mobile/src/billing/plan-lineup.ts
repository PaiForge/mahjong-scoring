import type { MobilePlanOffer } from "@mahjong-scoring/features/billing/mobile-api";

/**
 * アプリで並べる売り方の組み合わせ
 * 売り方の並び
 *
 * - `both` — 30 日パスと買い切り。販売していない（`offers` が空）ときもこれに倒す
 *   （文言は従来どおり両方を前提にしたもの）
 * - `lifetimeOnly` — 買い切りだけ。サーバーはパスの Product ID を任意にしており
 *   （web の `lib/billing/apple/env.ts`）、外すとアプリには買い切りだけが届く
 */
export type PlanLineup = "both" | "lifetimeOnly";

/**
 * 販売中の商品から、プラン画面の文言をどちらの並びで出すかを決める
 * 売り方の並び判定
 *
 * 「どちらも同じ Pro 機能」「30 日パスは…」のような 2 商品を前提にした文言を、
 * 買い切りしか売っていない間に出さないため。パスがあれば `both`。
 */
export function planLineupOf(offers: readonly MobilePlanOffer[]): PlanLineup {
  if (offers.length === 0) return "both";
  return offers.some(({ key }) => key === "pass") ? "both" : "lifetimeOnly";
}

/**
 * 「ご購入前に」の項目（辞書 `mobilePlan.notes` のキー）を並びに応じて返す
 * 購入前の注意の項目
 *
 * 買い切りだけのときはパスの項目を落とし、自動更新の項目を買い切りだけの文言にする。
 */
export function planNoteKeysOf(lineup: PlanLineup) {
  return lineup === "lifetimeOnly"
    ? ([
        "noAutoRenewLifetimeOnly",
        "snapshot",
        "noRefund",
        "deletion",
        "appleBilling",
      ] as const)
    : ([
        "noAutoRenew",
        "pass",
        "snapshot",
        "noRefund",
        "deletion",
        "appleBilling",
      ] as const);
}
