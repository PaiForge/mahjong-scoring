import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockAuthenticateAndCheckBan,
  mockEnforceIpRateLimit,
  setupAuthorized,
} from "@/test/auth-mocks";
const mocks = vi.hoisted(() => ({
  open: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mocks.redirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/rate-limit-ip", async () => await import("@/test/auth-mocks"));
vi.mock("@/lib/auth", async () => await import("@/test/auth-mocks"));
vi.mock("@/lib/billing/checkout", () => ({ openCheckout: mocks.open }));
vi.mock("@/config", () => ({ SITE_URL: "https://score.mahjong.help" }));
import { createCheckoutSession } from "../create-checkout-session";
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  setupAuthorized({ id: "u1", email: "u1@example.com" });
  mocks.open.mockResolvedValue({ url: "https://checkout.stripe.com/x" });
  mocks.headers.mockResolvedValue(
    new Headers({ host: "localhost:3000", "x-forwarded-proto": "http" }),
  );
});
describe("createCheckoutSession", () => {
  it("不正な売り方は認証前に弾く", async () => {
    expect(await createCheckoutSession("monthly")).toEqual({
      error: "invalidOffer",
    });
    expect(mockEnforceIpRateLimit).not.toHaveBeenCalled();
  });
  it("レート制限・未認証・BAN は Stripe を呼ばない", async () => {
    mockEnforceIpRateLimit.mockResolvedValueOnce({ error: "rateLimited" });
    expect(await createCheckoutSession("pass")).toEqual({
      error: "rateLimited",
    });
    for (const error of ["unauthorized", "banned"]) {
      mockAuthenticateAndCheckBan.mockResolvedValueOnce({ error });
      expect(await createCheckoutSession("pass")).toEqual({ error });
    }
    expect(mocks.open).not.toHaveBeenCalled();
  });
  it("現在の origin と認証した本人で手続きを開始する", async () => {
    await expect(createCheckoutSession("pass")).rejects.toThrow(
      "NEXT_REDIRECT:https://checkout.stripe.com/x",
    );
    expect(mocks.open).toHaveBeenCalledWith(
      "u1",
      "u1@example.com",
      "pass",
      "http://localhost:3000",
    );
  });
  it("origin がなければ SITE_URL", async () => {
    mocks.headers.mockResolvedValue(new Headers());
    await expect(createCheckoutSession("lifetime")).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(mocks.open).toHaveBeenCalledWith(
      "u1",
      "u1@example.com",
      "lifetime",
      "https://score.mahjong.help",
    );
  });
  it.each([
    "alreadyActive",
    "checkoutInProgress",
    "checkoutExpired",
    "checkoutPending",
  ])("購入拒否 %s を表示へ返す", async (error) => {
    mocks.open.mockResolvedValue({ error });
    expect(await createCheckoutSession("pass")).toEqual({ error });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("DB・Stripe の失敗を checkoutFailed として返す", async () => {
    mocks.open.mockRejectedValue(new Error("offline"));
    expect(await createCheckoutSession("pass")).toEqual({
      error: "checkoutFailed",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
