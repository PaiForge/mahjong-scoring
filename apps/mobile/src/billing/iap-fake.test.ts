import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  /** 偽の購入画面で押すボタンの文字 */
  press: "Buy",
}));

vi.mock("react-native", () => ({
  Alert: {
    alert: (
      _title: string,
      _message: string,
      buttons: readonly { text: string; onPress?: () => void }[],
    ) => {
      buttons.find((button) => button.text === mocks.press)?.onPress?.();
    },
  },
}));
vi.mock("expo-iap", () => ({
  ErrorCode: {
    UserCancelled: "user-cancelled",
    DeferredPayment: "deferred-payment",
    Unknown: "unknown",
  },
}));

import { fakeStore } from "./iap-fake";

const PRODUCT_ID = "help.mahjong.score.pro.pass30";

beforeEach(() => {
  mocks.press = "Buy";
});

describe("偽ストアの購入", () => {
  it("買うと受け手に購入が届き、その key が返る", async () => {
    const listener = vi.fn();
    const unsubscribe = fakeStore.onPurchase(listener);

    const key = await fakeStore.requestPurchase(PRODUCT_ID, "user-a");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      key,
      productId: PRODUCT_ID,
      token: key,
    });
    unsubscribe();
  });

  it("購入トークンは mock: で始まる", async () => {
    const key = await fakeStore.requestPurchase(PRODUCT_ID, "user-a");

    expect(key?.startsWith("mock:")).toBe(true);
  });

  it("取り消しは user-cancelled の失敗を配り、undefined を返す", async () => {
    mocks.press = "Cancel";
    const listener = vi.fn();
    const unsubscribe = fakeStore.onPurchaseError(listener);

    await expect(
      fakeStore.requestPurchase(PRODUCT_ID, "user-a"),
    ).resolves.toBeUndefined();

    expect(listener).toHaveBeenCalledWith("user-cancelled", "cancelled");
    unsubscribe();
  });

  it("失敗は不明の失敗を配り、undefined を返す", async () => {
    mocks.press = "Fail";
    const listener = vi.fn();
    const unsubscribe = fakeStore.onPurchaseError(listener);

    await expect(
      fakeStore.requestPurchase(PRODUCT_ID, "user-a"),
    ).resolves.toBeUndefined();

    expect(listener).toHaveBeenCalledWith("unknown", "mock failure");
    unsubscribe();
  });
});

describe("偽ストアの完了と一覧", () => {
  async function buy(): Promise<string> {
    const key = await fakeStore.requestPurchase(PRODUCT_ID, "user-a");
    if (key === undefined) throw new Error("買えなかった");
    return key;
  }

  async function listedKeys(): Promise<readonly string[]> {
    const listed = await fakeStore.listPurchases();
    if (!listed.ok) throw new Error("一覧を読めなかった");
    return listed.purchases.map(({ key }) => key);
  }

  it("完了する前の購入は一覧に載る", async () => {
    const key = await buy();

    expect(await listedKeys()).toContain(key);
  });

  it("consume した購入は一覧に残らない", async () => {
    const key = await buy();

    await fakeStore.finishPurchase(
      { key, productId: PRODUCT_ID, token: key },
      { consumable: true },
    );

    expect(await listedKeys()).not.toContain(key);
  });

  it("acknowledge した購入は一覧に残る", async () => {
    const key = await buy();

    await fakeStore.finishPurchase(
      { key, productId: PRODUCT_ID, token: key },
      { consumable: false },
    );

    expect(await listedKeys()).toContain(key);
  });
});

describe("偽ストアの記録の要求", () => {
  it("Google Play の記録のパスへ商品と購入トークンを送る", () => {
    expect(
      fakeStore.recordRequestOf({
        key: "mock:abc",
        productId: PRODUCT_ID,
        token: "mock:abc",
      }),
    ).toEqual({
      path: "/api/mobile/v1/iap/google/purchases",
      body: { productId: PRODUCT_ID, purchaseToken: "mock:abc" },
    });
  });

  it("商品の価格は MOCK", async () => {
    await expect(fakeStore.fetchProducts([PRODUCT_ID])).resolves.toEqual([
      { productId: PRODUCT_ID, displayPrice: "MOCK" },
    ]);
  });
});
