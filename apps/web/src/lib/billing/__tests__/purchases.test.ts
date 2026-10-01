import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockInsert,
  mockUpdate,
  mockResolveOfferByPriceId,
  mockPaymentRetrieve,
  selectHolder,
} = vi.hoisted(() => ({
  mockPaymentRetrieve: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockResolveOfferByPriceId: vi.fn(),
  // `db.select` の結果列はテスト本体から差し替えるため、モックの factory が
  // 作った制御器をここに置く（factory は import 時に遅延実行される）
  selectHolder: {} as {
    seq?: import("@/test/drizzle-mock").SelectSequenceMock;
  },
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", async () => {
  const schema = await import("@/test/schema-mock");
  const { createSelectSequenceMock } = await import("@/test/drizzle-mock");
  const sequence = createSelectSequenceMock();
  selectHolder.seq = sequence;
  return {
    db: {
      select: sequence.select,
      insert: mockInsert,
      update: mockUpdate,
      transaction: (run: (tx: unknown) => unknown) =>
        run({
          select: sequence.select,
          insert: mockInsert,
          update: mockUpdate,
          execute: vi.fn(),
        }),
    },
    purchases: schema.purchases,
    stripeCustomers: schema.stripeCustomers,
  };
});

vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

vi.mock("../env", () => ({
  resolveOfferByPriceId: mockResolveOfferByPriceId,
}));

vi.mock("../stripe", () => ({
  getStripe: () => ({ paymentIntents: { retrieve: mockPaymentRetrieve } }),
}));

import { createQueryChain, type SelectSequenceMock } from "@/test/drizzle-mock";

import {
  PurchaseRevokeReason,
  hasActiveLifetimePurchase,
  recordPurchaseFromCheckoutSession,
  revokePurchaseByPaymentIntent,
} from "../purchases";

const NOW = new Date("2026-10-01T12:00:00Z");
const USER_ID = "user-1";

/** 支払い済み・一括払いの Session を作る（必要な部分だけ） */
function paidSession(overrides: Record<string, unknown> = {}) {
  return {
    id: "cs_1",
    mode: "payment",
    payment_status: "paid",
    payment_intent: "pi_1",
    customer: "cus_1",
    currency: "jpy",
    amount_total: 480,
    line_items: { data: [{ price: { id: "price_pass" } }] },
    ...overrides,
  };
}

/** 型の都合で `Stripe.Checkout.Session` を要求する関数へ、素のオブジェクトを渡す */
async function record(session: Record<string, unknown>) {
  // テストコードでの型アサーションは規約上許容されている
  return recordPurchaseFromCheckoutSession(
    session as unknown as Parameters<
      typeof recordPurchaseFromCheckoutSession
    >[0],
    NOW,
  );
}

function seq(): SelectSequenceMock {
  if (!selectHolder.seq) throw new Error("select mock not initialised");
  return selectHolder.seq;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  seq().setResults();
  mockPaymentRetrieve.mockResolvedValue({
    latest_charge: { amount: 480, amount_refunded: 0 },
  });
  mockResolveOfferByPriceId.mockImplementation((priceId: string) =>
    priceId === "price_pass"
      ? { plan: "pro", offer: "pass" }
      : priceId === "price_life"
        ? { plan: "pro", offer: "lifetime" }
        : undefined,
  );
  mockInsert.mockReturnValue(createQueryChain([{ id: "purchase-1" }]));
});

describe("recordPurchaseFromCheckoutSession", () => {
  it("返金が購入記録より先でも取消済みとして保存する", async () => {
    seq().setResults([{ userId: USER_ID }], []);
    mockPaymentRetrieve.mockResolvedValue({
      latest_charge: { amount: 480, amount_refunded: 480 },
    });
    await record(paidSession());
    expect(mockInsert.mock.results[0]?.value.values).toHaveBeenCalledWith(
      expect.objectContaining({ revokedAt: NOW, revokeReason: "refunded" }),
    );
  });

  it("部分返金では特典を取り消さない", async () => {
    seq().setResults([{ userId: USER_ID }], []);
    mockPaymentRetrieve.mockResolvedValue({
      latest_charge: { amount: 480, amount_refunded: 100 },
    });
    await record(paidSession());
    expect(mockInsert.mock.results[0]?.value.values).toHaveBeenCalledWith(
      expect.objectContaining({ revokedAt: undefined }),
    );
  });

  it("Charge を確認できないときは購入せず再試行させる", async () => {
    seq().setResults([{ userId: USER_ID }]);
    mockPaymentRetrieve.mockRejectedValue(new Error("stripe down"));
    await expect(record(paidSession())).rejects.toThrow("stripe down");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("支払い未完了は見送る（notPaid）", async () => {
    expect(await record(paidSession({ payment_status: "unpaid" }))).toEqual({
      outcome: "ignored",
      reason: "notPaid",
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("サブスクリプションモードの Session は見送る（notPaid）", async () => {
    expect(await record(paidSession({ mode: "subscription" }))).toEqual({
      outcome: "ignored",
      reason: "notPaid",
    });
  });

  it("line_items が展開されていなければ見送る（missingLineItems）", async () => {
    expect(await record(paidSession({ line_items: undefined }))).toEqual({
      outcome: "ignored",
      reason: "missingLineItems",
    });
  });

  it("知らない Price は見送り、ログを残す（unknownPrice）", async () => {
    const result = await record(
      paidSession({ line_items: { data: [{ price: { id: "price_x" } }] } }),
    );
    expect(result).toEqual({ outcome: "ignored", reason: "unknownPrice" });
    expect(console.error).toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("PaymentIntent が無ければ見送る（missingPaymentIntent）", async () => {
    expect(await record(paidSession({ payment_intent: null }))).toEqual({
      outcome: "ignored",
      reason: "missingPaymentIntent",
    });
  });

  it("stripe_customers に無い顧客は見送る（unknownCustomer）。metadata は見ない", async () => {
    seq().setResults([]);
    const result = await record(
      paidSession({ metadata: { supabaseUserId: USER_ID } }),
    );
    expect(result).toEqual({ outcome: "ignored", reason: "unknownCustomer" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("customer が無い Session も見送る（unknownCustomer）", async () => {
    expect(await record(paidSession({ customer: null }))).toEqual({
      outcome: "ignored",
      reason: "unknownCustomer",
    });
  });

  it("期間パス: 有効なパスが無ければ今から 30 日", async () => {
    seq().setResults([{ userId: USER_ID }], []);
    const result = await record(paidSession());

    expect(result).toEqual({ outcome: "recorded", purchaseId: "purchase-1" });
    const insertChain = mockInsert.mock.results[0]?.value;
    expect(insertChain.values).toHaveBeenCalledWith({
      userId: USER_ID,
      plan: "pro",
      kind: "pass",
      benefits: ["unlimited_practice", "practice_tools"],
      stripeCheckoutSessionId: "cs_1",
      stripePaymentIntentId: "pi_1",
      currency: "jpy",
      amount: 480,
      revokedAt: undefined,
      revokeReason: undefined,
      startsAt: NOW,
      expiresAt: new Date("2026-10-31T12:00:00Z"),
    });
    expect(insertChain.onConflictDoNothing).toHaveBeenCalledWith({
      target: "stripe_checkout_session_id",
    });
  });

  it("期間パスの重ね買い: 現在のパスの期限から始める", async () => {
    const currentExpiry = new Date("2026-10-20T00:00:00Z");
    seq().setResults([{ userId: USER_ID }], [{ expiresAt: currentExpiry }]);

    await record(paidSession());

    const insertChain = mockInsert.mock.results[0]?.value;
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        startsAt: currentExpiry,
        expiresAt: new Date("2026-11-19T00:00:00Z"),
      }),
    );
  });

  it("買い切り: 即時開始・期限なし。パスの期限は問い合わせない", async () => {
    seq().setResults([{ userId: USER_ID }]);

    await record(
      paidSession({
        line_items: { data: [{ price: { id: "price_life" } }] },
        amount_total: 1480,
      }),
    );

    expect(seq().chains).toHaveLength(1);
    const insertChain = mockInsert.mock.results[0]?.value;
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "lifetime",
        amount: 1480,
        startsAt: NOW,
        expiresAt: undefined,
      }),
    );
  });

  it("同じ Session を 2 回記録すると 2 回目は duplicate", async () => {
    seq().setResults([{ userId: USER_ID }], []);
    mockInsert.mockReturnValue(createQueryChain([]));

    expect(await record(paidSession())).toEqual({ outcome: "duplicate" });
  });

  it("展開済みオブジェクトの customer / payment_intent からも ID を取る", async () => {
    seq().setResults([{ userId: USER_ID }], []);

    await record(
      paidSession({
        customer: { id: "cus_obj" },
        payment_intent: { id: "pi_obj" },
      }),
    );

    const insertChain = mockInsert.mock.results[0]?.value;
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ stripePaymentIntentId: "pi_obj" }),
    );
  });

  it("通貨は小文字に正規化する", async () => {
    seq().setResults([{ userId: USER_ID }], []);
    await record(paidSession({ currency: "JPY" }));
    const insertChain = mockInsert.mock.results[0]?.value;
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "jpy" }),
    );
  });
});

describe("hasActiveLifetimePurchase", () => {
  it("行があれば true、無ければ false", async () => {
    seq().setResults([{ id: "p" }]);
    expect(await hasActiveLifetimePurchase(USER_ID)).toBe(true);
    seq().setResults([]);
    expect(await hasActiveLifetimePurchase(USER_ID)).toBe(false);
  });
});

describe("revokePurchaseByPaymentIntent", () => {
  it("取り消せたら true。revoked_at と理由を一緒に書く", async () => {
    mockUpdate.mockReturnValue(createQueryChain([{ id: "p" }]));
    const result = await revokePurchaseByPaymentIntent(
      "pi_1",
      PurchaseRevokeReason.Refunded,
      NOW,
    );
    expect(result).toBe(true);
    const chain = mockUpdate.mock.results[0]?.value;
    expect(chain.set).toHaveBeenCalledWith({
      revokedAt: NOW,
      revokeReason: "refunded",
    });
  });

  it("該当行が無い・既に取消済みなら false", async () => {
    mockUpdate.mockReturnValue(createQueryChain([]));
    expect(
      await revokePurchaseByPaymentIntent("pi_x", PurchaseRevokeReason.Fraud),
    ).toBe(false);
  });
});
