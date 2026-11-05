import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listIapPurchases: vi.fn(),
  postAppleTransaction: vi.fn(),
  invalidatePlan: vi.fn(),
  requestIapPurchase: vi.fn(),
  showToast: vi.fn(),
  purchaseListener: undefined as
    | ((purchase: {
        transactionId: string;
        productId: string;
        jws: string;
      }) => void)
    | undefined,
}));

vi.mock("./iap", () => ({
  connectIap: async () => false,
  finishIapPurchase: vi.fn(),
  listIapPurchases: mocks.listIapPurchases,
  onIapPurchase: (listener: typeof mocks.purchaseListener) => {
    mocks.purchaseListener = listener;
    return () => {
      mocks.purchaseListener = undefined;
    };
  },
  requestIapPurchase: mocks.requestIapPurchase,
}));
vi.mock("./iap-availability", () => ({ IAP_AVAILABLE: true }));
vi.mock("./plan-api", () => ({
  postAppleTransaction: mocks.postAppleTransaction,
}));
vi.mock("./use-plan", () => ({ invalidatePlan: mocks.invalidatePlan }));
vi.mock("../auth/use-auth", () => ({ useAuth: vi.fn() }));
vi.mock("../components/toast", () => ({ showToast: mocks.showToast }));

import {
  buyIapProduct,
  restoreIapPurchases,
  startPurchaseSync,
} from "./use-purchase-sync";

const PRODUCT_ID = "help.mahjong.score.pro.pass30";

/** 記録の応答（プランの中身は検査に使わないので最小限） */
function recordedAs(outcome: "recorded" | "duplicate") {
  return { value: { outcome, status: { kind: "pass" } } };
}

/** 取引を StoreKit のイベントとして届ける */
function deliver(transactionId: string): void {
  mocks.purchaseListener?.({
    transactionId,
    productId: PRODUCT_ID,
    jws: "jws",
  });
}

/** 保留中の Promise の続きを流す */
async function flush(): Promise<void> {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("restoreIapPurchases", () => {
  it("端末の購入を読めなかったら、送らずに failed を返す", async () => {
    mocks.listIapPurchases.mockResolvedValue({ ok: false });

    await expect(restoreIapPurchases("user-a")).resolves.toBe("failed");

    expect(mocks.postAppleTransaction).not.toHaveBeenCalled();
  });

  it("端末に購入が無ければ nothingToRestore を返す", async () => {
    mocks.listIapPurchases.mockResolvedValue({ ok: true, purchases: [] });

    await expect(restoreIapPurchases("user-a")).resolves.toBe(
      "nothingToRestore",
    );
  });
});

describe("プラン画面からの購入", () => {
  it("取引の記録が終わるまで解決しない", async () => {
    const stop = startPurchaseSync("user-a", () => false);
    let respond: (value: unknown) => void = () => {};
    mocks.postAppleTransaction.mockReturnValue(
      new Promise((resolve) => {
        respond = resolve;
      }),
    );
    mocks.requestIapPurchase.mockImplementation(async () => {
      deliver("tx-wait");
      return "tx-wait";
    });

    let settled = false;
    const buying = buyIapProduct(PRODUCT_ID, "user-a").then(() => {
      settled = true;
    });
    await flush();
    expect(settled).toBe(false);

    respond(recordedAs("recorded"));
    await buying;
    expect(settled).toBe(true);
    stop();
  });

  it("要求が返る前に記録が終わっていても待ち続けない", async () => {
    const stop = startPurchaseSync("user-a", () => false);
    mocks.postAppleTransaction.mockResolvedValue(recordedAs("recorded"));
    mocks.requestIapPurchase.mockImplementation(async () => {
      deliver("tx-early");
      await flush();
      return "tx-early";
    });

    await buyIapProduct(PRODUCT_ID, "user-a");
    stop();
  });

  it("取り消し（取引なし）は購入画面が閉じた時点で返る", async () => {
    mocks.requestIapPurchase.mockResolvedValue(undefined);

    await buyIapProduct(PRODUCT_ID, "user-a");

    expect(mocks.postAppleTransaction).not.toHaveBeenCalled();
  });

  it("App Store の通知が先に記録して duplicate でも、記録を知らせる", async () => {
    const stop = startPurchaseSync("user-a", () => false);
    mocks.postAppleTransaction.mockResolvedValue(recordedAs("duplicate"));
    mocks.requestIapPurchase.mockImplementation(async () => {
      deliver("tx-dup");
      return "tx-dup";
    });

    await buyIapProduct(PRODUCT_ID, "user-a");

    expect(mocks.showToast).toHaveBeenCalledTimes(1);
    stop();
  });

  it("記録の応答のプランを画面に渡す", async () => {
    const stop = startPurchaseSync("user-a", () => false);
    const response = recordedAs("recorded");
    mocks.postAppleTransaction.mockResolvedValue(response);
    mocks.requestIapPurchase.mockImplementation(async () => {
      deliver("tx-plan");
      return "tx-plan";
    });

    await buyIapProduct(PRODUCT_ID, "user-a");

    expect(mocks.invalidatePlan).toHaveBeenCalledWith({
      userId: "user-a",
      plan: response.value,
    });
    stop();
  });
});

describe("プラン画面の外で届いた取引", () => {
  it("duplicate（記録済みの配り直し）は知らせない", async () => {
    const stop = startPurchaseSync("user-a", () => false);
    mocks.postAppleTransaction.mockResolvedValue(recordedAs("duplicate"));

    deliver("tx-replay");
    await flush();

    expect(mocks.postAppleTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.showToast).not.toHaveBeenCalled();
    stop();
  });

  it("recorded（Ask to Buy の承認等）は知らせる", async () => {
    const stop = startPurchaseSync("user-a", () => false);
    mocks.postAppleTransaction.mockResolvedValue(recordedAs("recorded"));

    deliver("tx-approved");
    await flush();

    expect(mocks.showToast).toHaveBeenCalledTimes(1);
    stop();
  });
});
