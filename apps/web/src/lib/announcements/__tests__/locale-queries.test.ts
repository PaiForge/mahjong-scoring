import { beforeEach, describe, expect, it, vi } from "vitest";

const queries = vi.hoisted(() => ({
  getPublishedAnnouncement: vi.fn(),
  getPublishedAnnouncementCount: vi.fn(),
  getPublishedAnnouncementCountExact: vi.fn(),
  getPublishedAnnouncementExact: vi.fn(),
  getPublishedAnnouncementsExact: vi.fn(),
  getPublishedAnnouncementsPaginated: vi.fn(),
}));

vi.mock("../queries", () => queries);

const { countAnnouncementsFor, findAnnouncementFor, listAnnouncementsFor } =
  await import("../locale-queries");

beforeEach(() => {
  for (const mock of Object.values(queries)) {
    mock.mockReset();
    mock.mockResolvedValue("result");
  }
});

describe("日本語は従来の fallback 付きのクエリを使う", () => {
  it("件数は slug の DISTINCT（fallback 付き）", async () => {
    await countAnnouncementsFor("ja");
    expect(queries.getPublishedAnnouncementCount).toHaveBeenCalledWith();
    expect(queries.getPublishedAnnouncementCountExact).not.toHaveBeenCalled();
  });

  it("一覧は fallback 付きのページネーション", async () => {
    await listAnnouncementsFor("ja", 20, 40);
    expect(queries.getPublishedAnnouncementsPaginated).toHaveBeenCalledWith(
      "ja",
      20,
      40,
    );
    expect(queries.getPublishedAnnouncementsExact).not.toHaveBeenCalled();
  });

  it("詳細は fallback 付きの 1 件", async () => {
    await findAnnouncementFor("update", "ja");
    expect(queries.getPublishedAnnouncement).toHaveBeenCalledWith(
      "update",
      "ja",
    );
    expect(queries.getPublishedAnnouncementExact).not.toHaveBeenCalled();
  });
});

describe("英語はその言語の行だけを引き、日本語で埋めない", () => {
  it("件数は英語の公開行だけを数える", async () => {
    await countAnnouncementsFor("en");
    expect(queries.getPublishedAnnouncementCountExact).toHaveBeenCalledWith(
      "en",
    );
    expect(queries.getPublishedAnnouncementCount).not.toHaveBeenCalled();
  });

  it("一覧は英語の公開行だけ", async () => {
    await listAnnouncementsFor("en", 20, 0);
    expect(queries.getPublishedAnnouncementsExact).toHaveBeenCalledWith(
      "en",
      20,
      0,
    );
    expect(queries.getPublishedAnnouncementsPaginated).not.toHaveBeenCalled();
  });

  it("英語の行が無い slug は null（呼び出し側が 404 にする）", async () => {
    queries.getPublishedAnnouncementExact.mockResolvedValue(null);
    await expect(findAnnouncementFor("ja-only", "en")).resolves.toBeNull();
    expect(queries.getPublishedAnnouncementExact).toHaveBeenCalledWith(
      "ja-only",
      "en",
    );
    expect(queries.getPublishedAnnouncement).not.toHaveBeenCalled();
  });
});
