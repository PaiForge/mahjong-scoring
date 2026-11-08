import { describe, expect, it } from "vitest";

import { confirmedGuardOptions } from "./guard-options";

describe("confirmedGuardOptions", () => {
  it("日本語では戻り先を付けない（従来の /sign-in のまま）", () => {
    expect(confirmedGuardOptions("/mypage/plan", "ja")).toBeUndefined();
  });

  it("英語では同じ言語のページへ戻す", () => {
    expect(confirmedGuardOptions("/mypage", "en")).toEqual({
      returnTo: "/en/mypage",
    });
  });
});
