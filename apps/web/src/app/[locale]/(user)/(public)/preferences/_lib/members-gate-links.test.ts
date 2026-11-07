import { describe, expect, it } from "vitest";

import { membersGateLinks } from "./members-gate-links";

describe("membersGateLinks", () => {
  it("日本語では従来の href のまま", () => {
    expect(membersGateLinks("/preferences", "ja")).toEqual({
      signUpHref: "/sign-up",
      signInHref: "/sign-in?redirect=%2Fpreferences",
    });
  });

  it("英語では同じ言語の登録・ログインへ張り、ログイン後も同じ言語のページへ戻す", () => {
    expect(membersGateLinks("/preferences/yaku-order", "en")).toEqual({
      signUpHref: "/en/sign-up",
      signInHref: "/en/sign-in?redirect=%2Fen%2Fpreferences%2Fyaku-order",
    });
  });
});
