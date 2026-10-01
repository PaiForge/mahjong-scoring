import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockSessionsRetrieve,
  mockChargesRetrieve,
  mockRecordPurchase,
  mockRevoke,
} = vi.hoisted(() => ({
  mockSessionsRetrieve: vi.fn(),
  mockChargesRetrieve: vi.fn(),
  mockRecordPurchase: vi.fn(),
  mockRevoke: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("../stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { retrieve: mockSessionsRetrieve } },
    charges: { retrieve: mockChargesRetrieve },
  }),
}));
vi.mock("../purchases", () => ({
  PurchaseRevokeReason: { Refunded: "refunded", Fraud: "fraud" },
  recordPurchaseFromCheckoutSession: mockRecordPurchase,
  revokePurchaseByPaymentIntent: mockRevoke,
}));

import {
  dispatchStripeEvent,
  handleChargeRefunded,
  handleCheckoutSessionCompleted,
} from "../webhook-handlers";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("handleCheckoutSessionCompleted", () => {
  it("line_items を展開して Session を取り直し、購入を記録する", async () => {
    const session = { id: "cs_1" };
    mockSessionsRetrieve.mockResolvedValue(session);
    mockRecordPurchase.mockResolvedValue({
      outcome: "recorded",
      purchaseId: "p1",
    });

    const result = await handleCheckoutSessionCompleted("cs_1");

    expect(mockSessionsRetrieve).toHaveBeenCalledWith("cs_1", {
      expand: ["line_items"],
    });
    expect(mockRecordPurchase).toHaveBeenCalledWith(session);
    expect(result).toEqual({ outcome: "recorded", purchaseId: "p1" });
    expect(console.error).not.toHaveBeenCalled();
  });

  it("見送られたらログを残す（投げない）", async () => {
    mockSessionsRetrieve.mockResolvedValue({ id: "cs_1" });
    mockRecordPurchase.mockResolvedValue({
      outcome: "ignored",
      reason: "unknownPrice",
    });

    const result = await handleCheckoutSessionCompleted("cs_1");

    expect(result).toEqual({ outcome: "ignored", reason: "unknownPrice" });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[stripe-webhook]"),
      expect.anything(),
    );
  });
});

describe("handleChargeRefunded", () => {
  it("全額返金なら PaymentIntent で購入を取り消す", async () => {
    mockChargesRetrieve.mockResolvedValue({
      payment_intent: "pi_1",
      amount: 480,
      amount_refunded: 480,
    });
    mockRevoke.mockResolvedValue(true);

    expect(await handleChargeRefunded("ch_1")).toEqual({ outcome: "revoked" });
    expect(mockRevoke).toHaveBeenCalledWith("pi_1", "refunded");
  });

  it("部分返金は取り消さない", async () => {
    mockChargesRetrieve.mockResolvedValue({
      payment_intent: "pi_1",
      amount: 480,
      amount_refunded: 100,
    });

    expect(await handleChargeRefunded("ch_1")).toEqual({
      outcome: "partialRefund",
    });
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it("該当する購入が無ければ notFound", async () => {
    mockChargesRetrieve.mockResolvedValue({
      payment_intent: { id: "pi_obj" },
      amount: 480,
      amount_refunded: 480,
    });
    mockRevoke.mockResolvedValue(false);

    expect(await handleChargeRefunded("ch_1")).toEqual({ outcome: "notFound" });
    expect(mockRevoke).toHaveBeenCalledWith("pi_obj", "refunded");
  });

  it("PaymentIntent の無い Charge は何もしない", async () => {
    mockChargesRetrieve.mockResolvedValue({
      payment_intent: null,
      amount: 480,
      amount_refunded: 480,
    });
    expect(await handleChargeRefunded("ch_1")).toEqual({
      outcome: "noPaymentIntent",
    });
  });
});

describe("dispatchStripeEvent", () => {
  it("checkout.session.completed は Session の id で記録処理へ", async () => {
    mockSessionsRetrieve.mockResolvedValue({ id: "cs_9" });
    mockRecordPurchase.mockResolvedValue({ outcome: "duplicate" });

    const handled = await dispatchStripeEvent(
      // テストでは Event の最小形だけを渡す
      {
        type: "checkout.session.completed",
        data: { object: { id: "cs_9" } },
      } as unknown as Parameters<typeof dispatchStripeEvent>[0],
    );

    expect(handled).toBe(true);
    expect(mockSessionsRetrieve).toHaveBeenCalledWith("cs_9", {
      expand: ["line_items"],
    });
  });

  it("購読していない種別は無視し false を返す", async () => {
    const handled = await dispatchStripeEvent({
      type: "customer.created",
      data: { object: { id: "cus_1" } },
    } as unknown as Parameters<typeof dispatchStripeEvent>[0]);

    expect(handled).toBe(false);
    expect(mockSessionsRetrieve).not.toHaveBeenCalled();
    expect(mockChargesRetrieve).not.toHaveBeenCalled();
  });
});
