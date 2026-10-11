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

import {
  finishIapPurchase,
  listIapPurchases,
  onIapPurchase,
  requestIapPurchase,
} from "./iap";

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

describe("取引の完了", () => {
  it("イベントで届いた取引は finishTransaction で完了する", async () => {
    const listener = vi.fn();
    const unsubscribe = onIapPurchase(listener);
    mocks.purchaseUpdated?.(PURCHASE);

    await finishIapPurchase(listener.mock.calls[0]?.[0]);

    expect(mocks.finishTransaction).toHaveBeenCalledWith({
      purchase: PURCHASE,
      isConsumable: false,
    });
    unsubscribe();
  });

  it("一覧から読んだ取引の完了は finishTransaction を呼ばない", async () => {
    mocks.getAvailablePurchases.mockResolvedValue([
      { ...PURCHASE, transactionId: "2000000000000002" },
    ]);
    const [listed] = await listIapPurchases();

    await finishIapPurchase(listed);

    expect(mocks.finishTransaction).not.toHaveBeenCalled();
  });

  it("イベントで届いた未完了の取引は、一覧で読み直しても完了する", async () => {
    const PENDING = { ...PURCHASE, transactionId: "2000000000000003" };
    const listener = vi.fn();
    const unsubscribe = onIapPurchase(listener);
    mocks.purchaseUpdated?.(PENDING);
    mocks.getAvailablePurchases.mockResolvedValue([PENDING]);
    await listIapPurchases();

    await finishIapPurchase(listener.mock.calls[0]?.[0]);

    expect(mocks.finishTransaction).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("完了に失敗しても控えを残さない（2 度目は呼ばない）", async () => {
    const FAILING = { ...PURCHASE, transactionId: "2000000000000004" };
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.finishTransaction.mockRejectedValueOnce(new Error("boom"));
    const listener = vi.fn();
    const unsubscribe = onIapPurchase(listener);
    mocks.purchaseUpdated?.(FAILING);

    await finishIapPurchase(listener.mock.calls[0]?.[0]);
    await finishIapPurchase(listener.mock.calls[0]?.[0]);

    expect(mocks.finishTransaction).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
