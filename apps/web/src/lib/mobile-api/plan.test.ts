import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Purchase } from "../db";

const {
  mockAuthorize,
  mockListPurchases,
  mockListGrants,
  mockActiveBenefits,
  mockClientIp,
} = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockListPurchases: vi.fn(),
  mockListGrants: vi.fn(),
  mockActiveBenefits: vi.fn(),
  mockClientIp: vi.fn(),
}));

vi.mock("./auth", () => ({ authorizeMobileRequest: mockAuthorize }));
vi.mock("../billing/purchases", () => ({ listPurchases: mockListPurchases }));
vi.mock("../entitlements/benefit-grants", () => ({
  listBenefitGrants: mockListGrants,
}));
vi.mock("../entitlements/has-benefit", () => ({
  getActiveBenefits: mockActiveBenefits,
}));
vi.mock("../client-ip", () => ({ getClientIp: mockClientIp }));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import { _resetStore } from "../rate-limit-ip";
import { handleReadPlan, handleReadPlanOffers } from "./plan";

const NOW = new Date("2026-10-11T00:00:00Z");
const request = () => new Request("https://example.test");

function purchase(overrides: Partial<Purchase>): Purchase {
  return {
    id: "p",
    userId: "user-1",
    plan: "pro",
    kind: "pass",
    benefits: ["unlimited_practice"],
    provider: "stripe",
    stripeCheckoutSessionId: "cs",
    stripePaymentIntentId: "pi",
    appleTransactionId: null,
    appleOriginalTransactionId: null,
    appleProductId: null,
    appleEnvironment: null,
    currency: "jpy",
    amount: 480,
    startsAt: new Date("2026-10-01T00:00:00Z"),
    expiresAt: new Date("2026-10-31T00:00:00Z"),
    revokedAt: null,
    revokeReason: null,
    createdAt: new Date("2026-10-01T00:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  _resetStore();
  vi.useFakeTimers({ now: NOW });
  vi.stubEnv("APPLE_IAP_PRODUCT_ID_PRO_PASS", "help.mahjong.score.pro.pass30");
  vi.stubEnv(
    "APPLE_IAP_PRODUCT_ID_PRO_LIFETIME",
    "help.mahjong.score.pro.lifetime",
  );
  mockAuthorize.mockResolvedValue({
    ok: true,
    user: { id: "user-1" },
    profile: { username: "bob" },
  });
  mockListPurchases.mockResolvedValue([]);
  mockListGrants.mockResolvedValue([]);
  mockActiveBenefits.mockResolvedValue(new Set());
  mockClientIp.mockResolvedValue("203.0.113.1");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("handleReadPlan", () => {
  it("ユーザー名を決める前は読まずに 409 usernameRequired", async () => {
    mockAuthorize.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      profile: undefined,
    });

    const response = await handleReadPlan(request());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "usernameRequired" });
    expect(mockListPurchases).not.toHaveBeenCalled();
  });

  it("購入が無ければ free で、販売中の商品を並べて買える", async () => {
    const body = await (await handleReadPlan(request())).json();

    expect(body).toEqual({
      status: { kind: "free" },
      benefits: [],
      canPurchase: true,
      offers: [
        { key: "pass", productId: "help.mahjong.score.pro.pass30" },
        { key: "lifetime", productId: "help.mahjong.score.pro.lifetime" },
      ],
      purchases: [],
    });
  });

  it("有効なパスがあれば pass（期限は ISO 文字列）で、追加購入できない", async () => {
    mockListPurchases.mockResolvedValue([purchase({})]);
    mockActiveBenefits.mockResolvedValue(new Set(["unlimited_practice"]));

    const body = await (await handleReadPlan(request())).json();

    expect(body.status).toEqual({
      kind: "pass",
      until: "2026-10-31T00:00:00.000Z",
    });
    expect(body.benefits).toEqual(["unlimited_practice"]);
    expect(body.canPurchase).toBe(false);
  });

  it("購入履歴は状態と決済元を持ち、金額を持たない", async () => {
    mockListPurchases.mockResolvedValue([
      purchase({
        kind: "lifetime",
        expiresAt: null,
        revokedAt: new Date("2026-10-05T00:00:00Z"),
        revokeReason: "refunded",
        provider: "apple",
      }),
    ]);

    const body = await (await handleReadPlan(request())).json();

    expect(body.canPurchase).toBe(true);
    expect(body.purchases).toEqual([
      {
        provider: "apple",
        kind: "lifetime",
        createdAt: "2026-10-01T00:00:00.000Z",
        state: "refunded",
      },
    ]);
    expect(body.purchases[0]).not.toHaveProperty("amount");
    expect(body.purchases[0]).not.toHaveProperty("currency");
  });

  it("買い切りの Product ID が無ければ販売中の商品は空", async () => {
    vi.stubEnv("APPLE_IAP_PRODUCT_ID_PRO_LIFETIME", "");

    const body = await (await handleReadPlan(request())).json();

    expect(body.offers).toEqual([]);
  });

  it("読み取りに失敗したら 500 serverError", async () => {
    mockActiveBenefits.mockRejectedValue(new Error("db down"));

    const response = await handleReadPlan(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "serverError" });
  });
});

describe("handleReadPlanOffers", () => {
  it("認証せずに販売中の商品を返す", async () => {
    const response = await handleReadPlanOffers();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      offers: [
        { key: "pass", productId: "help.mahjong.score.pro.pass30" },
        { key: "lifetime", productId: "help.mahjong.score.pro.lifetime" },
      ],
    });
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(mockAuthorize).not.toHaveBeenCalled();
  });

  it("パスの Product ID が無ければ買い切りだけを返す", async () => {
    vi.stubEnv("APPLE_IAP_PRODUCT_ID_PRO_PASS", "");

    expect(await (await handleReadPlanOffers()).json()).toEqual({
      offers: [
        { key: "lifetime", productId: "help.mahjong.score.pro.lifetime" },
      ],
    });
  });

  it("販売していなければ空", async () => {
    vi.stubEnv("APPLE_IAP_PRODUCT_ID_PRO_LIFETIME", "");

    expect(await (await handleReadPlanOffers()).json()).toEqual({
      offers: [],
    });
  });

  it("同じ IP からの回数の上限を超えたら 429", async () => {
    for (let i = 0; i < 120; i += 1) await handleReadPlanOffers();

    const response = await handleReadPlanOffers();

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rateLimited" });
  });
});
