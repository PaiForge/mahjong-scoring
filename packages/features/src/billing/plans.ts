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
 *   購入手続き開始時に固定し、購入行へ保存する（`purchases.benefits`）
 *
 * 特典を増やす手順: `PlanBenefit` に値を足し、プランの `benefits` に並べ、
 * 使う側で `hasBenefit(userId, PlanBenefit.X)` を呼ぶ。Stripe 連携には触れない。
 * 開始済みの手続きと過去の購入にはスナップショットなので付かない — それが「買い切りは購入時点の
 * 特典に限定」の意味。
 *
 * ## 採らなかった選択肢（設計時の判断。コードからは読めないので残す）
 *
 * - **サブスクリプション（月額）** — 点数計算は身につけたら使わなくなる性質で、
 *   自動更新は敬遠される。契約状態・Customer Portal・請求失敗・順不同で届く
 *   Webhook（`customer.subscription.*`）への耐性という複雑さを丸ごと持ち込む。
 *   期間パスなら `expires_at` 1 列で済み、取りこぼした Webhook が永続の特典に
 *   なる構造もない
 * - **広告非表示を特典にする** — ネイティブ広告で邪魔にならない。静的ページで
 *   広告を隠すには cookie + inline script の層が要り、買い切り購入者に永久の
 *   広告非表示を負う
 * - **価格をコードに持つ** — 通貨や改定のたびにデプロイが要る。Stripe の Price が
 *   正で、表示は `prices.ts` が読む。他通貨は Price の `currency_options` で足す
 * - **期間パスの重ね買い** — 残日数の連結・先行パス返金後の繰り上げを持たない。
 *   有効な購入があれば追加購入を止め、パスは期限切れ後に再購入する。
 *   パス有効中の買い切り移行も残期間の精算が必要になるため提供しない
 * - **3 つ目の売り方（90 日パス等）** — 選択肢は 2 つまで。需要が見えてから
 * - **買い切りにも将来の特典を付ける** — 継続コストが掛かる特典を永久無償にする
 *   義務が生じる。スナップショットで購入時点に固定し、新しい特典はパス限定に
 *   できる余地を残す
 * - **回数制限をブラウザ側で数える** — localStorage を消せば無限。ログイン済みは
 *   DB、未ログインだけ署名付き cookie（弱い制限で可、という決定）
 * - **問題生成をサーバーへ移す** — 「始めてよいか」をサーバーが数えれば回数は
 *   正確になり、生成を移す理由がない。移すと静的な play 画面と core の配置を
 *   変える大工事になる
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

/** 料金ページのパス。ペイウォール・設定画面の Pro 導線が指す */
export const PLAN_PAGE_HREF = "/plan";

/** プランのキー（`purchases.plan` の値） */
export const PLAN_KEYS = ["pro"] as const;

const planKeySet: ReadonlySet<string> = new Set(PLAN_KEYS);
export type PlanKey = (typeof PLAN_KEYS)[number];

/** 売り方のキー（環境変数名・Checkout の引数・辞書キーで同じ文字列を使う） */
export const OFFER_KEYS = ["pass", "lifetime"] as const;

const offerKeySet: ReadonlySet<string> = new Set(OFFER_KEYS);
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
  /** いま購入手続きを始めると付く特典。手続き作成時に固定する */
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
  return planKeySet.has(value);
}

/**
 * 文字列が売り方のキーか
 * 売り方キー判定
 *
 * Checkout の Server Action がクライアントから受け取る値を絞るのに使う。
 */
export function isOfferKey(value: string): value is OfferKey {
  return offerKeySet.has(value);
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
