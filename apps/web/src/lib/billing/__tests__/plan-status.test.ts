import { describe, expect, it } from "vitest";

import type { BenefitGrant, Purchase } from "@/lib/db";

import { makeGrant, makePurchase } from "../purchase-rows.fixture";

import {
  benefitGrantStateOf,
  blocksNewPurchase,
  formatPlanDate,
  formatPlanDateShort,
  offersPurchase,
  planStatusOf,
  purchaseBlockOf,
  purchaseProviderOf,
  purchaseStateOf,
} from "../plan-status";

const NOW = new Date("2026-10-01T03:00:00Z");

function applePurchase(
  environment: "Sandbox" | "Production",
  overrides: Partial<Purchase>,
): Purchase {
  return makePurchase({
    provider: "apple",
    stripeCheckoutSessionId: null,
    stripePaymentIntentId: null,
    appleTransactionId: "2000000000000001",
    appleOriginalTransactionId: "2000000000000001",
    appleProductId: "help.mahjong.score.pro.pass30",
    appleEnvironment: environment,
    ...overrides,
  });
}

function googlePurchase(
  environment: "Test" | "Production",
  overrides: Partial<Purchase>,
): Purchase {
  return makePurchase({
    provider: "google",
    stripeCheckoutSessionId: null,
    stripePaymentIntentId: null,
    googlePurchaseToken: "mock:token-1",
    googleOrderId: "MOCK.token-1",
    googleProductId: "help.mahjong.score.pro.pass30",
    googleEnvironment: environment,
    amount: 0,
    ...overrides,
  });
}

function grant(overrides: Partial<BenefitGrant>): BenefitGrant {
  return makeGrant({
    expiresAt: new Date("2026-10-25T00:00:00Z"),
    ...overrides,
  });
}

describe("purchaseStateOf", () => {
  it("取り消し済みは refunded（期限や種類より優先）", () => {
    expect(
      purchaseStateOf(
        makePurchase({
          revokedAt: NOW,
          revokeReason: "refunded",
          kind: "lifetime",
        }),
        NOW,
      ),
    ).toBe("refunded");
  });

  it("買い切りは常に active", () => {
    expect(
      purchaseStateOf(makePurchase({ kind: "lifetime", expiresAt: null }), NOW),
    ).toBe("active");
  });

  it("パスは期限で expired、開始前なら scheduled、それ以外は active", () => {
    expect(
      purchaseStateOf(
        makePurchase({ expiresAt: new Date("2026-09-30T00:00:00Z") }),
        NOW,
      ),
    ).toBe("expired");
    expect(
      purchaseStateOf(
        makePurchase({
          startsAt: new Date("2026-10-20T00:00:00Z"),
          expiresAt: new Date("2026-11-19T00:00:00Z"),
        }),
        NOW,
      ),
    ).toBe("scheduled");
    expect(purchaseStateOf(makePurchase({}), NOW)).toBe("active");
  });

  it("期限ちょうどは expired", () => {
    expect(purchaseStateOf(makePurchase({ expiresAt: NOW }), NOW)).toBe(
      "expired",
    );
  });
});

describe("blocksNewPurchase", () => {
  it("有効な購入と開始待ちの購入は追加購入を止める", () => {
    expect(blocksNewPurchase(makePurchase({}), NOW)).toBe(true);
    expect(
      blocksNewPurchase(
        makePurchase({ startsAt: new Date("2026-10-02T00:00:00Z") }),
        NOW,
      ),
    ).toBe(true);
    expect(
      blocksNewPurchase(
        makePurchase({ kind: "lifetime", expiresAt: null }),
        NOW,
      ),
    ).toBe(true);
  });

  it("期限切れと取り消し済みは止めない", () => {
    expect(
      blocksNewPurchase(
        makePurchase({ expiresAt: new Date("2026-09-30T00:00:00Z") }),
        NOW,
      ),
    ).toBe(false);
    expect(blocksNewPurchase(makePurchase({ expiresAt: NOW }), NOW)).toBe(
      false,
    );
    expect(
      blocksNewPurchase(
        makePurchase({ revokedAt: NOW, revokeReason: "x" }),
        NOW,
      ),
    ).toBe(false);
  });

  it("App Store の Sandbox の購入は有効でも止めない", () => {
    expect(blocksNewPurchase(applePurchase("Sandbox", {}), NOW)).toBe(false);
    expect(
      blocksNewPurchase(
        applePurchase("Sandbox", { kind: "lifetime", expiresAt: null }),
        NOW,
      ),
    ).toBe(false);
  });

  it("App Store の Production の購入は Stripe と同じく有効な間は止める", () => {
    expect(blocksNewPurchase(applePurchase("Production", {}), NOW)).toBe(true);
    expect(
      blocksNewPurchase(
        applePurchase("Production", {
          startsAt: new Date("2026-10-02T00:00:00Z"),
        }),
        NOW,
      ),
    ).toBe(true);
    expect(
      blocksNewPurchase(
        applePurchase("Production", {
          expiresAt: new Date("2026-09-30T00:00:00Z"),
        }),
        NOW,
      ),
    ).toBe(false);
  });

  it("Google Play の Test の購入は Apple の Sandbox と同じく有効でも止めない", () => {
    expect(blocksNewPurchase(googlePurchase("Test", {}), NOW)).toBe(false);
    expect(
      blocksNewPurchase(
        googlePurchase("Test", { kind: "lifetime", expiresAt: null }),
        NOW,
      ),
    ).toBe(false);
  });

  it("Google Play の Production の購入は有効な間は止める", () => {
    expect(blocksNewPurchase(googlePurchase("Production", {}), NOW)).toBe(true);
    expect(
      blocksNewPurchase(
        googlePurchase("Production", {
          expiresAt: new Date("2026-09-30T00:00:00Z"),
        }),
        NOW,
      ),
    ).toBe(false);
  });
});

describe("offersPurchase", () => {
  it("購入も付与も無ければ出す", () => {
    expect(offersPurchase([], [], NOW)).toBe(true);
  });

  it("追加購入を止める購入があれば出さない", () => {
    expect(offersPurchase([makePurchase({})], [], NOW)).toBe(false);
  });

  it("有効な付与があれば出さない（期限付き・無期限とも）", () => {
    expect(offersPurchase([], [grant({})], NOW)).toBe(false);
    expect(offersPurchase([], [grant({ expiresAt: null })], NOW)).toBe(false);
  });

  it("期限切れ・取り消し済み・開始前の付与なら出す", () => {
    expect(
      offersPurchase(
        [],
        [
          grant({ expiresAt: new Date("2026-09-30T00:00:00Z") }),
          grant({ revokedAt: NOW, revokeReason: "x" }),
          grant({ startsAt: new Date("2026-10-02T00:00:00Z") }),
        ],
        NOW,
      ),
    ).toBe(true);
  });
});

describe("purchaseBlockOf", () => {
  const PASS_UNTIL = new Date("2026-10-20T00:00:00Z");

  it("購入が無ければ売る", () => {
    expect(purchaseBlockOf([], NOW)).toEqual({ kind: "none" });
  });

  it("有効なパスがあれば、その期限まで売らない（利用中）", () => {
    expect(
      purchaseBlockOf([makePurchase({ expiresAt: PASS_UNTIL })], NOW),
    ).toEqual({ kind: "until", until: PASS_UNTIL, inUse: true });
  });

  it("開始待ちの購入だけなら、売らないが利用中ではない", () => {
    const until = new Date("2026-11-20T00:00:00Z");
    expect(
      purchaseBlockOf(
        [
          makePurchase({
            startsAt: new Date("2026-10-21T00:00:00Z"),
            expiresAt: until,
          }),
        ],
        NOW,
      ),
    ).toEqual({ kind: "until", until, inUse: false });
  });

  it("有効なパスと開始待ちのパスが並ぶときは、最も遅い期限まで売らない", () => {
    const later = new Date("2026-11-19T00:00:00Z");
    expect(
      purchaseBlockOf(
        [
          makePurchase({ expiresAt: PASS_UNTIL }),
          makePurchase({ id: "p2", startsAt: PASS_UNTIL, expiresAt: later }),
        ],
        NOW,
      ),
    ).toEqual({ kind: "until", until: later, inUse: true });
  });

  it("買い切りがあれば、パスと並んでいても期限なしで売らない", () => {
    expect(
      purchaseBlockOf(
        [
          makePurchase({ expiresAt: PASS_UNTIL }),
          makePurchase({ id: "p2", kind: "lifetime", expiresAt: null }),
        ],
        NOW,
      ),
    ).toEqual({ kind: "lifetime" });
  });

  it("期限切れ・返金済みの購入は売るのを止めない", () => {
    expect(
      purchaseBlockOf(
        [
          makePurchase({ expiresAt: new Date("2026-09-30T00:00:00Z") }),
          makePurchase({ id: "p2", revokedAt: NOW, revokeReason: "refund" }),
          makePurchase({
            id: "p3",
            kind: "lifetime",
            expiresAt: null,
            revokedAt: NOW,
            revokeReason: "refund",
          }),
        ],
        NOW,
      ),
    ).toEqual({ kind: "none" });
  });

  it("Sandbox / Test の購入は売るのを止めない", () => {
    expect(
      purchaseBlockOf(
        [
          applePurchase("Sandbox", { expiresAt: PASS_UNTIL }),
          googlePurchase("Test", { id: "p2", expiresAt: PASS_UNTIL }),
        ],
        NOW,
      ),
    ).toEqual({ kind: "none" });
  });
});

describe("purchaseProviderOf", () => {
  it("stripe / apple / google はそのまま、知らない値は stripe に倒す", () => {
    expect(purchaseProviderOf({ provider: "stripe" })).toBe("stripe");
    expect(purchaseProviderOf({ provider: "apple" })).toBe("apple");
    expect(purchaseProviderOf({ provider: "google" })).toBe("google");
    expect(purchaseProviderOf({ provider: "paypal" })).toBe("stripe");
  });
});

describe("planStatusOf", () => {
  it("購入が無ければ free", () => {
    expect(planStatusOf([], [], NOW)).toEqual({ kind: "free" });
  });

  it("有効な買い切りがあれば lifetime（パスより優先）", () => {
    expect(
      planStatusOf(
        [makePurchase({}), makePurchase({ kind: "lifetime", expiresAt: null })],
        [],
        NOW,
      ),
    ).toEqual({ kind: "lifetime" });
  });

  it("取り消された買い切りは無視する", () => {
    expect(
      planStatusOf(
        [
          makePurchase({
            kind: "lifetime",
            expiresAt: null,
            revokedAt: NOW,
            revokeReason: "refunded",
          }),
        ],
        [],
        NOW,
      ),
    ).toEqual({ kind: "free" });
  });

  it("開始待ちの購入で現在の期限を延ばさない", () => {
    const later = new Date("2026-11-19T00:00:00Z");
    expect(
      planStatusOf(
        [
          makePurchase({}),
          makePurchase({
            startsAt: new Date("2026-10-20T00:00:00Z"),
            expiresAt: later,
          }),
        ],
        [],
        NOW,
      ),
    ).toEqual({ kind: "pass", until: new Date("2026-10-20T00:00:00Z") });
  });

  it("期限切れのパスしか無ければ free", () => {
    expect(
      planStatusOf(
        [makePurchase({ expiresAt: new Date("2026-09-30T00:00:00Z") })],
        [],
        NOW,
      ),
    ).toEqual({ kind: "free" });
  });
});

describe("benefitGrantStateOf", () => {
  it("取り消し済みは revoked（期限より優先）", () => {
    expect(
      benefitGrantStateOf(
        grant({
          revokedAt: NOW,
          revokeReason: "誤付与",
          expiresAt: new Date("2026-09-30T00:00:00Z"),
        }),
        NOW,
      ),
    ).toBe("revoked");
  });

  it("期限ちょうど・期限切れは expired、無期限と期限内は active", () => {
    expect(benefitGrantStateOf(grant({ expiresAt: NOW }), NOW)).toBe("expired");
    expect(benefitGrantStateOf(grant({ expiresAt: null }), NOW)).toBe("active");
    expect(benefitGrantStateOf(grant({}), NOW)).toBe("active");
  });
});

describe("planStatusOf（手動付与）", () => {
  it("購入が無くても有効な付与があれば granted（期限付き）", () => {
    expect(planStatusOf([], [grant({})], NOW)).toEqual({
      kind: "granted",
      until: new Date("2026-10-25T00:00:00Z"),
    });
  });

  it("無期限の付与は until 無しの granted（期限付きのパスより優先）", () => {
    expect(
      planStatusOf([makePurchase({})], [grant({ expiresAt: null })], NOW),
    ).toEqual({ kind: "granted", until: undefined });
  });

  it("買い切りは無期限の付与より優先", () => {
    expect(
      planStatusOf(
        [makePurchase({ kind: "lifetime", expiresAt: null })],
        [grant({ expiresAt: null })],
        NOW,
      ),
    ).toEqual({ kind: "lifetime" });
  });

  it("パスと付与が重なるときは後に切れる方の種類で出す", () => {
    const later = new Date("2026-12-01T00:00:00Z");
    expect(
      planStatusOf([makePurchase({})], [grant({ expiresAt: later })], NOW),
    ).toEqual({ kind: "granted", until: later });
    expect(
      planStatusOf([makePurchase({ expiresAt: later })], [grant({})], NOW),
    ).toEqual({ kind: "pass", until: later });
  });

  it("パスと付与の期限が同じならパスで出す", () => {
    const same = new Date("2026-12-01T00:00:00Z");
    expect(
      planStatusOf(
        [makePurchase({ expiresAt: same })],
        [grant({ expiresAt: same })],
        NOW,
      ),
    ).toEqual({ kind: "pass", until: same });
  });

  it("取り消し済み・期限切れの付与は無視する", () => {
    expect(
      planStatusOf(
        [],
        [
          grant({ revokedAt: NOW, revokeReason: "誤付与" }),
          grant({ expiresAt: new Date("2026-09-30T00:00:00Z") }),
        ],
        NOW,
      ),
    ).toEqual({ kind: "free" });
  });
});

describe("formatPlanDate", () => {
  it("JST の年月日で出す（UTC 15:00 以降は翌日）", () => {
    expect(formatPlanDate(new Date("2026-10-20T15:00:00Z"))).toBe(
      "2026年10月21日",
    );
  });

  it("言語を省くと日本語を渡したときと同じ", () => {
    const date = new Date("2026-10-20T15:00:00Z");
    expect(formatPlanDate(date)).toBe(formatPlanDate(date, "ja"));
  });

  it("英語は en-US の長い日付で、日付は JST で切る", () => {
    expect(formatPlanDate(new Date("2026-10-20T15:00:00Z"), "en")).toBe(
      "October 21, 2026",
    );
  });
});

describe("formatPlanDateShort", () => {
  it("JST の「年/月/日」で出す（言語を省くと日本語）", () => {
    const date = new Date("2026-10-30T15:00:00Z");
    expect(formatPlanDateShort(date)).toBe("2026/10/31");
    expect(formatPlanDateShort(date, "ja")).toBe("2026/10/31");
  });

  it("英語は en-US の「月/日/年」で、日付は JST で切る", () => {
    expect(formatPlanDateShort(new Date("2026-10-30T15:00:00Z"), "en")).toBe(
      "10/31/2026",
    );
  });
});

it("先行パス返金後、開始待ちのパスだけでは現在 Pro にしない", () => {
  expect(
    planStatusOf(
      [
        makePurchase({ revokedAt: NOW, revokeReason: "refunded" }),
        makePurchase({
          startsAt: new Date("2026-10-20T00:00:00Z"),
          expiresAt: new Date("2026-11-19T00:00:00Z"),
        }),
      ],
      [],
      NOW,
    ),
  ).toEqual({ kind: "free" });
});
it("開始ちょうどは有効、期限ちょうどは無料", () => {
  expect(planStatusOf([makePurchase({ startsAt: NOW })], [], NOW).kind).toBe(
    "pass",
  );
  expect(planStatusOf([makePurchase({ expiresAt: NOW })], [], NOW)).toEqual({
    kind: "free",
  });
});
it("開始待ちの買い切りや付与も現在 Pro にしない", () => {
  const future = new Date("2026-10-20T00:00:00Z");
  expect(
    purchaseStateOf(
      makePurchase({ kind: "lifetime", startsAt: future, expiresAt: null }),
      NOW,
    ),
  ).toBe("scheduled");
  expect(
    planStatusOf(
      [makePurchase({ kind: "lifetime", startsAt: future, expiresAt: null })],
      [grant({ startsAt: future, expiresAt: null })],
      NOW,
    ),
  ).toEqual({ kind: "free" });
});
