import { describe, expect, it } from "vitest";

import { GOOGLE_PLAY_PACKAGE_NAME } from "../env";
import { googleRejectionOf } from "../rejection";
import type { GooglePurchase } from "../verifier";

const USER = "11111111-1111-4111-8111-111111111111";

const purchase: GooglePurchase = {
  purchaseToken: "token-1",
  productId: "help.mahjong.score.pro.lifetime",
  packageName: GOOGLE_PLAY_PACKAGE_NAME,
  orderId: "GPA.1234",
  purchaseDate: new Date("2026-11-14T00:00:00Z"),
  state: "purchased",
  environment: "Production",
};

function rejection(
  overrides: Partial<GooglePurchase> = {},
  testUserIds: ReadonlySet<string> = new Set(),
  // 既定引数にすると undefined（知らない商品）を渡せないので、引数の有無で分ける
  ...kindArg: ["pass" | "lifetime" | undefined] | []
) {
  const kind = kindArg.length === 0 ? "lifetime" : kindArg[0];
  return googleRejectionOf(
    USER,
    { ...purchase, ...overrides },
    kind,
    testUserIds,
  );
}

describe("googleRejectionOf", () => {
  it("自分のアプリの支払い済みの Production の購入は受け入れる", () => {
    expect(rejection()).toBeUndefined();
  });

  it("別のアプリの購入は unknownPackage（他の理由より先）", () => {
    expect(
      rejection(
        { packageName: "other.app", state: "cancelled" },
        new Set(),
        undefined,
      ),
    ).toBe("unknownPackage");
  });

  it("売り方が引けなければ unknownProduct（状態より先）", () => {
    expect(rejection({ state: "pending" }, new Set(), undefined)).toBe(
      "unknownProduct",
    );
  });

  it("取り消し済みは cancelled、保留中は pending", () => {
    expect(rejection({ state: "cancelled" })).toBe("cancelled");
    expect(rejection({ state: "pending" })).toBe("pending");
  });

  it("保留中のテストの購入は許可リストより先に pending", () => {
    expect(rejection({ state: "pending", environment: "Test" })).toBe(
      "pending",
    );
  });

  it("Test の購入は許可リストにいなければ testNotAccepted", () => {
    expect(rejection({ environment: "Test" })).toBe("testNotAccepted");
  });

  it("Test の購入は許可リストの本人なら受け入れる（大文字小文字を問わない）", () => {
    expect(
      googleRejectionOf(
        USER.toUpperCase(),
        { ...purchase, environment: "Test" },
        "pass",
        new Set([USER]),
      ),
    ).toBeUndefined();
  });
});
