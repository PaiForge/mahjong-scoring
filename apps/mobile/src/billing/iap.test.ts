import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  purchaseUpdated: undefined as ((purchase: unknown) => void) | undefined,
  purchaseError: undefined as
    ((error: { code?: string; message: string }) => void) | undefined,
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
  purchaseErrorListener: (
    listener: (error: { code?: string; message: string }) => void,
  ) => {
    mocks.purchaseError = listener;
    return {
      remove: () => {
        mocks.purchaseError = undefined;
      },
    };
  },
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
  onIapPurchaseError,
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

describe("失敗の届け方", () => {
  it("イベントで失敗が届いた後に要求も拒否されたら、受け手には 1 回だけ届く", async () => {
    const listener = vi.fn();
    const unsubscribe = onIapPurchaseError(listener);
    mocks.requestPurchase.mockImplementation(async () => {
      mocks.purchaseError?.({ code: "user-cancelled", message: "cancelled" });
      throw Object.assign(new Error("cancelled"), { code: "user-cancelled" });
    });

    await requestIapPurchase(PURCHASE.productId, "user-a");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith("user-cancelled", "cancelled");
    unsubscribe();
  });

  it("イベントで届かず要求だけ拒否されたら、拒否の失敗を知らせる", async () => {
    const listener = vi.fn();
    const unsubscribe = onIapPurchaseError(listener);
    mocks.requestPurchase.mockRejectedValue(
      Object.assign(new Error("boom"), { code: "unknown" }),
    );

    await requestIapPurchase(PURCHASE.productId, "user-a");

    expect(listener).toHaveBeenCalledTimes(1);
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
    const listed = await listIapPurchases();
    if (!listed.ok) throw new Error("一覧を読めなかった");

    await finishIapPurchase(listed.purchases[0]);

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

describe("購入の一覧", () => {
  it("読めた購入を返す", async () => {
    mocks.getAvailablePurchases.mockResolvedValue([PURCHASE]);

    await expect(listIapPurchases()).resolves.toEqual({
      ok: true,
      purchases: [
        {
          transactionId: PURCHASE.transactionId,
          productId: PURCHASE.productId,
          jws: "jws",
        },
      ],
    });
  });

  it("一覧の取得に失敗したら、購入なしではなく失敗を返す", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.getAvailablePurchases.mockRejectedValueOnce(new Error("offline"));

    await expect(listIapPurchases()).resolves.toEqual({ ok: false });
  });
});
