import { describe, expect, it } from "vitest";

import { normalizeSiteUrl } from "./site-url";

describe("normalizeSiteUrl", () => {
  it("未設定・空は本番の URL", () => {
    expect(normalizeSiteUrl(undefined)).toBe("https://score.mahjong.help");
    expect(normalizeSiteUrl("")).toBe("https://score.mahjong.help");
  });

  it("末尾のスラッシュを落とす", () => {
    expect(normalizeSiteUrl("http://192.168.0.10:3000/")).toBe(
      "http://192.168.0.10:3000",
    );
  });

  it("URL として読めない値は本番の URL", () => {
    expect(normalizeSiteUrl("score.mahjong.help")).toBe(
      "https://score.mahjong.help",
    );
  });
});
