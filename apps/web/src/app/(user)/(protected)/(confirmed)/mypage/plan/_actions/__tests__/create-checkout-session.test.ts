import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  rate: vi.fn(),
  auth: vi.fn(),
  open: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mocks.redirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/rate-limit-ip", () => ({ enforceIpRateLimit: mocks.rate }));
vi.mock("@/lib/auth", () => ({ authenticateAndCheckBan: mocks.auth }));
vi.mock("@/lib/billing/checkout", () => ({ openCheckout: mocks.open }));
vi.mock("@/config", () => ({ SITE_URL: "https://score.mahjong.help" }));
import { createCheckoutSession } from "../create-checkout-session";
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mocks.rate.mockResolvedValue(undefined);
  mocks.auth.mockResolvedValue({ user: { id: "u1", email: "u1@example.com" } });
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
    expect(mocks.rate).not.toHaveBeenCalled();
  });
  it("レート制限・未認証・BAN は Stripe を呼ばない", async () => {
    mocks.rate.mockResolvedValueOnce({ error: "rateLimited" });
    expect(await createCheckoutSession("pass")).toEqual({
      error: "rateLimited",
    });
    for (const error of ["unauthorized", "banned"]) {
      mocks.auth.mockResolvedValueOnce({ error });
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
