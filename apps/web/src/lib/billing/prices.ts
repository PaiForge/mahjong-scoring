import { unstable_cache } from "next/cache";
import "server-only";

import { PLAN_PRICES_CACHE_TAG } from "@/lib/cache-tags";
import { logExternalError } from "@/lib/log-error";

import { readOfferPriceId } from "./env";
import {
  OFFER_KEYS,
  type OfferKey,
  type PlanKey,
} from "@mahjong-scoring/features/billing/plans";
import { getStripe } from "./stripe";

/** 料金ページに出す 1 つの売り方の価格 */
export interface OfferPriceView {
  readonly offer: OfferKey;
  /** ISO 4217 小文字（Stripe の表記） */
  readonly currency: string;
  /** 最小通貨単位（JPY は円） */
  readonly amount: number;
}

/**
 * 表示価格を Stripe から読む（1 日キャッシュ）
 * 表示価格取得
 *
 * 価格表をコードに持たない（Stripe の Price が正）。料金ページは静的で、
 * `unstable_cache` の revalidate が ISR の間隔を兼ねる。Dashboard で価格を
 * 改定したら最長 1 日で追随する。すぐ反映したいときは
 * `revalidateTag(PLAN_PRICES_CACHE_TAG)`。
 *
 * 失敗（鍵が無い・Stripe に届かない・Price ID 未設定）は undefined。
 * 料金ページは価格欄を伏せて購入ボタンは出す — Checkout 側が正しい価格を
 * 出すので、表示できないことは購入を止める理由にならない。
 *
 * @design 通貨は閲覧者に依らない
 *
 * 通貨を足したら、ここは Price の既定通貨（JPY）を返し続け、Checkout が
 * 閲覧者の通貨で請求する。表示も切り替えたくなったら `currency_options` を
 * 展開して閲覧者のロケールで選ぶ。
 */
export const getOfferPrices = unstable_cache(
  async (plan: PlanKey): Promise<readonly OfferPriceView[] | undefined> => {
    try {
      const stripe = getStripe();
      const views: OfferPriceView[] = [];
      for (const offer of OFFER_KEYS) {
        const priceId = readOfferPriceId(plan, offer);
        if (!priceId) return undefined;
        const price = await stripe.prices.retrieve(priceId);
        if (price.unit_amount === null) return undefined;
        views.push({
          offer,
          currency: price.currency,
          amount: price.unit_amount,
        });
      }
      return views;
    } catch (error) {
      logExternalError("getOfferPrices", "failed to read prices", error);
      return undefined;
    }
  },
  ["offer-prices"],
  { tags: [PLAN_PRICES_CACHE_TAG], revalidate: 60 * 60 * 24 },
);

/**
 * 金額を通貨に応じた表記にする（税込総額）
 * 金額表記
 *
 * JPY は最小単位が円なのでそのまま、USD などセント単位の通貨は 100 で割る。
 * `Intl.NumberFormat` が通貨ごとの小数桁を知っている。
 */
export function formatAmount(
  amount: number,
  currency: string,
  locale = "ja-JP",
): string {
  const upper = currency.toUpperCase();
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: upper,
  });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 0;
  return formatter.format(amount / 10 ** digits);
}
