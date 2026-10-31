import { describe, expect, it } from "vitest";

import { resolveAnnouncementLink } from "./announcement-link";

const SITE = "https://example.test";

describe("resolveAnnouncementLink", () => {
  it("アプリに同じ画面があるパスはアプリで開く", () => {
    expect(resolveAnnouncementLink("/lessons/jantou-fu", SITE)).toEqual({
      kind: "app",
      path: "/lessons/jantou-fu",
    });
  });

  it("サイト自身の URL もパスと同じに扱う", () => {
    expect(resolveAnnouncementLink(`${SITE}/practice?x=1`, SITE)).toEqual({
      kind: "app",
      path: "/practice?x=1",
    });
  });

  it("アプリに無いパスは web のページをブラウザで開く", () => {
    expect(resolveAnnouncementLink("/leaderboard", SITE)).toEqual({
      kind: "browser",
      url: `${SITE}/leaderboard`,
    });
  });

  it("先頭が同じでも別の語のパスはアプリで開かない", () => {
    expect(resolveAnnouncementLink("/lessons-old", SITE).kind).toBe("browser");
  });

  it("外のサイトはそのままブラウザに渡す", () => {
    expect(resolveAnnouncementLink("https://other.test/a", SITE)).toEqual({
      kind: "browser",
      url: "https://other.test/a",
    });
  });

  it("プロトコル相対の URL はパスとして扱わない", () => {
    expect(resolveAnnouncementLink("//other.test/lessons", SITE)).toEqual({
      kind: "browser",
      url: "//other.test/lessons",
    });
  });

  it("置き場所の違う画面はアプリのパスに読み替える", () => {
    expect(resolveAnnouncementLink("/reference/score-table", SITE)).toEqual({
      kind: "app",
      path: "/score-table",
    });
    expect(resolveAnnouncementLink(`${SITE}/dashboard`, SITE)).toEqual({
      kind: "app",
      path: "/",
    });
    expect(resolveAnnouncementLink("/dojo/ranks", SITE)).toEqual({
      kind: "app",
      path: "/dojo",
    });
  });

  it("リファレンスはアプリにある画面だけアプリで開く", () => {
    expect(resolveAnnouncementLink("/reference", SITE).kind).toBe("app");
    expect(resolveAnnouncementLink("/reference/yaku", SITE).kind).toBe("app");
    expect(resolveAnnouncementLink("/reference/glossary/fu", SITE).kind).toBe(
      "app",
    );
    expect(resolveAnnouncementLink("/reference/demo", SITE)).toEqual({
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
      expect(resolveAnnouncementLink(href, SITE)).toEqual({ kind: "text" });
    }
    expect(resolveAnnouncementLink("/planet", SITE).kind).toBe("browser");
  });
});
