import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Announcement } from "@/lib/db";

import { AnnouncementTextList } from "./announcement-text-list";

const publishedAt = new Date("2026-10-07T03:00:00.000Z");
const announcement: Announcement = {
  id: "announcement-1",
  slug: "update",
  title: "更新のお知らせ",
  content: "本文",
  locale: "ja",
  status: "published",
  pinnedAt: null,
  publishedAt,
  createdAt: publishedAt,
  updatedAt: publishedAt,
};

describe("AnnouncementTextList", () => {
  // 生 SQL の結果では型定義が Date でも日時が文字列で返る。
  it.each([
    ["Date", announcement],
    [
      "serialized date",
      JSON.parse(JSON.stringify(announcement)) as Announcement,
    ],
  ])("%s の公開日を表示し、詳細リンクを維持する", (_, item) => {
    const { container, getByRole } = render(
      <AnnouncementTextList
        announcements={[item]}
        locale="ja"
        pinnedLabel="固定"
      />,
    );
    expect(container.querySelector("time")?.dateTime).toBe(
      publishedAt.toISOString(),
    );
    expect(container.querySelector("time")?.textContent).toBe("2026/10/07");
    expect(getByRole("link").getAttribute("href")).toBe(
      "/announcements/update",
    );
  });

  it("張り方を渡さなければ同じ言語のリンクで、「日本語のみ」の印を付けない", () => {
    const { getByRole } = render(
      <AnnouncementTextList
        announcements={[announcement]}
        locale="ja"
        pinnedLabel="固定"
      />,
    );

    const link = getByRole("link");
    expect(link.hasAttribute("hreflang")).toBe(false);
    expect(link.textContent).not.toContain("Japanese only");
  });

  it("張り先が言語をまたぐ行は、日本語の詳細へ印付きの素のリンクにする", () => {
    const { getByRole } = render(
      <AnnouncementTextList
        announcements={[{ ...announcement, title: "Update", locale: "en" }]}
        locale="en"
        pinnedLabel="Pinned"
        detailLink={{
          targetFor: (path) => ({ href: path, crossLocale: true }),
          japaneseOnlyLabel: "Japanese only",
        }}
      />,
    );

    const link = getByRole("link");
    expect(link.getAttribute("href")).toBe("/announcements/update");
    expect(link.getAttribute("hreflang")).toBe("ja");
    expect(link.textContent).toContain("UpdateJapanese only");
  });

  it("張り先が同じ言語の行は、その href の通常のリンクで印を付けない", () => {
    const { getByRole } = render(
      <AnnouncementTextList
        announcements={[announcement]}
        locale="en"
        pinnedLabel="Pinned"
        detailLink={{
          targetFor: (path) => ({ href: `/en${path}`, crossLocale: false }),
          japaneseOnlyLabel: "Japanese only",
        }}
      />,
    );

    const link = getByRole("link");
    expect(link.getAttribute("href")).toBe("/en/announcements/update");
    expect(link.hasAttribute("hreflang")).toBe(false);
    expect(link.textContent).not.toContain("Japanese only");
  });
});
