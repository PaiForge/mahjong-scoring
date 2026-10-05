import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockPricesRetrieve, cachedReaders } = vi.hoisted(() => ({
  mockPricesRetrieve: vi.fn(),
  cachedReaders: [] as ((...args: never[]) => Promise<unknown>)[],
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: never[]) => Promise<unknown>) => {
    cachedReaders.push(fn);
    return fn;
  },
}));
vi.mock("../stripe", () => ({
  getStripe: () => ({ prices: { retrieve: mockPricesRetrieve } }),
}));

import { formatAmount, getOfferPrices } from "../prices";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.stubEnv("STRIPE_PRICE_ID_PRO_PASS", "price_pass");
  vi.stubEnv("STRIPE_PRICE_ID_PRO_LIFETIME", "price_life");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getOfferPrices", () => {
  it("売り方ごとの Price を読んで通貨と金額を返す", async () => {
    mockPricesRetrieve.mockImplementation(async (id: string) => ({
      currency: "jpy",
      unit_amount: id === "price_pass" ? 480 : 1480,
    }));

    expect(await getOfferPrices("pro")).toEqual([
      { offer: "pass", currency: "jpy", amount: 480 },
      { offer: "lifetime", currency: "jpy", amount: 1480 },
    ]);
  });

  it("Price ID が未設定なら undefined（価格欄を伏せる）", async () => {
    vi.stubEnv("STRIPE_PRICE_ID_PRO_LIFETIME", "");
    expect(await getOfferPrices("pro")).toBeUndefined();
  });

  it("Stripe に届かなければ undefined でログを残す", async () => {
    mockPricesRetrieve.mockRejectedValue(new Error("network"));
    expect(await getOfferPrices("pro")).toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it("Stripe の失敗はキャッシュの中から投げる（undefined を 1 日保存しない）", async () => {
    mockPricesRetrieve.mockRejectedValue(new Error("network"));
    const [readCached] = cachedReaders;
    await expect(readCached("pro" as never)).rejects.toThrow("network");
  });

  it("金額の無い Price（従量など）は undefined", async () => {
    mockPricesRetrieve.mockResolvedValue({
      currency: "jpy",
      unit_amount: null,
    });
    expect(await getOfferPrices("pro")).toBeUndefined();
  });
});

describe("formatAmount", () => {
  it("JPY は最小単位が円なのでそのまま、小数なし", () => {
    const text = formatAmount(1480, "jpy");
    expect(text).toContain("1,480");
    expect(text).not.toMatch(/\.\d/);
  });

  it("USD はセント単位を 100 で割る", () => {
    expect(formatAmount(1480, "usd")).toContain("14.80");
  });
});
