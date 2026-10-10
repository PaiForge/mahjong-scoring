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
});
