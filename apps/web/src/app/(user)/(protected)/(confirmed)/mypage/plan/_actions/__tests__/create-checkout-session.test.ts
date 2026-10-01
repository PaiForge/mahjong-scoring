import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockEnforceIpRateLimit,
  mockAuthenticateAndCheckBan,
  mockHasActiveLifetime,
  mockGetOrCreateCustomer,
  mockSessionsCreate,
  mockRedirect,
  mockHeaders,
} = vi.hoisted(() => ({
  mockEnforceIpRateLimit: vi.fn(),
  mockAuthenticateAndCheckBan: vi.fn(),
  mockHasActiveLifetime: vi.fn(),
  mockGetOrCreateCustomer: vi.fn(),
  mockSessionsCreate: vi.fn(),
  mockRedirect: vi.fn(),
  mockHeaders: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: mockHeaders }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/rate-limit-ip", () => ({
  enforceIpRateLimit: mockEnforceIpRateLimit,
}));
vi.mock("@/lib/auth", () => ({
  authenticateAndCheckBan: mockAuthenticateAndCheckBan,
}));
vi.mock("@/lib/billing/purchases", () => ({
  hasActiveLifetimePurchase: mockHasActiveLifetime,
}));
vi.mock("@/lib/billing/customer", () => ({
  getOrCreateStripeCustomerId: mockGetOrCreateCustomer,
}));
vi.mock("@/lib/billing/env", () => ({
  getOfferPriceId: (_plan: string, offer: string) => `price_${offer}`,
}));
vi.mock("@/lib/billing/stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: mockSessionsCreate } },
  }),
}));
vi.mock("@/config", () => ({ SITE_URL: "https://score.mahjong.help" }));

import { createCheckoutSession } from "../create-checkout-session";

const USER = { id: "u1", email: "u1@example.com" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mockEnforceIpRateLimit.mockResolvedValue(undefined);
  mockAuthenticateAndCheckBan.mockResolvedValue({ user: USER });
  mockHasActiveLifetime.mockResolvedValue(false);
  mockGetOrCreateCustomer.mockResolvedValue("cus_1");
  mockSessionsCreate.mockResolvedValue({
    url: "https://checkout.stripe.com/x",
  });
  mockHeaders.mockResolvedValue(
    new Headers({ host: "localhost:3000", "x-forwarded-proto": "http" }),
  );
});

describe("createCheckoutSession", () => {
  it("知らない売り方は invalidOffer（レート制限より前に弾く）", async () => {
    expect(await createCheckoutSession("monthly")).toEqual({
      error: "invalidOffer",
    });
    expect(mockEnforceIpRateLimit).not.toHaveBeenCalled();
  });

  it("レート制限・未ログイン・BAN はそのエラーを返す", async () => {
    mockEnforceIpRateLimit.mockResolvedValueOnce({ error: "rateLimited" });
    expect(await createCheckoutSession("pass")).toEqual({
      error: "rateLimited",
    });

    mockAuthenticateAndCheckBan.mockResolvedValueOnce({ error: "banned" });
    expect(await createCheckoutSession("pass")).toEqual({ error: "banned" });
    expect(mockSessionsCreate).not.toHaveBeenCalled();
  });

  it("買い切りを持つ人にはパスも買い切りも売らない", async () => {
    mockHasActiveLifetime.mockResolvedValue(true);

    expect(await createCheckoutSession("pass")).toEqual({
      error: "alreadyLifetime",
    });
    expect(await createCheckoutSession("lifetime")).toEqual({
      error: "alreadyLifetime",
    });
    expect(mockGetOrCreateCustomer).not.toHaveBeenCalled();
  });

  it("顧客を用意し、一括払いの Checkout を今いるオリジンの戻り先で作って飛ぶ", async () => {
    await expect(createCheckoutSession("pass")).rejects.toThrow(
      "NEXT_REDIRECT:https://checkout.stripe.com/x",
    );

    expect(mockGetOrCreateCustomer).toHaveBeenCalledWith(
      "u1",
      "u1@example.com",
    );
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_1",
        mode: "payment",
        line_items: [{ price: "price_pass", quantity: 1 }],
        allowed_payment_method_types: ["card"],
        success_url:
          "http://localhost:3000/api/stripe/checkout/complete?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:3000/plan",
        metadata: { supabaseUserId: "u1", offer: "pass" },
      }),
    );
  });

  it("ホストが分からなければ SITE_URL を戻り先にする", async () => {
    mockHeaders.mockResolvedValue(new Headers());

    await expect(createCheckoutSession("lifetime")).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        cancel_url: "https://score.mahjong.help/plan",
      }),
    );
  });

  it("Stripe が失敗したら checkoutFailed でログを残す", async () => {
    mockSessionsCreate.mockRejectedValue(new Error("stripe down"));

    expect(await createCheckoutSession("pass")).toEqual({
      error: "checkoutFailed",
    });
    expect(console.error).toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("Session に URL が無ければ checkoutFailed", async () => {
    mockSessionsCreate.mockResolvedValue({ url: null });
    expect(await createCheckoutSession("pass")).toEqual({
      error: "checkoutFailed",
    });
  });
});
