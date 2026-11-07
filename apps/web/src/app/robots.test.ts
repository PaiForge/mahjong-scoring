import { describe, expect, it } from "vitest";

import { SITE_URL } from "@/config";

import robots from "./robots";

describe("robots", () => {
  it("日本語の除外の行をそのまま保ち、英語のマイページと公開プロフィールを足す", () => {
    const { rules } = robots();
    expect(rules).toEqual({
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/mypage", "/api", "/u/", "/en/mypage", "/en/u/"],
    });
  });

  it("sitemap の場所を示す", () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});
