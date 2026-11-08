import { describe, expect, it } from "vitest";

import { resolveAnnouncementLink } from "./announcement-link";

const SITE = "https://example.test";

describe("resolveAnnouncementLink", () => {
  it("日本語はブラウザで開く web の URL に言語の接頭辞を付けない", () => {
    expect(resolveAnnouncementLink("/leaderboard?x=1", SITE, "ja")).toEqual({
      kind: "browser",
      url: `${SITE}/leaderboard?x=1`,
    });
  });

  it("英語はブラウザで開く web のページを /en の URL にする", () => {
    expect(resolveAnnouncementLink("/leaderboard?x=1", SITE, "en")).toEqual({
      kind: "browser",
      url: `${SITE}/en/leaderboard?x=1`,
    });
    expect(resolveAnnouncementLink(`${SITE}/terms`, SITE, "en")).toEqual({
      kind: "browser",
      url: `${SITE}/en/terms`,
    });
    expect(resolveAnnouncementLink("/reference/demo", SITE, "en")).toEqual({
      kind: "browser",
      url: `${SITE}/en/reference/demo`,
    });
  });

  it("英語でもアプリの中で開くパスは言語を持たない", () => {
    expect(resolveAnnouncementLink("/lessons/jantou-fu", SITE, "en")).toEqual({
      kind: "app",
      path: "/lessons/jantou-fu",
    });
    expect(resolveAnnouncementLink(`${SITE}/dashboard`, SITE, "en")).toEqual({
      kind: "app",
      path: "/",
    });
  });

  it("英語でも外のサイトの URL は変えず、価格・特商法はリンクにしない", () => {
    expect(resolveAnnouncementLink("https://other.test/a", SITE, "en")).toEqual(
      { kind: "browser", url: "https://other.test/a" },
    );
    expect(resolveAnnouncementLink("/plan", SITE, "en")).toEqual({
      kind: "text",
    });
    expect(resolveAnnouncementLink(`${SITE}/tokushoho`, SITE, "en")).toEqual({
      kind: "text",
    });
  });

  it("アプリに同じ画面があるパスはアプリで開く", () => {
    expect(resolveAnnouncementLink("/lessons/jantou-fu", SITE, "ja")).toEqual({
      kind: "app",
      path: "/lessons/jantou-fu",
    });
  });

  it("サイト自身の URL もパスと同じに扱う", () => {
    expect(resolveAnnouncementLink(`${SITE}/practice?x=1`, SITE, "ja")).toEqual(
      {
        kind: "app",
        path: "/practice?x=1",
      },
    );
  });

  it("アプリに無いパスは web のページをブラウザで開く", () => {
    expect(resolveAnnouncementLink("/leaderboard", SITE, "ja")).toEqual({
      kind: "browser",
      url: `${SITE}/leaderboard`,
    });
  });

  it("先頭が同じでも別の語のパスはアプリで開かない", () => {
    expect(resolveAnnouncementLink("/lessons-old", SITE, "ja").kind).toBe(
      "browser",
    );
  });

  it("外のサイトはそのままブラウザに渡す", () => {
    expect(resolveAnnouncementLink("https://other.test/a", SITE, "ja")).toEqual(
      {
        kind: "browser",
        url: "https://other.test/a",
      },
    );
  });

  it("プロトコル相対の URL はパスとして扱わない", () => {
    expect(resolveAnnouncementLink("//other.test/lessons", SITE, "ja")).toEqual(
      {
        kind: "browser",
        url: "//other.test/lessons",
      },
    );
  });

  it("置き場所の違う画面はアプリのパスに読み替える", () => {
    expect(
      resolveAnnouncementLink("/reference/score-table", SITE, "ja"),
    ).toEqual({
      kind: "app",
      path: "/score-table",
    });
    expect(resolveAnnouncementLink(`${SITE}/dashboard`, SITE, "ja")).toEqual({
      kind: "app",
      path: "/",
    });
    expect(resolveAnnouncementLink("/dojo/ranks", SITE, "ja")).toEqual({
      kind: "app",
      path: "/dojo",
    });
  });

  it("リファレンスはアプリにある画面だけアプリで開く", () => {
    expect(resolveAnnouncementLink("/reference", SITE, "ja").kind).toBe("app");
    expect(resolveAnnouncementLink("/reference/yaku", SITE, "ja").kind).toBe(
      "app",
    );
    expect(
      resolveAnnouncementLink("/reference/glossary/fu", SITE, "ja").kind,
    ).toBe("app");
    expect(resolveAnnouncementLink("/reference/demo", SITE, "ja")).toEqual({
      kind: "browser",
      url: `${SITE}/reference/demo`,
    });
  });

  it("価格・特商法のページはリンクにしない", () => {
    for (const href of [
      "/plan",
      "/plan?from=announcement",
      `${SITE}/tokushoho`,
      "/mypage/plan",
    ]) {
      expect(resolveAnnouncementLink(href, SITE, "ja")).toEqual({
        kind: "text",
      });
    }
    expect(resolveAnnouncementLink("/planet", SITE, "ja").kind).toBe("browser");
  });
});
