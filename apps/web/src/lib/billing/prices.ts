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
 * Stripe の Price を読む（キャッシュする本体）
 *
 * Stripe に届かないときは投げる。`unstable_cache` は投げた回を保存しない
 * ので、一時的な障害が 1 日分の「価格なし」として残らない（期限切れの値が
 * あれば、再検証の失敗中はそれを返し続ける）。設定の欠け（Price ID 未設定・
 * 金額の無い Price）は再試行しても変わらないので undefined として保存する。
 *
 * ページの `revalidate` への伝播はコールバックを実行する前に行われるので、
 * 投げても料金ページの ISR 間隔は変わらない。ただし、エントリが無い状態で
 * 失敗して描画された HTML は、その ISR 間隔のあいだ「価格なし」のまま残る。
 */
const readOfferPrices = unstable_cache(
  async (plan: PlanKey): Promise<readonly OfferPriceView[] | undefined> => {
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
  },
  ["offer-prices"],
  { tags: [PLAN_PRICES_CACHE_TAG], revalidate: 60 * 60 * 24 },
);

/**
 * 表示価格を Stripe から読む（1 日キャッシュ）
 * 表示価格取得
 *
 * 価格表をコードに持たない（Stripe の Price が正）。料金ページは静的で、
 * ページ自身の `revalidate`（1 時間）で作り直され、その際にこのキャッシュを
 * 読む。Dashboard で価格を改定したら、ここの期限切れ（最長 1 日）の後の
 * 再描画で追随する。すぐ反映したいときは `revalidateTag(PLAN_PRICES_CACHE_TAG)`。
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
export async function getOfferPrices(
  plan: PlanKey,
): Promise<readonly OfferPriceView[] | undefined> {
  try {
    return await readOfferPrices(plan);
  } catch (error) {
    logExternalError("getOfferPrices", "failed to read prices", error);
    return undefined;
  }
}

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
