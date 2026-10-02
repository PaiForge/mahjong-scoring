// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockEnforceIpRateLimit,
  mockGetOptionalVerifiedUser,
  mockGetStripeCustomerId,
  mockRecordPurchase,
  mockSessionsRetrieve,
} = vi.hoisted(() => ({
  mockEnforceIpRateLimit: vi.fn(),
  mockGetOptionalVerifiedUser: vi.fn(),
  mockGetStripeCustomerId: vi.fn(),
  mockRecordPurchase: vi.fn(),
  mockSessionsRetrieve: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/rate-limit-ip", () => ({
  enforceIpRateLimit: mockEnforceIpRateLimit,
}));
vi.mock("@/lib/auth", () => ({
  getOptionalVerifiedUser: mockGetOptionalVerifiedUser,
}));
vi.mock("@/lib/billing/customer", () => ({
  getStripeCustomerId: mockGetStripeCustomerId,
}));
vi.mock("@/lib/billing/purchases", () => ({
  recordPurchaseFromCheckoutSession: mockRecordPurchase,
}));
vi.mock("@/lib/billing/stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { retrieve: mockSessionsRetrieve } },
  }),
}));

import { GET } from "./route";

const ORIGIN = "http://localhost:3000";

function request(query = "?session_id=cs_1") {
  return new Request(`${ORIGIN}/api/stripe/checkout/complete${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mockEnforceIpRateLimit.mockResolvedValue(undefined);
  mockGetOptionalVerifiedUser.mockResolvedValue({ id: "u1" });
  mockGetStripeCustomerId.mockResolvedValue("cus_1");
  mockSessionsRetrieve.mockResolvedValue({ id: "cs_1", customer: "cus_1" });
  mockRecordPurchase.mockResolvedValue({
    outcome: "recorded",
    purchaseId: "p1",
  });
});

describe("GET /api/stripe/checkout/complete", () => {
  it("session_id が無ければマイページへ", async () => {
    const res = await GET(request(""));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(`${ORIGIN}/mypage/plan`);
    expect(mockSessionsRetrieve).not.toHaveBeenCalled();
  });

  it("未ログインならサインインへ（戻り先は session_id 込みのこの着地）", async () => {
    mockGetOptionalVerifiedUser.mockResolvedValue(undefined);

    const res = await GET(request());

    expect(res.headers.get("location")).toBe(
      `${ORIGIN}/sign-in?redirect=${encodeURIComponent(
        "/api/stripe/checkout/complete?session_id=cs_1",
      )}`,
    );
    expect(mockSessionsRetrieve).not.toHaveBeenCalled();
  });

  it("レート制限は 429", async () => {
    mockEnforceIpRateLimit.mockResolvedValue({ error: "rateLimited" });
    expect((await GET(request())).status).toBe(429);
  });

  it("他人の Session（顧客が自分の対応と違う）は 403 で記録しない", async () => {
    mockSessionsRetrieve.mockResolvedValue({
      id: "cs_1",
      customer: "cus_other",
    });

    const res = await GET(request());

    expect(res.status).toBe(403);
    expect(mockRecordPurchase).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("自分に顧客対応が無ければ 403", async () => {
    mockGetStripeCustomerId.mockResolvedValue(undefined);
    expect((await GET(request())).status).toBe(403);
  });

  it("自分の Session なら line_items を展開して取り、記録して success へ", async () => {
    const res = await GET(request());

    expect(mockSessionsRetrieve).toHaveBeenCalledWith("cs_1", {
      expand: ["line_items"],
    });
    expect(mockRecordPurchase).toHaveBeenCalledWith({
      id: "cs_1",
      customer: "cus_1",
    });
    expect(res.headers.get("location")).toBe(
      `${ORIGIN}/mypage/plan?status=success`,
    );
  });

  it("重複は現在の購入状況へ戻す", async () => {
    mockRecordPurchase.mockResolvedValue({ outcome: "duplicate" });
    const res = await GET(request());
    expect(res.headers.get("location")).toBe(`${ORIGIN}/mypage/plan`);
  });

  it("支払い未確定なら pending", async () => {
    mockRecordPurchase.mockResolvedValue({
      outcome: "ignored",
      reason: "notPaid",
    });
    const res = await GET(request());
    expect(res.headers.get("location")).toBe(
      `${ORIGIN}/mypage/plan?status=pending`,
    );
  });

  it("Stripe や DB の一時的な失敗は pending（Webhook が後から記録する）", async () => {
    mockSessionsRetrieve.mockRejectedValue(new Error("stripe down"));
    const res = await GET(request());
    expect(res.headers.get("location")).toBe(
      `${ORIGIN}/mypage/plan?status=pending`,
    );
    expect(console.error).toHaveBeenCalled();
  });
});

it("記録できない支払いを成功表示にしない", async () => {
  mockRecordPurchase.mockResolvedValue({
    outcome: "ignored",
    reason: "unknownCheckout",
  });
  expect((await GET(request())).headers.get("location")).toBe(
    `${ORIGIN}/mypage/plan?status=failed`,
  );
});
it("返金済みは成功表示せず履歴へ戻す", async () => {
  mockRecordPurchase.mockResolvedValue({
    outcome: "refunded",
    purchaseId: "p1",
  });
  expect((await GET(request())).headers.get("location")).toBe(
    `${ORIGIN}/mypage/plan`,
  );
});
