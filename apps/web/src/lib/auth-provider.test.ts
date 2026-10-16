import { describe, expect, it } from "vitest";
import { messages } from "@mahjong-scoring/messages/ja";

import { KNOWN_AUTH_PROVIDERS, isKnownAuthProvider } from "./auth-provider";

describe("isKnownAuthProvider", () => {
  it("email / google / apple は既知", () => {
    expect(isKnownAuthProvider("email")).toBe(true);
    expect(isKnownAuthProvider("google")).toBe(true);
    expect(isKnownAuthProvider("apple")).toBe(true);
  });

  it("知らない値・未設定は既知ではない", () => {
    expect(isKnownAuthProvider("github")).toBe(false);
    expect(isKnownAuthProvider(undefined)).toBe(false);
  });
});

describe("プロバイダの名前の辞書", () => {
  it.each(KNOWN_AUTH_PROVIDERS)(
    "%s はアカウントのページと管理画面の両方に名前がある",
    (provider) => {
      expect(messages.mypageAccount.login.providers[provider]).toBeTruthy();
      expect(
        messages.admin.userDetail.account.providers[provider],
      ).toBeTruthy();
    },
  );
});
