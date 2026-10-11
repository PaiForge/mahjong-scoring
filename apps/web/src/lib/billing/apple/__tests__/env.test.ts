import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isAppleIapOnSale,
  offerKeyOfAppleProductId,
  readAppleAppId,
  readAppleProductIds,
  readAppleSandboxUserIds,
} from "../env";

afterEach(() => {
  vi.unstubAllEnvs();
});

function stubProducts(pass: string, lifetime: string) {
  vi.stubEnv("APPLE_IAP_PRODUCT_ID_PRO_PASS", pass);
  vi.stubEnv("APPLE_IAP_PRODUCT_ID_PRO_LIFETIME", lifetime);
}

describe("readAppleProductIds", () => {
  it("両方そろって初めて値を返す", () => {
    stubProducts("p.pass", "p.lifetime");
    expect(readAppleProductIds()).toEqual({
      pass: "p.pass",
      lifetime: "p.lifetime",
    });
    expect(isAppleIapOnSale()).toBe(true);
  });

  it("片方でも空なら undefined で、販売中ではない", () => {
    stubProducts("p.pass", "");
    expect(readAppleProductIds()).toBeUndefined();
    expect(isAppleIapOnSale()).toBe(false);
    stubProducts("", "p.lifetime");
    expect(readAppleProductIds()).toBeUndefined();
  });
});

describe("offerKeyOfAppleProductId", () => {
  it("Product ID から売り方を引く", () => {
    stubProducts("p.pass", "p.lifetime");
    expect(offerKeyOfAppleProductId("p.pass")).toBe("pass");
    expect(offerKeyOfAppleProductId("p.lifetime")).toBe("lifetime");
    expect(offerKeyOfAppleProductId("p.other")).toBeUndefined();
  });

  it("設定が無ければどれも知らない", () => {
    stubProducts("", "");
    expect(offerKeyOfAppleProductId("p.pass")).toBeUndefined();
  });
});

describe("readAppleAppId", () => {
  it("数字だけなら数値を返す", () => {
    vi.stubEnv("APPLE_IAP_APP_APPLE_ID", "6747000000");
    expect(readAppleAppId()).toBe(6747000000);
  });

  it.each(["", "abc", "12a", "-1", "1.5"])("%j は undefined", (value) => {
    vi.stubEnv("APPLE_IAP_APP_APPLE_ID", value);
    expect(readAppleAppId()).toBeUndefined();
  });
});

describe("readAppleSandboxUserIds", () => {
  it("カンマ区切りを前後の空白を除いて集合にする", () => {
    vi.stubEnv(
      "APPLE_IAP_SANDBOX_USER_IDS",
      " 11111111-1111-4111-8111-111111111111 ,22222222-2222-4222-8222-222222222222,,",
    );
    expect([...readAppleSandboxUserIds()]).toEqual([
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ]);
  });

  it("大文字の UUID も小文字にそろえる", () => {
    vi.stubEnv(
      "APPLE_IAP_SANDBOX_USER_IDS",
      "AAAAAAAA-1111-4111-8111-111111111111",
    );
    expect(
      readAppleSandboxUserIds().has("aaaaaaaa-1111-4111-8111-111111111111"),
    ).toBe(true);
  });

  it("未設定・空なら空集合", () => {
    vi.stubEnv("APPLE_IAP_SANDBOX_USER_IDS", "");
    expect(readAppleSandboxUserIds().size).toBe(0);
  });
});
