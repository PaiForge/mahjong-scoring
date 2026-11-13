import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  /** 端末の言語（`expo-localization` の `getLocales()` の言語タグ） */
  languageTags: ["ja-JP"],
  finishIapPurchase: vi.fn(),
  listIapPurchases: vi.fn(),
  loadPlanOffers: vi.fn(),
  postPurchase: vi.fn(),
  invalidatePlan: vi.fn(),
  requestIapPurchase: vi.fn(),
  showToast: vi.fn(),
  purchaseListener: undefined as
    | ((purchase: { key: string; productId: string; token: string }) => void)
    | undefined,
}));

vi.mock("./iap", () => ({
  connectIap: async () => false,
  finishIapPurchase: mocks.finishIapPurchase,
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
  postPurchase: mocks.postPurchase,
}));
vi.mock("./use-plan", () => ({ invalidatePlan: mocks.invalidatePlan }));
vi.mock("./use-plan-offers", () => ({ loadPlanOffers: mocks.loadPlanOffers }));
vi.mock("../auth/use-auth", () => ({ useAuth: vi.fn() }));
vi.mock("../components/toast", () => ({ showToast: mocks.showToast }));
vi.mock("expo-localization", () => ({
  getLocales: () => mocks.languageTags.map((languageTag) => ({ languageTag })),
}));

import {
  buyIapProduct,
  restoreIapPurchases,
  startPurchaseSync,
} from "./use-purchase-sync";

const PRODUCT_ID = "help.mahjong.score.pro.pass30";
const LIFETIME_PRODUCT_ID = "help.mahjong.score.pro.lifetime";

/** 記録の応答（プランの中身は検査に使わないので最小限） */
function recordedAs(outcome: "recorded" | "duplicate") {
  return { value: { outcome, status: { kind: "pass" } } };
}

/** 購入をストアのイベントとして届ける */
function deliver(key: string, productId: string = PRODUCT_ID): void {
  mocks.purchaseListener?.({ key, productId, token: "token" });
}

/** 保留中の Promise の続きを流す */
async function flush(): Promise<void> {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loadPlanOffers.mockResolvedValue([
    { key: "pass", productId: PRODUCT_ID },
    { key: "lifetime", productId: LIFETIME_PRODUCT_ID },
  ]);
});

describe("restoreIapPurchases", () => {
  it("端末の購入を読めなかったら、送らずに failed を返す", async () => {
    mocks.listIapPurchases.mockResolvedValue({ ok: false });

    await expect(restoreIapPurchases("user-a")).resolves.toBe("failed");

    expect(mocks.postPurchase).not.toHaveBeenCalled();
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
    mocks.postPurchase.mockReturnValue(
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

  it("取引が届かなければ、記録の始まりの猶予が過ぎたら返る", async () => {
    vi.useFakeTimers();
    try {
      const stop = startPurchaseSync("user-a", () => false);
      mocks.requestIapPurchase.mockResolvedValue("tx-lost");

      let settled = false;
      const buying = buyIapProduct(PRODUCT_ID, "user-a").then(() => {
        settled = true;
      });
      await flush();
      expect(settled).toBe(false);

      await vi.advanceTimersByTimeAsync(3_000);
      await buying;
      expect(mocks.postPurchase).not.toHaveBeenCalled();
      stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it("送り直しの最中は、猶予を越えても記録が終わるまで待つ", async () => {
    vi.useFakeTimers();
    try {
      const stop = startPurchaseSync("user-a", () => false);
      let respond: (value: unknown) => void = () => {};
      mocks.postPurchase
        .mockResolvedValueOnce({ error: "network" })
        .mockReturnValueOnce(
          new Promise((resolve) => {
            respond = resolve;
          }),
        );
      mocks.requestIapPurchase.mockImplementation(async () => {
        deliver("tx-retry");
        return "tx-retry";
      });

      let settled = false;
      const buying = buyIapProduct(PRODUCT_ID, "user-a").then(() => {
        settled = true;
      });
      // 猶予（3 秒）と最初の送り直しの間（2 秒）を越える
      await vi.advanceTimersByTimeAsync(10_000);
      expect(mocks.postPurchase).toHaveBeenCalledTimes(2);
      expect(settled).toBe(false);

      respond(recordedAs("recorded"));
      await buying;
      expect(settled).toBe(true);
      stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it("要求が返る前に記録が終わっていても待ち続けない", async () => {
    const stop = startPurchaseSync("user-a", () => false);
    mocks.postPurchase.mockResolvedValue(recordedAs("recorded"));
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

    expect(mocks.postPurchase).not.toHaveBeenCalled();
  });

  it("App Store の通知が先に記録して duplicate でも、記録を知らせる", async () => {
    const stop = startPurchaseSync("user-a", () => false);
    mocks.postPurchase.mockResolvedValue(recordedAs("duplicate"));
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
    mocks.postPurchase.mockResolvedValue(response);
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
    mocks.postPurchase.mockResolvedValue(recordedAs("duplicate"));

    deliver("tx-replay");
    await flush();

    expect(mocks.postPurchase).toHaveBeenCalledTimes(1);
    expect(mocks.showToast).not.toHaveBeenCalled();
    stop();
  });

  it("recorded（Ask to Buy の承認等）は知らせる", async () => {
    const stop = startPurchaseSync("user-a", () => false);
    mocks.postPurchase.mockResolvedValue(recordedAs("recorded"));

    deliver("tx-approved");
    await flush();

    expect(mocks.showToast).toHaveBeenCalledTimes(1);
    stop();
  });
});

describe("購入の完了の種類", () => {
  it("販売中の売り方がパスの商品は消費型として完了する", async () => {
    const stop = startPurchaseSync("user-a", () => false);
    mocks.postPurchase.mockResolvedValue(recordedAs("recorded"));

    deliver("tx-pass");
    await flush();

    expect(mocks.finishIapPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ key: "tx-pass" }),
      { consumable: true },
    );
    stop();
  });

  it("買い切りは非消費で完了する", async () => {
    const stop = startPurchaseSync("user-a", () => false);
    mocks.postPurchase.mockResolvedValue(recordedAs("recorded"));

    deliver("tx-lifetime", LIFETIME_PRODUCT_ID);
    await flush();

    expect(mocks.finishIapPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ key: "tx-lifetime" }),
      { consumable: false },
    );
    stop();
  });

  it("販売中の一覧に無い商品は失わない側（非消費）で完了する", async () => {
    const stop = startPurchaseSync("user-a", () => false);
    mocks.postPurchase.mockResolvedValue(recordedAs("recorded"));
    mocks.loadPlanOffers.mockResolvedValue([]);

    deliver("tx-unknown");
    await flush();

    expect(mocks.finishIapPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ key: "tx-unknown" }),
      { consumable: false },
    );
    stop();
  });

  it("購入はアダプタの形のまま送る", async () => {
    const stop = startPurchaseSync("user-a", () => false);
    mocks.postPurchase.mockResolvedValue(recordedAs("recorded"));

    deliver("tx-shape");
    await flush();

    expect(mocks.postPurchase).toHaveBeenCalledWith("user-a", {
      key: "tx-shape",
      productId: PRODUCT_ID,
      token: "token",
    });
    stop();
  });
});

describe("トーストの言語", () => {
  it("端末が英語なら、英語の辞書の文言で知らせる（Provider の外でも端末の言語に従う）", async () => {
    mocks.languageTags = ["en-US"];
    vi.resetModules();
    try {
      const { startPurchaseSync: startInEnglish } =
        await import("./use-purchase-sync");
      const stop = startInEnglish("user-a", () => false);
      mocks.postPurchase.mockResolvedValue(recordedAs("recorded"));

      deliver("tx-english");
      await flush();

      expect(mocks.showToast).toHaveBeenCalledWith(
        enMessages.mobilePlan.purchaseRecorded,
        "success",
      );
      stop();
    } finally {
      mocks.languageTags = ["ja-JP"];
    }
  });
});
