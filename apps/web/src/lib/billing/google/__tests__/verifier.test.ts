import { afterEach, describe, expect, it, vi } from "vitest";

import { getGooglePurchaseVerifier } from "../default-verifier";
import { GOOGLE_PLAY_PACKAGE_NAME } from "../env";
import { createMockGooglePurchaseVerifier } from "../verifier-mock";

afterEach(() => {
  vi.unstubAllEnvs();
});

const NOW = new Date("2026-11-14T00:00:00Z");

describe("createMockGooglePurchaseVerifier", () => {
  const verifier = createMockGooglePurchaseVerifier(() => NOW);

  it("mock: で始まるトークンは支払い済みの Test の購入として返す", async () => {
    const token = `mock:${"a".repeat(60)}`;
    expect(
      await verifier.verifyPurchase({
        productId: "p.lifetime",
        purchaseToken: token,
      }),
    ).toEqual({
      ok: true,
      value: {
        purchaseToken: token,
        productId: "p.lifetime",
        packageName: GOOGLE_PLAY_PACKAGE_NAME,
        orderId: `MOCK.${"a".repeat(40)}`,
        purchaseDate: NOW,
        state: "purchased",
        environment: "Test",
      },
    });
  });

  it("mock: で始まらないトークンは invalidToken", async () => {
    expect(
      await verifier.verifyPurchase({
        productId: "p.lifetime",
        purchaseToken: "real-token",
      }),
    ).toEqual({ ok: false, reason: "invalidToken" });
  });
});

describe("getGooglePurchaseVerifier", () => {
  it("NODE_ENV が production ならフラグがあっても undefined（本番でモックを選ばない）", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GOOGLE_IAP_MOCK_VERIFIER", "1");
    expect(getGooglePurchaseVerifier()).toBeUndefined();
  });

  it("フラグが無ければ undefined（本物の検証器は未実装）", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GOOGLE_IAP_MOCK_VERIFIER", undefined);
    expect(getGooglePurchaseVerifier()).toBeUndefined();
  });

  it("開発中にフラグが 1 ならモックを返し、使い回す", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GOOGLE_IAP_MOCK_VERIFIER", "1");
    const verifier = getGooglePurchaseVerifier();
    expect(verifier).toBeDefined();
    expect(getGooglePurchaseVerifier()).toBe(verifier);
    const result = await verifier?.verifyPurchase({
      productId: "p.lifetime",
      purchaseToken: "mock:abc",
    });
    expect(result?.ok && result.value.environment).toBe("Test");
  });
});
