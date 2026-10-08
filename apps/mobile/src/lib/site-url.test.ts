import { describe, expect, it } from "vitest";

import { resolveSiteUrl } from "./site-url";

describe("resolveSiteUrl", () => {
  it("環境変数があればそれを読む", () => {
    expect(
      resolveSiteUrl({
        envUrl: "https://preview.example.com/",
        isDev: true,
        hostUri: "192.168.4.22:8081",
      }),
    ).toBe("https://preview.example.com");
  });

  it("開発中は Metro のホストの web を読む（実機から Mac に届くように）", () => {
    expect(
      resolveSiteUrl({
        envUrl: undefined,
        isDev: true,
        hostUri: "192.168.4.22:8081",
      }),
    ).toBe("http://192.168.4.22:3000");
  });

  it("開発中で Metro のホストが分からなければ localhost", () => {
    expect(
      resolveSiteUrl({ envUrl: undefined, isDev: true, hostUri: undefined }),
    ).toBe("http://localhost:3000");
  });

  it("ストアのビルドは本番", () => {
    expect(
      resolveSiteUrl({
        envUrl: undefined,
        isDev: false,
        hostUri: "192.168.4.22:8081",
      }),
    ).toBe("https://score.mahjong.help");
  });
});
