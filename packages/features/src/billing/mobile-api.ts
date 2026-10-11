import { z } from "zod";

import {
  isOfferKey,
  isPlanBenefit,
  PurchaseKind,
  type OfferKey,
  type PlanBenefit,
} from "./plans";
import { isPurchaseProvider, PurchaseProvider } from "./provider";
import { isPurchaseState, PurchaseState } from "./purchase-state";
import type { QuotaMenu } from "../quota/limits";

/**
 * アプリ向けのプラン（Pro）・アプリ内課金・練習の回数制限の API の契約
 *
 * 認証とエラーの理由（`unauthorized` 等）は `account/mobile-api.ts` と共通。
 * ここにはプランに固有のものだけを置く。応答の項目を足すときは省略可能に
 * する — ストアに出ている版のアプリが古い形のまま読む。
 *
 * @design 金額を返さない
 *
 * アプリの購入履歴には Stripe・App Store のどちらの購入も金額を出さない。
 * web の価格がアプリから見えると、App Store の価格との差が問い合わせの種に
 * なる。種別・日付・状態・決済元だけを返す。アプリの価格の表示は StoreKit の
 * `displayPrice` が持つ。
 */

const MOBILE_API_PREFIX = "/api/mobile/v1";

/**
 * プランの状態・販売中の商品・購入履歴を返す API のパス（GET。要ログイン）
 * プラン状態APIパス
 */
export const MOBILE_PLAN_API_PATH = `${MOBILE_API_PREFIX}/plan`;

/**
 * 販売中の商品の一覧を返す API のパス（GET。認証なし）
 * 販売中商品APIパス
 *
 * ゲストが「販売しているか」を知るための入口（回数制限を掛けるかの判定）。
 */
export const MOBILE_PLAN_OFFERS_API_PATH = `${MOBILE_API_PREFIX}/plan/offers`;

/**
 * App Store の署名付き取引を送って購入を記録する API のパス（POST。要ログイン）
 * 取引記録APIパス
 *
 * 購入の直後と復元のときに呼ぶ。同じ取引を何度送ってもよい（冪等）。
 */
export const MOBILE_APPLE_TRANSACTIONS_API_PATH = `${MOBILE_API_PREFIX}/iap/apple/transactions`;

/** 回数制限の残数を返す API のパス（クエリの `menu` を除いた部分） */
const MOBILE_PRACTICE_QUOTA_API_PATH = `${MOBILE_API_PREFIX}/practice-quota`;

/**
 * 回数制限の残数を消費せずに読む API の URL（GET。要ログイン）
 * 残数問い合わせAPIパス
 *
 * @param menu - 回数制限の対象の練習
 */
export function mobilePracticeQuotaApiUrl(menu: QuotaMenu): string {
  const params = new URLSearchParams({ menu });
  return `${MOBILE_PRACTICE_QUOTA_API_PATH}?${params.toString()}`;
}

/**
 * 1 問始める前に回数制限の枠を 1 つ消費する API のパス（POST。要ログイン）
 * 出題開始APIパス
 */
export const MOBILE_PRACTICE_QUOTA_BEGIN_API_PATH = `${MOBILE_PRACTICE_QUOTA_API_PATH}/begin`;

/**
 * いまのプランの状態
 * プラン状態
 *
 * - `free` — Pro ではない
 * - `pass` — 有効なパスを持つ。`until` は Pro が切れる日時（ISO 8601）
 * - `lifetime` — 有効な買い切りを持つ
 * - `granted` — 運営の手動付与で Pro。`until` は期限、無期限なら無い
 */
export type MobilePlanStatus =
  | { readonly kind: "free" }
  | { readonly kind: "pass"; readonly until: string }
  | { readonly kind: "lifetime" }
  | { readonly kind: "granted"; readonly until?: string };

/**
 * 販売中の商品 1 つ
 * 販売中商品
 *
 * `productId` は App Store の Product ID。アプリはこれで StoreKit から価格を引く。
 */
export interface MobilePlanOffer {
  readonly key: OfferKey;
  readonly productId: string;
}

/**
 * 購入履歴の 1 行
 * 購入履歴行
 *
 * 金額は持たない（このモジュールの「金額を返さない」）。
 */
export interface MobilePlanPurchase {
  readonly provider: PurchaseProvider;
  readonly kind: PurchaseKind;
  /** 購入を記録した日時（ISO 8601） */
  readonly createdAt: string;
  /** パスの期限（ISO 8601）。買い切りは無い */
  readonly expiresAt?: string;
  readonly state: PurchaseState;
}

/**
 * プランの状態の応答
 * プラン状態応答
 */
export interface MobilePlanResponse {
  readonly status: MobilePlanStatus;
  /** いま持つ特典 */
  readonly benefits: readonly PlanBenefit[];
  /**
   * 追加購入できるか。有効か開始待ちの購入がある間は false（web の
   * 購入ボタンと同じ規則）。false の間、アプリは購入ボタンを出さない
   */
  readonly canPurchase: boolean;
  /** 販売中の商品。空なら販売していない（購入ボタンを出さない） */
  readonly offers: readonly MobilePlanOffer[];
  /** 購入履歴（新しい順）。取り消した購入も含む */
  readonly purchases: readonly MobilePlanPurchase[];
}

/**
 * 販売中の商品の一覧の応答
 * 販売中商品応答
 */
export interface MobilePlanOffersResponse {
  readonly offers: readonly MobilePlanOffer[];
}

/**
 * 取引の記録の要求
 * 取引記録要求
 *
 * `jws` は StoreKit の署名付き取引（`jwsRepresentation`）。
 */
export interface MobileAppleTransactionRequest {
  readonly jws: string;
}

/**
 * 取引の記録の応答。記録した後のプランの状態を一緒に返す
 * 取引記録応答
 *
 * - `recorded` — 新しく記録した（返金済みの取引を履歴として記録した場合も含む）
 * - `duplicate` — 同じ取引を記録済み（復元・送り直し）
 *
 * どちらでもアプリは取引を完了（finish）してよい。
 */
export interface MobileAppleTransactionResponse extends MobilePlanResponse {
  readonly outcome: "recorded" | "duplicate";
}

/**
 * 出題開始の要求
 * 出題開始要求
 */
export interface MobilePracticeQuotaRequest {
  readonly menu: QuotaMenu;
}

/**
 * 回数制限の答え（出題開始・残数問い合わせで共通）
 * 出題許可応答
 *
 * web の出題開始（`beginPracticeQuestion`）と同じ形から `signedIn` を除いたもの
 * （アプリ向け API は常にログイン済み）。
 *
 * - `allowed` — 問題を生成してよいか。false ならペイウォールを出す
 * - `remaining` — 今日の残り。無制限なら `"unlimited"`
 * - `limit` — 1 日の上限。無制限なら `"unlimited"`
 * - `benefits` — 保有する特典。拡張機能（回答時間の計測）の出し分けに使う
 */
export interface MobilePracticeQuotaResponse {
  readonly allowed: boolean;
  readonly remaining: number | "unlimited";
  readonly limit: number | "unlimited";
  readonly benefits: readonly PlanBenefit[];
}

/**
 * プラン・取引の記録の API 固有の失敗の理由
 *
 * 取引の記録で 4xx を受けたら、アプリは取引を完了（finish）する — 送り直しても
 * 通らず、完了しないと StoreKit が起動のたびに同じ取引を配り直して永久に
 * 送り続ける。503 だけは完了せずに残し、次の起動で送り直す。
 *
 * - `usernameRequired` — ユーザー名を決めていない（409）。マイページと同じく、
 *   アプリはその前にユーザー名の設定へ送る（プラン画面はユーザー名を決めた人に
 *   しか出さないので、取引の記録では通常起きない）。他の 4xx と同じく完了する
 * - `ownedByAnotherAccount` — 同じ取引が別のアカウントに記録されている（409）。
 *   完了する
 * - `invalidTransaction` — 署名が通らない・別のアプリ・商品の種類が合わない・
 *   Family Sharing の共有（422）。完了する
 * - `unknownProduct` — 知らない Product ID（422）。完了する
 * - `sandboxNotAccepted` — Sandbox の取引で、特典を付けてよいユーザーではない
 *   （422）。完了する
 * - `appleUnavailable` — サーバーが取引を検証できない（設定が無い・Apple の
 *   証明書の確認に届かない。503）。完了せず、後で送り直す
 */
export const MOBILE_PLAN_ERROR_CODES = [
  "usernameRequired",
  "ownedByAnotherAccount",
  "invalidTransaction",
  "unknownProduct",
  "sandboxNotAccepted",
  "appleUnavailable",
] as const;

/** プラン・取引の記録の API 固有の失敗の理由（{@link MOBILE_PLAN_ERROR_CODES}） */
export type MobilePlanErrorCode = (typeof MOBILE_PLAN_ERROR_CODES)[number];

const planErrorCodeSet: ReadonlySet<string> = new Set(MOBILE_PLAN_ERROR_CODES);

/** 値がプラン・取引の記録の API 固有の失敗の理由かを判定する型ガード */
export function isMobilePlanErrorCode(
  value: unknown,
): value is MobilePlanErrorCode {
  return typeof value === "string" && planErrorCodeSet.has(value);
}

const offerSchema = z.object({ key: z.string(), productId: z.string() });

const statusSchema = z.object({
  kind: z.string(),
  until: z.string().optional(),
});

const purchaseSchema = z.object({
  provider: z.string(),
  kind: z.string(),
  createdAt: z.string(),
  expiresAt: z.string().optional(),
  state: z.string(),
});

const planSchema = z.object({
  status: statusSchema,
  benefits: z.array(z.string()),
  canPurchase: z.boolean(),
  offers: z.array(offerSchema),
  purchases: z.array(purchaseSchema),
});

const offersSchema = z.object({ offers: z.array(offerSchema) });

const appleTransactionSchema = planSchema.extend({
  outcome: z.enum(["recorded", "duplicate"]),
});

const practiceQuotaSchema = z.object({
  allowed: z.boolean(),
  remaining: z.union([z.number(), z.literal("unlimited")]),
  limit: z.union([z.number(), z.literal("unlimited")]),
  benefits: z.array(z.string()),
});

/** 知っている売り方の商品だけを残す（知らない売り方はアプリが売れない） */
function offersOf(
  offers: readonly z.infer<typeof offerSchema>[],
): MobilePlanOffer[] {
  return offers.flatMap(({ key, productId }) =>
    isOfferKey(key) ? [{ key, productId }] : [],
  );
}

/** 知っている特典だけを残す */
function benefitsOf(benefits: readonly string[]): PlanBenefit[] {
  return benefits.filter(isPlanBenefit);
}

/**
 * 状態を写す。知らない種類・`pass` に期限が無いときは `free`
 *
 * `free` に倒しても購入ボタンの出し分けは `canPurchase` が決めるので、
 * 持っている Pro を重ねて買わせることにはならない。
 */
function statusOf({
  kind,
  until,
}: z.infer<typeof statusSchema>): MobilePlanStatus {
  if (kind === "lifetime") return { kind };
  if (kind === "pass" && until !== undefined) return { kind, until };
  if (kind === "granted")
    return until === undefined ? { kind } : { kind, until };
  return { kind: "free" };
}

/** 購入履歴の 1 行を写す。知らない値は無害な既定に倒す（{@link parseMobilePlanResponse}） */
function purchaseOf({
  provider,
  kind,
  createdAt,
  expiresAt,
  state,
}: z.infer<typeof purchaseSchema>): MobilePlanPurchase {
  return {
    provider: isPurchaseProvider(provider) ? provider : PurchaseProvider.Stripe,
    kind:
      kind === PurchaseKind.Lifetime
        ? PurchaseKind.Lifetime
        : PurchaseKind.Pass,
    createdAt,
    ...(expiresAt === undefined ? {} : { expiresAt }),
    state: isPurchaseState(state) ? state : PurchaseState.Expired,
  };
}

function planOf(plan: z.infer<typeof planSchema>): MobilePlanResponse {
  return {
    status: statusOf(plan.status),
    benefits: benefitsOf(plan.benefits),
    canPurchase: plan.canPurchase,
    offers: offersOf(plan.offers),
    purchases: plan.purchases.map(purchaseOf),
  };
}

/**
 * プランの状態の応答を検証する。形が違えば undefined
 * プラン状態応答検証
 *
 * サーバーがアプリより新しい版で値を増やしても、行ごと落とさず無害な既定に
 * 倒す（マイページの段級位を無級にするのと同じ方針）。購入履歴の決済元は
 * `stripe`、状態は `expired`（有効に見せない）、種類は `pass` にする。知らない
 * 特典・売り方は除く（アプリが扱えない）。状態の種類が知らないものなら `free`。
 */
export function parseMobilePlanResponse(
  body: unknown,
): MobilePlanResponse | undefined {
  const parsed = planSchema.safeParse(body);
  return parsed.success ? planOf(parsed.data) : undefined;
}

/**
 * 販売中の商品の一覧の応答を検証する。形が違えば undefined
 * 販売中商品応答検証
 *
 * 知らない売り方は除く（{@link parseMobilePlanResponse} と同じ）。
 */
export function parseMobilePlanOffersResponse(
  body: unknown,
): MobilePlanOffersResponse | undefined {
  const parsed = offersSchema.safeParse(body);
  return parsed.success ? { offers: offersOf(parsed.data.offers) } : undefined;
}

/**
 * 取引の記録の応答を検証する。形が違えば undefined
 * 取引記録応答検証
 *
 * プランの部分の扱いは {@link parseMobilePlanResponse} と同じ。
 */
export function parseMobileAppleTransactionResponse(
  body: unknown,
): MobileAppleTransactionResponse | undefined {
  const parsed = appleTransactionSchema.safeParse(body);
  if (!parsed.success) return undefined;
  return { ...planOf(parsed.data), outcome: parsed.data.outcome };
}

/**
 * 回数制限の答えを検証する。形が違えば undefined
 * 出題許可応答検証
 *
 * 知らない特典は除く。
 */
export function parseMobilePracticeQuotaResponse(
  body: unknown,
): MobilePracticeQuotaResponse | undefined {
  const parsed = practiceQuotaSchema.safeParse(body);
  if (!parsed.success) return undefined;
  return { ...parsed.data, benefits: benefitsOf(parsed.data.benefits) };
}
