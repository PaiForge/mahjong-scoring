import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  purchaseUpdated: undefined as ((purchase: unknown) => void) | undefined,
  requestPurchase: vi.fn(),
  finishTransaction: vi.fn(),
  getAvailablePurchases: vi.fn(),
}));

vi.mock("expo-iap", () => ({
  ErrorCode: {
    UserCancelled: "user-cancelled",
    DeferredPayment: "deferred-payment",
    NotPrepared: "not-prepared",
    Unknown: "unknown",
  },
  initConnection: async () => true,
  fetchProducts: vi.fn(),
  finishTransaction: mocks.finishTransaction,
  getAvailablePurchases: mocks.getAvailablePurchases,
  purchaseErrorListener: () => ({ remove: () => undefined }),
  purchaseUpdatedListener: (listener: (purchase: unknown) => void) => {
    mocks.purchaseUpdated = listener;
    return {
      remove: () => {
        mocks.purchaseUpdated = undefined;
      },
    };
  },
  requestPurchase: mocks.requestPurchase,
}));
vi.mock("./iap-availability", () => ({ IAP_AVAILABLE: true }));

import { onIapPurchase, requestIapPurchase } from "./iap";

const PURCHASE = {
  transactionId: "2000000000000001",
  productId: "help.mahjong.score.pro.lifetime",
  purchaseToken: "jws",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requestPurchase.mockResolvedValue(PURCHASE);
});

describe("取引の届け方", () => {
  it("購入の要求の戻り値からは取引を配らない", async () => {
    const listener = vi.fn();
    const unsubscribe = onIapPurchase(listener);

    await requestIapPurchase(PURCHASE.productId, "user-a");

    expect(mocks.requestPurchase).toHaveBeenCalledTimes(1);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("StoreKit のイベントで 1 回だけ届く", async () => {
    const listener = vi.fn();
    const unsubscribe = onIapPurchase(listener);

    await requestIapPurchase(PURCHASE.productId, "user-a");
    mocks.purchaseUpdated?.(PURCHASE);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      transactionId: PURCHASE.transactionId,
      productId: PURCHASE.productId,
      jws: "jws",
    });
    unsubscribe();
  });
});
