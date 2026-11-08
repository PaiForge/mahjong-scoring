import { describe, expect, it } from "vitest";

import { SITE_URL } from "@/config";

import robots from "./robots";

describe("robots", () => {
  it("日本語の除外を維持し、英語の noindex と404のクロールを妨げない", () => {
    const { rules } = robots();
    expect(rules).toEqual({
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/mypage", "/api", "/u/"],
    });
  });

  it("sitemap の場所を示す", () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});
