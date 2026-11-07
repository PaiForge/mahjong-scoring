import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

import type { Announcement } from "@/lib/db";

const { mockPaginated, mockExact } = vi.hoisted(() => ({
  mockPaginated: vi.fn(),
  mockExact: vi.fn(),
}));

vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));
vi.mock("@/lib/announcements/queries", () => ({
  getPublishedAnnouncementsPaginated: mockPaginated,
  getPublishedAnnouncementsExact: mockExact,
}));

const { HomeAnnouncements } = await import("./home-announcements");

function announcementOf(locale: string, title: string): Announcement {
  const publishedAt = new Date("2026-11-01T00:00:00Z");
  return {
    id: `${locale}-1`,
    slug: "new-feature",
    title,
    content: "body",
    locale,
    status: "published",
    pinnedAt: null,
    publishedAt,
    createdAt: publishedAt,
    updatedAt: publishedAt,
  } as Announcement;
}

/** 「すべて見る」のリンク（一覧の行のリンクと見分けるため文言で引く） */
function viewAllLink(container: HTMLElement): HTMLAnchorElement | undefined {
  return Array.from(container.querySelectorAll("a")).find((a) =>
    a.textContent?.includes("viewAll"),
  );
}

describe("HomeAnnouncements", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("日本語は従来どおり fallback 付きのクエリで引き、一覧へ同じ言語のリンクを張る", async () => {
    mockPaginated.mockResolvedValue([announcementOf("ja", "新機能")]);

    const { container, getByText } = render(
      await HomeAnnouncements({ locale: "ja" }),
    );

    expect(mockPaginated).toHaveBeenCalledWith("ja", expect.any(Number), 0);
    expect(mockExact).not.toHaveBeenCalled();
    expect(getByText("新機能")).toBeTruthy();
    const link = viewAllLink(container);
    expect(link?.getAttribute("href")).toBe("/announcements");
    expect(link?.hasAttribute("hreflang")).toBe(false);
    expect(container.textContent).not.toContain("language.japaneseOnly");
  });

  it("日本語で 0 件なら見出しと「ありません」を出す", async () => {
    mockPaginated.mockResolvedValue([]);

    const { getByText } = render(await HomeAnnouncements({ locale: "ja" }));

    expect(getByText("pageTitle")).toBeTruthy();
    expect(getByText("empty")).toBeTruthy();
  });

  it("英語はその言語で公開した行だけを引き、日本語の行を混ぜない", async () => {
    mockExact.mockResolvedValue([announcementOf("en", "New feature")]);

    const { getByText } = render(await HomeAnnouncements({ locale: "en" }));

    expect(mockExact).toHaveBeenCalledWith("en", expect.any(Number), 0);
    expect(mockPaginated).not.toHaveBeenCalled();
    expect(getByText("New feature")).toBeTruthy();
  });

  it("英語の「すべて見る」は英語で未公開の一覧なので、日本語の一覧へ印付きで文書ごと移る", async () => {
    mockExact.mockResolvedValue([announcementOf("en", "New feature")]);

    const { container } = render(await HomeAnnouncements({ locale: "en" }));

    const link = viewAllLink(container);
    expect(link?.getAttribute("href")).toBe("/announcements");
    expect(link?.getAttribute("hreflang")).toBe("ja");
    expect(link?.textContent).toContain("language.japaneseOnly");
  });

  it("英語の各行は英語で未公開の詳細なので、日本語の詳細へ印付きで文書ごと移る", async () => {
    mockExact.mockResolvedValue([announcementOf("en", "New feature")]);

    const { container } = render(await HomeAnnouncements({ locale: "en" }));

    const row = Array.from(container.querySelectorAll("a")).find((a) =>
      a.textContent?.includes("New feature"),
    );
    expect(row?.getAttribute("href")).toBe("/announcements/new-feature");
    expect(row?.getAttribute("hreflang")).toBe("ja");
    expect(row?.textContent).toContain("language.japaneseOnly");
  });

  it("日本語の各行は従来どおり同じ言語の詳細へ印なしで張る", async () => {
    mockPaginated.mockResolvedValue([announcementOf("ja", "新機能")]);

    const { container } = render(await HomeAnnouncements({ locale: "ja" }));

    const row = Array.from(container.querySelectorAll("a")).find((a) =>
      a.textContent?.includes("新機能"),
    );
    expect(row?.getAttribute("href")).toBe("/announcements/new-feature");
    expect(row?.hasAttribute("hreflang")).toBe(false);
  });

  it("英語で英訳の行が 0 件なら節ごと出さない", async () => {
    mockExact.mockResolvedValue([]);

    const { container } = render(
      (await HomeAnnouncements({ locale: "en" })) ?? <></>,
    );

    expect(container.innerHTML).toBe("");
  });
});
