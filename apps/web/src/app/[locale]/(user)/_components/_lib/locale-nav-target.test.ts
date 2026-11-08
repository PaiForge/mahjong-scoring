import { describe, expect, it } from "vitest";

import { resolveNavTargetFor } from "./locale-nav-target";

describe("resolveNavTargetFor", () => {
  it("日本語のページでは href を変えない", () => {
    expect(resolveNavTargetFor("/practice?x=1#a", "ja")).toEqual({
      href: "/practice?x=1#a",
      crossLocale: false,
    });
  });

  it("英語のページから英語で公開しているページへは /en を付ける（query・hash は残す）", () => {
    expect(
      resolveNavTargetFor("/reference/score-table?role=oya#top", "en"),
    ).toEqual({
      href: "/en/reference/score-table?role=oya#top",
      crossLocale: false,
    });
  });

  it("英語のページから英語で未公開のページへは日本語の href のまま言語をまたぐ", () => {
    expect(resolveNavTargetFor("/leaderboard?x=1", "en")).toEqual({
      href: "/leaderboard?x=1",
      crossLocale: true,
    });
  });
});
