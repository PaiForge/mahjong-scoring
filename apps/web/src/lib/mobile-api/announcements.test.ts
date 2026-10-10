import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCount, mockPage, mockOne } = vi.hoisted(() => ({
  mockCount: vi.fn(),
  mockPage: vi.fn(),
  mockOne: vi.fn(),
}));

vi.mock("../announcements/queries", () => ({
  getPublishedAnnouncementCount: mockCount,
  getPublishedAnnouncementsPaginated: mockPage,
  getPublishedAnnouncement: mockOne,
}));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));

import {
  handleReadAnnouncement,
  handleReadAnnouncements,
} from "./announcements";

const get = (query: string) =>
  new Request(`https://example.test/api/mobile/v1/announcements${query}`);

const row = {
  id: "1",
  slug: "release",
  title: "リリース",
  content: "# リリース\n\n本文",
  locale: "ja",
  status: "published",
  pinnedAt: new Date("2026-10-02T00:00:00.000Z"),
  publishedAt: new Date("2026-10-01T00:00:00.000Z"),
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  updatedAt: new Date("2026-10-01T00:00:00.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCount.mockResolvedValue(45);
  mockPage.mockResolvedValue([
    row,
    { ...row, slug: "b", pinnedAt: null, publishedAt: null },
  ]);
  mockOne.mockResolvedValue(row);
});

describe("handleReadAnnouncements", () => {
  it("要求したページを 20 件ずつで引き、日時を ISO 文字列・ピン留めを真偽で返す", async () => {
    const response = await handleReadAnnouncements(get("?page=2"));

    expect(mockPage).toHaveBeenCalledWith("ja", 20, 20);
    expect(await response.json()).toEqual({
      items: [
        {
          slug: "release",
          title: "リリース",
          publishedAt: "2026-10-01T00:00:00.000Z",
          pinned: true,
        },
        { slug: "b", title: "リリース", pinned: false },
      ],
      page: 2,
      totalPages: 3,
    });
  });

  it("範囲外のページは最後のページに丸める", async () => {
    const response = await handleReadAnnouncements(get("?page=9"));

    expect(mockPage).toHaveBeenCalledWith("ja", 20, 40);
    expect(await response.json()).toMatchObject({ page: 3 });
  });

  it("お知らせが無ければ 1 ページ目・総ページ数 0", async () => {
    mockCount.mockResolvedValue(0);
    mockPage.mockResolvedValue([]);

    const response = await handleReadAnnouncements(get(""));

    expect(await response.json()).toEqual({
      items: [],
      page: 1,
      totalPages: 0,
    });
  });

  it("DB の失敗は 500 serverError", async () => {
    mockCount.mockRejectedValue(new Error("down"));

    const response = await handleReadAnnouncements(get(""));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "serverError" });
  });
});

describe("handleReadAnnouncement", () => {
  it("本文を Markdown の原文のまま返す", async () => {
    const response = await handleReadAnnouncement("release");

    expect(mockOne).toHaveBeenCalledWith("release", "ja");
    expect(await response.json()).toEqual({
      slug: "release",
      title: "リリース",
      content: "# リリース\n\n本文",
      publishedAt: "2026-10-01T00:00:00.000Z",
    });
  });

  it("公開中でなければ 404 notFound", async () => {
    mockOne.mockResolvedValue(null);

    const response = await handleReadAnnouncement("draft");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "notFound" });
  });
});
