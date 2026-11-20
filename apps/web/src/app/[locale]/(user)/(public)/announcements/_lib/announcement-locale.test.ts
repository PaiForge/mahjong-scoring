import { describe, expect, it, vi } from "vitest";
import type { Metadata } from "next";

vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));

const { announcementsPageHref, withAnnouncementRobots } =
  await import("./announcement-locale");

describe("announcementsPageHref", () => {
  it.each([
    ["ja", 1, "/announcements"],
    ["ja", 2, "/announcements?page=2"],
    ["en", 1, "/en/announcements"],
    ["en", 3, "/en/announcements?page=3"],
  ] as const)("%s の %i ページ目は %s", (locale, page, expected) => {
    expect(announcementsPageHref(page, locale)).toBe(expected);
  });
});

describe("withAnnouncementRobots", () => {
  const metadata: Metadata = {
    title: "お知らせ",
    alternates: {
      canonical: "/announcements",
      languages: { ja: "/announcements", "x-default": "/announcements" },
    },
  };

  it("日本語は入力のまま返す（robots を足さず hreflang も残す）", () => {
    expect(withAnnouncementRobots(metadata, "/announcements", "ja")).toBe(
      metadata,
    );
  });

  it.each(["/announcements", "/announcements/update"])(
    "英語の %s は noindex にし、hreflang を外して自己 canonical だけ残す",
    (path) => {
      const enMetadata: Metadata = {
        title: "News",
        alternates: {
          canonical: `/en${path}`,
          languages: { ja: path, "x-default": path },
        },
      };
      expect(withAnnouncementRobots(enMetadata, path, "en")).toEqual({
        title: "News",
        robots: { index: false, follow: true },
        alternates: { canonical: `/en${path}` },
      });
    },
  );

  it("canonical を持たない metadata（見つからない詳細）は alternates を足さない", () => {
    expect(
      withAnnouncementRobots({ title: "Not found" }, "/announcements/x", "en"),
    ).toEqual({ title: "Not found", robots: { index: false, follow: true } });
  });
});
