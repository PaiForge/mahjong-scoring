import { describe, expect, it } from "vitest";

import { resolveIapStoreKind } from "./iap-store-kind";

describe("resolveIapStoreKind", () => {
  it("iOS は環境変数に依らず apple", () => {
    for (const requested of [undefined, "fake", "apple", ""]) {
      for (const isDev of [true, false]) {
        expect(resolveIapStoreKind({ os: "ios", isDev, requested })).toBe(
          "apple",
        );
      }
    }
  });

  it("Android の開発ビルドで fake を求めたときだけ fake", () => {
    expect(
      resolveIapStoreKind({ os: "android", isDev: true, requested: "fake" }),
    ).toBe("fake");
    expect(
      resolveIapStoreKind({ os: "android", isDev: true, requested: "FAKE" }),
    ).toBe("none");
    expect(
      resolveIapStoreKind({ os: "android", isDev: true, requested: "apple" }),
    ).toBe("none");
  });

  it("開発ビルドでなければ fake を選ばない", () => {
    expect(
      resolveIapStoreKind({ os: "android", isDev: false, requested: "fake" }),
    ).toBe("none");
  });

  it("Android の既定は none", () => {
    expect(
      resolveIapStoreKind({ os: "android", isDev: true, requested: undefined }),
    ).toBe("none");
  });

  it("web 版は none", () => {
    expect(
      resolveIapStoreKind({ os: "web", isDev: true, requested: "fake" }),
    ).toBe("none");
  });
});
