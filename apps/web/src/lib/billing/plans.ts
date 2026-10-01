/**
 * 有料プランの定義 — プラン・売り方・特典
 * プラン定義
 *
 * このモジュールは純粋（`server-only` も DB も Stripe も触らない）。UI が
 * 特典の出し分けに `PlanBenefit` を使うため、クライアントからも import できる
 * 必要がある。Stripe の Price ID との対応は環境変数に依るので
 * `lib/billing/env.ts` に置く。
 *
 * 3 層の関係:
 *
 * - **プラン**（{@link PLANS}）は特典の集合に名前を付けたもの。いまは `pro` の 1 つ
 * - **売り方**（{@link OfferDefinition}）はプランを買う単位で、Stripe の Price 1 つに
 *   対応する。期間パス（有効期限あり・自動更新なし）と買い切り（永久）の 2 つ
 * - **特典**（{@link PlanBenefit}）は機能側が判定に使う語彙。購入行にはこの値を
 *   購入時点のスナップショットとして保存する（`purchases.benefits`）
 *
 * 特典を増やす手順: `PlanBenefit` に値を足し、プランの `benefits` に並べ、
 * 使う側で `hasBenefit(userId, PlanBenefit.X)` を呼ぶ。Stripe 連携には触れない。
 * 過去の購入にはスナップショットなので付かない — それが「買い切りは購入時点の
 * 特典に限定」の意味。
 */

/**
 * 特典
 * 特典
 *
 * - `unlimited_practice` — `practice/score` と `practice/machi-score` の 1 日の
 *   回数制限を外す
 * - `practice_tools` — 同 2 練習の拡張機能（回答時間の計測など）
 */
export const PlanBenefit = {
  UnlimitedPractice: "unlimited_practice",
  PracticeTools: "practice_tools",
} as const;
export type PlanBenefit = (typeof PlanBenefit)[keyof typeof PlanBenefit];

const PLAN_BENEFIT_VALUES: readonly string[] = Object.values(PlanBenefit);

/**
 * 文字列が特典の値か
 * 特典判定
 *
 * DB の `purchases.benefits` は text[] なので、読むときにここで絞る。
 * コードから消した特典が過去の行に残っていても、判定からは静かに外れる。
 */
export function isPlanBenefit(value: string): value is PlanBenefit {
  return PLAN_BENEFIT_VALUES.includes(value);
}

/**
 * 売り方の種類
 * 購入種別
 *
 * - `pass` — 期間パス。`durationDays` 日で失効し、自動更新しない
 * - `lifetime` — 買い切り。失効しない
 */
export const PurchaseKind = {
  Pass: "pass",
  Lifetime: "lifetime",
} as const;
export type PurchaseKind = (typeof PurchaseKind)[keyof typeof PurchaseKind];

/** プランのキー（`purchases.plan` の値） */
export const PLAN_KEYS = ["pro"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

/** 売り方のキー（環境変数名・Checkout の引数・辞書キーで同じ文字列を使う） */
export const OFFER_KEYS = ["pass", "lifetime"] as const;
export type OfferKey = (typeof OFFER_KEYS)[number];

/**
 * 売り方 1 つ
 * 売り方
 *
 * 期間パスだけが `durationDays` を持つ。判別は `kind` で行う。
 */
export type OfferDefinition =
  | {
      readonly key: OfferKey;
      readonly kind: typeof PurchaseKind.Pass;
      readonly durationDays: number;
    }
  | {
      readonly key: OfferKey;
      readonly kind: typeof PurchaseKind.Lifetime;
    };

/** プラン 1 つ */
export interface PlanDefinition {
  readonly key: PlanKey;
  /** いま購入すると付く特典。購入行にスナップショットされる */
  readonly benefits: readonly PlanBenefit[];
  readonly offers: Readonly<Record<OfferKey, OfferDefinition>>;
}

/**
 * プランの一覧
 * プラン一覧
 *
 * `Record<PlanKey, …>` にしているのは、プランを足したときにここへの追記を
 * コンパイラに要求させるため。
 */
export const PLANS: Readonly<Record<PlanKey, PlanDefinition>> = {
  pro: {
    key: "pro",
    benefits: [PlanBenefit.UnlimitedPractice, PlanBenefit.PracticeTools],
    offers: {
      pass: { key: "pass", kind: PurchaseKind.Pass, durationDays: 30 },
      lifetime: { key: "lifetime", kind: PurchaseKind.Lifetime },
    },
  },
};

/**
 * 文字列がプランのキーか
 * プランキー判定
 */
export function isPlanKey(value: string): value is PlanKey {
  return (PLAN_KEYS as readonly string[]).includes(value);
}

/**
 * 文字列が売り方のキーか
 * 売り方キー判定
 *
 * Checkout の Server Action がクライアントから受け取る値を絞るのに使う。
 */
export function isOfferKey(value: string): value is OfferKey {
  return (OFFER_KEYS as readonly string[]).includes(value);
}

/**
 * 期間パスの終了日時を求める
 * パス期限計算
 *
 * @param startsAt - 開始日時
 * @param durationDays - 日数
 */
export function addPassDuration(startsAt: Date, durationDays: number): Date {
  return new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
}
