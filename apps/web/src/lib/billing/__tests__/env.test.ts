import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getOfferPriceId,
  getStripeSecretKey,
  getStripeWebhookSecret,
  isPlanOnSale,
  readOfferPriceId,
  resolveOfferByPriceId,
} from "../env";

const ENV_NAMES = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID_PRO_PASS",
  "STRIPE_PRICE_ID_PRO_LIFETIME",
] as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

function clearAll() {
  for (const name of ENV_NAMES) vi.stubEnv(name, "");
}

describe("getter は未設定なら例外", () => {
  it("秘密鍵・Webhook シークレット・Price ID のどれも空なら変数名を含む例外", () => {
    clearAll();
    expect(() => getStripeSecretKey()).toThrow("STRIPE_SECRET_KEY");
    expect(() => getStripeWebhookSecret()).toThrow("STRIPE_WEBHOOK_SECRET");
    expect(() => getOfferPriceId("pro", "pass")).toThrow(
      "STRIPE_PRICE_ID_PRO_PASS",
    );
    expect(() => getOfferPriceId("pro", "lifetime")).toThrow(
      "STRIPE_PRICE_ID_PRO_LIFETIME",
    );
  });

  it("設定されていれば値を返す", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    vi.stubEnv("STRIPE_PRICE_ID_PRO_PASS", "price_pass");
    expect(getStripeSecretKey()).toBe("sk_test_x");
    expect(getOfferPriceId("pro", "pass")).toBe("price_pass");
  });
});

describe("readOfferPriceId", () => {
  it("未設定なら undefined（空文字も未設定扱い）", () => {
    clearAll();
    expect(readOfferPriceId("pro", "pass")).toBeUndefined();
  });
});

describe("isPlanOnSale", () => {
  it("全売り方の Price ID が設定されていれば true", () => {
    vi.stubEnv("STRIPE_PRICE_ID_PRO_PASS", "price_pass");
    vi.stubEnv("STRIPE_PRICE_ID_PRO_LIFETIME", "price_life");
    expect(isPlanOnSale("pro")).toBe(true);
  });

  it("どれか 1 つでも未設定なら false（片方だけ売れる状態を販売中と見なさない）", () => {
    clearAll();
    vi.stubEnv("STRIPE_PRICE_ID_PRO_PASS", "price_pass");
    expect(isPlanOnSale("pro")).toBe(false);
  });
});

describe("resolveOfferByPriceId", () => {
  it("環境変数に一致する Price ID をプランと売り方に戻す", () => {
    vi.stubEnv("STRIPE_PRICE_ID_PRO_PASS", "price_pass");
    vi.stubEnv("STRIPE_PRICE_ID_PRO_LIFETIME", "price_life");
    expect(resolveOfferByPriceId("price_pass")).toEqual({
      plan: "pro",
      offer: "pass",
    });
    expect(resolveOfferByPriceId("price_life")).toEqual({
      plan: "pro",
      offer: "lifetime",
    });
  });

  it("知らない Price ID は undefined（特典を付けない防波堤）", () => {
    vi.stubEnv("STRIPE_PRICE_ID_PRO_PASS", "price_pass");
    vi.stubEnv("STRIPE_PRICE_ID_PRO_LIFETIME", "price_life");
    expect(resolveOfferByPriceId("price_other")).toBeUndefined();
  });

  it("環境変数が空のときは空文字の Price ID にも一致しない", () => {
    clearAll();
    expect(resolveOfferByPriceId("")).toBeUndefined();
  });
});
