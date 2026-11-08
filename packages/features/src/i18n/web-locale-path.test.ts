import { describe, expect, it } from "vitest";

import { MOBILE_WEB_PAGES, webLocalePath } from "./web-locale-path";

describe("webLocalePath", () => {
  it.each(["/", "/terms", "/contact?from=app", "/auth/callback?type=recovery"])(
    "日本語は %s をそのまま返す（既存の URL を変えない）",
    (path) => {
      expect(webLocalePath(path, "ja")).toBe(path);
    },
  );

  it.each([
    ["/", "/en"],
    ["/terms", "/en/terms"],
    ["/privacy", "/en/privacy"],
    ["/announcements/release-1", "/en/announcements/release-1"],
  ])("英語は %s に /en を前置して %s にする", (path, expected) => {
    expect(webLocalePath(path, "en")).toBe(expected);
  });

  it.each([
    ["/terms?ref=app", "/en/terms?ref=app"],
    ["/privacy#cookies", "/en/privacy#cookies"],
    ["/contact?x=1#form", "/en/contact?x=1#form"],
    ["/?x=1", "/en?x=1"],
  ])("英語でも query と hash は保つ（%s → %s）", (path, expected) => {
    expect(webLocalePath(path, "en")).toBe(expected);
  });

  it.each([
    "/api/mobile/v1/me",
    "/api",
    "/auth/callback?type=recovery",
    "/auth",
  ])("言語に依らない %s は英語でもそのまま", (path) => {
    expect(webLocalePath(path, "en")).toBe(path);
  });

  it.each(["/apis", "/authors", "/english"])(
    "接頭辞はセグメント単位で判定する（%s は言語に依るパス）",
    (path) => {
      expect(webLocalePath(path, "en")).toBe(`/en${path}`);
    },
  );

  it.each([
    "/en",
    "/en/terms",
    "https://example.com/terms",
    "//host/terms",
    "terms",
  ])("既に接頭辞の付いた値・外部 URL・相対パスの %s はそのまま", (path) => {
    expect(webLocalePath(path, "en")).toBe(path);
  });
});

describe("MOBILE_WEB_PAGES", () => {
  it("アプリが開く web のページは言語に依るパスで、英語では /en の下を開く", () => {
    for (const page of MOBILE_WEB_PAGES) {
      expect(webLocalePath(page, "en")).toBe(`/en${page}`);
    }
  });
});
