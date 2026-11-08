import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCount,
  mockPage,
  mockOne,
  mockCountExact,
  mockPageExact,
  mockOneExact,
  mockClientIp,
} = vi.hoisted(() => ({
  mockCount: vi.fn(),
  mockPage: vi.fn(),
  mockOne: vi.fn(),
  mockCountExact: vi.fn(),
  mockPageExact: vi.fn(),
  mockOneExact: vi.fn(),
  mockClientIp: vi.fn(),
}));

vi.mock("../announcements/queries", () => ({
  getPublishedAnnouncementCount: mockCount,
  getPublishedAnnouncementsPaginated: mockPage,
  getPublishedAnnouncement: mockOne,
  getPublishedAnnouncementCountExact: mockCountExact,
  getPublishedAnnouncementsExact: mockPageExact,
  getPublishedAnnouncementExact: mockOneExact,
}));
vi.mock("../client-ip", () => ({ getClientIp: mockClientIp }));
vi.mock("../log-error", async () => await import("@/test/log-error-mock"));

import { _resetStore } from "../rate-limit-ip";
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

const enRow = {
  ...row,
  id: "2",
  title: "Release",
  content: "# Release\n\nBody",
  locale: "en",
};

const getOne = (query: string) =>
  new Request(
    `https://example.test/api/mobile/v1/announcements/release${query}`,
  );

beforeEach(() => {
  vi.clearAllMocks();
  _resetStore();
  mockClientIp.mockResolvedValue("203.0.113.1");
  mockCount.mockResolvedValue(45);
  mockPage.mockResolvedValue([
    row,
    { ...row, slug: "b", pinnedAt: null, publishedAt: null },
  ]);
  mockOne.mockResolvedValue(row);
  mockCountExact.mockResolvedValue(3);
  mockPageExact.mockResolvedValue([enRow]);
  mockOneExact.mockResolvedValue(enRow);
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

  it("お知らせが無ければ 1 ページ目・総ページ数 1", async () => {
    mockCount.mockResolvedValue(0);
    mockPage.mockResolvedValue([]);

    const response = await handleReadAnnouncements(get(""));

    expect(await response.json()).toEqual({
      items: [],
      page: 1,
      totalPages: 1,
    });
  });

  it("お知らせが無いときの範囲外のページも 1 ページ目", async () => {
    mockCount.mockResolvedValue(0);
    mockPage.mockResolvedValue([]);

    const response = await handleReadAnnouncements(get("?page=9"));

    expect(mockPage).toHaveBeenCalledWith("ja", 20, 0);
    expect(await response.json()).toMatchObject({ page: 1, totalPages: 1 });
  });

  it("locale 未指定・ja・未対応の値は従来の ja（fallback 付き・DISTINCT の件数）で引く", async () => {
    for (const query of ["?page=1", "?page=1&locale=ja", "?page=1&locale=xx"]) {
      vi.clearAllMocks();
      mockCount.mockResolvedValue(45);
      mockPage.mockResolvedValue([row]);

      const response = await handleReadAnnouncements(get(query));

      expect(mockCount).toHaveBeenCalledWith();
      expect(mockPage).toHaveBeenCalledWith("ja", 20, 0);
      expect(mockCountExact).not.toHaveBeenCalled();
      expect(mockPageExact).not.toHaveBeenCalled();
      expect(await response.json()).toMatchObject({
        items: [{ slug: "release", title: "リリース" }],
        totalPages: 3,
      });
    }
  });

  it("locale=en は英訳の行だけを引き、件数も英語の行だけで数える", async () => {
    const response = await handleReadAnnouncements(get("?page=9&locale=en"));

    expect(mockCountExact).toHaveBeenCalledWith("en");
    expect(mockPageExact).toHaveBeenCalledWith("en", 20, 0);
    expect(mockCount).not.toHaveBeenCalled();
    expect(mockPage).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({
      items: [
        {
          slug: "release",
          title: "Release",
          publishedAt: "2026-10-01T00:00:00.000Z",
          pinned: true,
        },
      ],
      page: 1,
      totalPages: 1,
    });
  });

  it("DB の失敗は 500 serverError", async () => {
    mockCount.mockRejectedValue(new Error("down"));

    const response = await handleReadAnnouncements(get(""));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "serverError" });
  });

  it("同じ IP からの回数の上限を超えたら 429 で DB を読まない", async () => {
    for (let i = 0; i < 120; i += 1) await handleReadAnnouncements(get(""));
    mockCount.mockClear();

    const response = await handleReadAnnouncements(get(""));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rateLimited" });
    expect(mockCount).not.toHaveBeenCalled();
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

  it("locale 未指定・ja・未対応の値は従来の ja（fallback 付き）で引く", async () => {
    for (const request of [
      undefined,
      getOne(""),
      getOne("?locale=ja"),
      getOne("?locale=xx"),
    ]) {
      vi.clearAllMocks();
      mockOne.mockResolvedValue(row);

      const response = await handleReadAnnouncement("release", request);

      expect(mockOne).toHaveBeenCalledWith("release", "ja");
      expect(mockOneExact).not.toHaveBeenCalled();
      expect(await response.json()).toMatchObject({ title: "リリース" });
    }
  });

  it("locale=en は英語の行を返す", async () => {
    const response = await handleReadAnnouncement(
      "release",
      getOne("?locale=en"),
    );

    expect(mockOneExact).toHaveBeenCalledWith("release", "en");
    expect(mockOne).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({
      slug: "release",
      title: "Release",
      content: "# Release\n\nBody",
      publishedAt: "2026-10-01T00:00:00.000Z",
    });
  });

  it("locale=en で英語の行が無ければ、日本語の行があっても 404 notFound", async () => {
    mockOneExact.mockResolvedValue(null);

    const response = await handleReadAnnouncement(
      "release",
      getOne("?locale=en"),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "notFound" });
    expect(mockOne).not.toHaveBeenCalled();
  });

  it("公開中でなければ 404 notFound", async () => {
    mockOne.mockResolvedValue(null);

    const response = await handleReadAnnouncement("draft");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "notFound" });
  });

  it("同じ IP からの回数の上限を超えたら 429 で DB を読まない", async () => {
    for (let i = 0; i < 120; i += 1) await handleReadAnnouncement("release");
    mockOne.mockClear();

    const response = await handleReadAnnouncement("release");

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rateLimited" });
    expect(mockOne).not.toHaveBeenCalled();
  });

  it("一覧とは別に数える", async () => {
    for (let i = 0; i < 120; i += 1) await handleReadAnnouncements(get(""));

    const response = await handleReadAnnouncement("release");

    expect(response.status).toBe(200);
  });
});
