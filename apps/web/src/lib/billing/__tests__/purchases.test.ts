import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  update: vi.fn(),
  payment: vi.fn(),
  refund: vi.fn(),
  notify: vi.fn(),
  holder: {} as { seq?: import("@/test/drizzle-mock").SelectSequenceMock },
}));
vi.mock("server-only", () => ({}));
vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));
vi.mock("@/lib/db", async () => {
  const schema = await import("@/test/schema-mock");
  const { createSelectSequenceMock } = await import("@/test/drizzle-mock");
  const seq = createSelectSequenceMock();
  mocks.holder.seq = seq;
  const tx = {
    select: seq.select,
    insert: mocks.insert,
    update: mocks.update,
    execute: vi.fn(),
  };
  return {
    ...schema,
    db: { ...tx, transaction: (run: (tx: unknown) => unknown) => run(tx) },
  };
});
vi.mock("@/lib/notifications/create-notification", () => ({
  notifyQuietly: mocks.notify,
}));
vi.mock("../stripe", () => ({
  getStripe: () => ({
    paymentIntents: { retrieve: mocks.payment },
    refunds: { create: mocks.refund },
  }),
}));
import { createQueryChain } from "@/test/drizzle-mock";
import {
  recordPurchaseFromCheckoutSession,
  revokePurchaseByPaymentIntent,
} from "../purchases";
const NOW = new Date("2026-10-01T12:00:00Z");
const checkout = {
  id: "11111111-1111-4111-8111-111111111111",
  customerId: "c1",
  plan: "pro",
  kind: "pass",
  benefits: ["unlimited_practice"],
  durationDays: 30,
  stripePriceId: "price_old",
  stripeCheckoutSessionId: "cs1",
};
const customer = { id: "c1", userId: "u1", stripeCustomerId: "cus1" };
function session(overrides: Record<string, unknown> = {}) {
  return {
    id: "cs1",
    mode: "payment",
    payment_status: "paid",
    payment_intent: "pi1",
    customer: "cus1",
    currency: "jpy",
    amount_total: 480,
    metadata: { billingCheckoutId: checkout.id },
    line_items: {
      data: [{ price: { id: "price_old" }, quantity: 1 }],
      has_more: false,
    },
    ...overrides,
  } as unknown as Parameters<typeof recordPurchaseFromCheckoutSession>[0];
}
function selects(...rows: unknown[][]) {
  mocks.holder.seq?.setResults(...rows);
}
function values() {
  return mocks.insert.mock.results[0]?.value.values;
}
beforeEach(() => {
  vi.clearAllMocks();
  selects([customer], [], [checkout], []);
  mocks.insert.mockReturnValue(createQueryChain([{ id: "p1" }]));
  mocks.update.mockReturnValue(createQueryChain([]));
  mocks.payment.mockResolvedValue({
    latest_charge: {
      created: NOW.getTime() / 1000,
      amount: 480,
      amount_refunded: 0,
    },
  });
  mocks.refund.mockResolvedValue({ id: "re1" });
});
afterEach(() => vi.unstubAllEnvs());
describe("recordPurchaseFromCheckoutSession", () => {
  it.each([{ payment_status: "unpaid" }, { mode: "subscription" }])(
    "未払い・サブスクを記録しない: %j",
    async (override) => {
      expect(
        await recordPurchaseFromCheckoutSession(session(override), NOW),
      ).toEqual({ outcome: "ignored", reason: "notPaid" });
      expect(mocks.insert).not.toHaveBeenCalled();
    },
  );
  it("line_items がなければ記録しない", async () => {
    expect(
      await recordPurchaseFromCheckoutSession(
        session({ line_items: undefined }),
      ),
    ).toEqual({ outcome: "ignored", reason: "missingLineItems" });
  });
  it("購入時の顧客対応がなければ記録しない", async () => {
    selects([]);
    expect(await recordPurchaseFromCheckoutSession(session())).toEqual({
      outcome: "ignored",
      reason: "unknownCustomer",
    });
  });
  it("PaymentIntent がなければ記録しない", async () => {
    expect(
      await recordPurchaseFromCheckoutSession(
        session({ payment_intent: null }),
      ),
    ).toEqual({ outcome: "ignored", reason: "missingPaymentIntent" });
  });
  it("metadata は正しい UUID の予約を指す必要がある", async () => {
    expect(
      await recordPurchaseFromCheckoutSession(
        session({ metadata: { billingCheckoutId: "invalid" } }),
      ),
    ).toEqual({ outcome: "ignored", reason: "unknownCheckout" });
  });
  it("予約がなければ現在のプラン定義で代用しない", async () => {
    selects([customer], [], []);
    expect(await recordPurchaseFromCheckoutSession(session())).toEqual({
      outcome: "ignored",
      reason: "unknownCheckout",
    });
  });
  it.each([
    { stripePriceId: "price_other" },
    { stripeCheckoutSessionId: "cs_other" },
  ])("価格・Session が予約と違えば記録しない: %j", async (override) => {
    selects([customer], [], [{ ...checkout, ...override }]);
    expect(await recordPurchaseFromCheckoutSession(session())).toEqual({
      outcome: "ignored",
      reason: "invalidCheckout",
    });
    expect(mocks.payment).not.toHaveBeenCalled();
  });
  it("現在の Price と特典が変わっても開始済み手続きの条件を保存する", async () => {
    vi.stubEnv("STRIPE_PRICE_ID_PRO_PASS", "price_new");
    const result = await recordPurchaseFromCheckoutSession(session(), NOW);
    expect(result).toEqual({ outcome: "recorded", purchaseId: "p1" });
    expect(values()).toHaveBeenCalledWith(
      expect.objectContaining({
        benefits: ["unlimited_practice"],
        startsAt: NOW,
        expiresAt: new Date("2026-10-31T12:00:00Z"),
        revokedAt: null,
      }),
    );
  });
  it("買い切りの期間は NULL", async () => {
    selects(
      [customer],
      [],
      [{ ...checkout, kind: "lifetime", durationDays: null }],
      [],
    );
    await recordPurchaseFromCheckoutSession(session(), NOW);
    expect(values()).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "lifetime", expiresAt: null }),
    );
  });
  it("同一 Session の再送は Stripe に問い合わせず冪等", async () => {
    selects([customer], [{ id: "existing" }]);
    expect(await recordPurchaseFromCheckoutSession(session())).toEqual({
      outcome: "duplicate",
    });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.payment).not.toHaveBeenCalled();
  });
  it("購入記録より先の全額返金を復元する", async () => {
    mocks.payment.mockResolvedValue({
      latest_charge: {
        created: NOW.getTime() / 1000,
        amount: 480,
        amount_refunded: 480,
      },
    });
    expect(await recordPurchaseFromCheckoutSession(session(), NOW)).toEqual({
      outcome: "refunded",
      purchaseId: "p1",
    });
    expect(values()).toHaveBeenCalledWith(
      expect.objectContaining({ revokedAt: NOW, revokeReason: "refunded" }),
    );
    expect(mocks.refund).not.toHaveBeenCalled();
  });
  it("部分返金は取消にしない", async () => {
    mocks.payment.mockResolvedValue({
      latest_charge: {
        created: NOW.getTime() / 1000,
        amount: 480,
        amount_refunded: 100,
      },
    });
    await recordPurchaseFromCheckoutSession(session(), NOW);
    expect(values()).toHaveBeenCalledWith(
      expect.objectContaining({ revokedAt: null }),
    );
  });
  it("異なる決済が競合しても期間を重ねず後の決済を冪等に返金する", async () => {
    selects([customer], [], [checkout], [{ id: "active" }]);
    expect(await recordPurchaseFromCheckoutSession(session(), NOW)).toEqual({
      outcome: "refunded",
      purchaseId: "p1",
    });
    expect(mocks.refund).toHaveBeenCalledWith(
      { payment_intent: "pi1" },
      { idempotencyKey: "duplicate-purchase:pi1" },
    );
  });
  it("Stripe の確認失敗は記録せず再送させる", async () => {
    mocks.payment.mockRejectedValue(new Error("offline"));
    await expect(recordPurchaseFromCheckoutSession(session())).rejects.toThrow(
      "offline",
    );
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("競合決済の返金失敗でも記録せず再送させる", async () => {
    selects([customer], [], [checkout], [{ id: "active" }]);
    mocks.refund.mockRejectedValue(new Error("refund failed"));
    await expect(recordPurchaseFromCheckoutSession(session())).rejects.toThrow(
      "refund failed",
    );
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
describe("recordPurchaseFromCheckoutSession の通知", () => {
  it("新しく記録したら購入完了を本人に通知する（期限は購入行と同じ）", async () => {
    await recordPurchaseFromCheckoutSession(session(), NOW);
    expect(mocks.notify).toHaveBeenCalledTimes(1);
    expect(mocks.notify).toHaveBeenCalledWith({
      userId: "u1",
      type: "purchase_completed",
      target: { type: "purchase", id: "p1" },
      metadata: {
        plan: "pro",
        kind: "pass",
        expiresAt: new Date("2026-10-31T12:00:00Z").toISOString(),
        revokeReason: undefined,
      },
    });
  });
  it("返金済みとして記録したときは取り消しを通知する", async () => {
    mocks.payment.mockResolvedValue({
      latest_charge: {
        created: NOW.getTime() / 1000,
        amount: 480,
        amount_refunded: 480,
      },
    });
    await recordPurchaseFromCheckoutSession(session(), NOW);
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "purchase_revoked",
        metadata: expect.objectContaining({ revokeReason: "refunded" }),
      }),
    );
  });
  it("同一 Session の再送（duplicate）では通知しない", async () => {
    selects([customer], [{ id: "p1" }]);
    await recordPurchaseFromCheckoutSession(session(), NOW);
    expect(mocks.notify).not.toHaveBeenCalled();
  });
  it("見送り（ignored）では通知しない", async () => {
    await recordPurchaseFromCheckoutSession(
      session({ payment_status: "unpaid" }),
      NOW,
    );
    expect(mocks.notify).not.toHaveBeenCalled();
  });
});
describe("revokePurchaseByPaymentIntent", () => {
  it("取消済み・不存在なら false で、通知もしない", async () => {
    expect(await revokePurchaseByPaymentIntent("pi1", "refunded")).toBe(false);
    expect(mocks.notify).not.toHaveBeenCalled();
  });
  it("取消日時と理由を対で保存し、本人に取り消しを通知する", async () => {
    mocks.update.mockReturnValue(
      createQueryChain([{ id: "p1", userId: "u1", plan: "pro", kind: "pass" }]),
    );
    expect(await revokePurchaseByPaymentIntent("pi1", "refunded", NOW)).toBe(
      true,
    );
    expect(mocks.update.mock.results[0]?.value.set).toHaveBeenCalledWith({
      revokedAt: NOW,
      revokeReason: "refunded",
    });
    expect(mocks.notify).toHaveBeenCalledWith({
      userId: "u1",
      type: "purchase_revoked",
      target: { type: "purchase", id: "p1" },
      metadata: { plan: "pro", kind: "pass", revokeReason: "refunded" },
    });
  });
});
