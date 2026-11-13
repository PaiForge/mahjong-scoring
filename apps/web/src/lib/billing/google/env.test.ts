import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isGoogleIapOnSale,
  isGoogleMockVerifierEnabled,
  offerKeyOfGoogleProductId,
  readGoogleProductIds,
  readGoogleTestUserIds,
} from "./env";

afterEach(() => {
  vi.unstubAllEnvs();
});

function stubProducts(pass: string, lifetime: string) {
  vi.stubEnv("GOOGLE_IAP_PRODUCT_ID_PRO_PASS", pass);
  vi.stubEnv("GOOGLE_IAP_PRODUCT_ID_PRO_LIFETIME", lifetime);
}

describe("readGoogleProductIds", () => {
  it("両方あれば両方を返す", () => {
    stubProducts("g.pass", "g.lifetime");
    expect(readGoogleProductIds()).toEqual({
      pass: "g.pass",
      lifetime: "g.lifetime",
    });
    expect(isGoogleIapOnSale()).toBe(true);
  });

  it("パスが無ければ買い切りだけを返し、販売中のまま", () => {
    stubProducts("", "g.lifetime");
    expect(readGoogleProductIds()).toEqual({ lifetime: "g.lifetime" });
    expect(isGoogleIapOnSale()).toBe(true);
  });

  it("買い切りが無ければ undefined で、販売中ではない", () => {
    stubProducts("g.pass", "");
    expect(readGoogleProductIds()).toBeUndefined();
    expect(isGoogleIapOnSale()).toBe(false);
  });

  it("App Store の Product ID だけでは Google Play で販売中にならない", () => {
    stubProducts("", "");
    vi.stubEnv("APPLE_IAP_PRODUCT_ID_PRO_LIFETIME", "a.lifetime");
    expect(isGoogleIapOnSale()).toBe(false);
  });
});

describe("offerKeyOfGoogleProductId", () => {
  it("Product ID から売り方を引く", () => {
    stubProducts("g.pass", "g.lifetime");
    expect(offerKeyOfGoogleProductId("g.pass")).toBe("pass");
    expect(offerKeyOfGoogleProductId("g.lifetime")).toBe("lifetime");
    expect(offerKeyOfGoogleProductId("g.other")).toBeUndefined();
  });

  it("販売していなければ undefined", () => {
    stubProducts("", "");
    expect(offerKeyOfGoogleProductId("g.lifetime")).toBeUndefined();
  });
});

describe("readGoogleTestUserIds", () => {
  it("カンマ区切りを trim して小文字にし、空の要素を除く", () => {
    vi.stubEnv("GOOGLE_IAP_TEST_USER_IDS", " AAA-1 ,bbb-2,, ");
    expect(readGoogleTestUserIds()).toEqual(new Set(["aaa-1", "bbb-2"]));
  });

  it("未設定なら空集合", () => {
    vi.stubEnv("GOOGLE_IAP_TEST_USER_IDS", undefined);
    expect(readGoogleTestUserIds().size).toBe(0);
  });
});

describe("isGoogleMockVerifierEnabled", () => {
  it("NODE_ENV が production でなくフラグが 1 ならモックを選ぶ", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GOOGLE_IAP_MOCK_VERIFIER", "1");
    expect(isGoogleMockVerifierEnabled()).toBe(true);
  });

  it("NODE_ENV が production ならフラグがあってもモックを選ばない", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GOOGLE_IAP_MOCK_VERIFIER", "1");
    expect(isGoogleMockVerifierEnabled()).toBe(false);
  });

  it("フラグが 1 でなければモックを選ばない", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GOOGLE_IAP_MOCK_VERIFIER", "true");
    expect(isGoogleMockVerifierEnabled()).toBe(false);
    vi.stubEnv("GOOGLE_IAP_MOCK_VERIFIER", undefined);
    expect(isGoogleMockVerifierEnabled()).toBe(false);
  });
});
