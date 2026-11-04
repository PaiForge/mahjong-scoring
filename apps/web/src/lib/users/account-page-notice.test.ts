import { describe, expect, it } from "vitest";

import { messages } from "@mahjong-scoring/messages/ja";

import {
  ACCOUNT_PAGE_NOTICES,
  accountPageHref,
  readAccountPageNotice,
} from "./account-page-notice";

describe("accountPageHref / readAccountPageNotice", () => {
  it("付けた報せをページ側で同じキーとして読める", () => {
    for (const notice of ACCOUNT_PAGE_NOTICES) {
      const href = accountPageHref(notice);
      const params = Object.fromEntries(
        new URL(href, "http://localhost").searchParams,
      );
      expect(readAccountPageNotice(params)).toBe(notice);
    }
  });

  it("報せ無し・知らない値・配列は undefined", () => {
    expect(accountPageHref()).toBe("/mypage/account");
    expect(readAccountPageNotice({})).toBeUndefined();
    expect(readAccountPageNotice({ notice: "hacked" })).toBeUndefined();
    expect(readAccountPageNotice({ notice: ["linkedGoogle"] })).toBeUndefined();
  });

  it.each(ACCOUNT_PAGE_NOTICES)("%s は辞書に文を持つ", (notice) => {
    expect(messages.mypageAccount.notices[notice]).toBeTruthy();
  });
});
