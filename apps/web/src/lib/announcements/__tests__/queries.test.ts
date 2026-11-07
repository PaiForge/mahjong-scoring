import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSelect, mockExecute } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockExecute: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { select: mockSelect, execute: mockExecute },
  announcements: {
    _name: "announcements",
    slug: "slug",
    locale: "locale",
    status: "status",
    pinnedAt: "pinned_at",
    publishedAt: "published_at",
  },
}));

vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

import { createQueryChain, type QueryChainMock } from "@/test/drizzle-mock";

import {
  getPublishedAnnouncementsExact,
  getPublishedAnnouncementsPaginated,
} from "../queries";

const ROWS = [{ id: "a1", slug: "release", locale: "en" }];

describe("getPublishedAnnouncementsExact", () => {
  let chain: QueryChainMock;

  beforeEach(() => {
    vi.clearAllMocks();
    chain = createQueryChain(ROWS);
    mockSelect.mockReturnValue(chain);
  });

  it("公開済みで、要求した言語の行だけに絞る（他の言語で埋めない）", async () => {
    await getPublishedAnnouncementsExact("en", 5, 0);

    expect(chain.where).toHaveBeenCalledWith({
      op: "and",
      args: [
        { op: "eq", args: ["status", "published"] },
        { op: "eq", args: ["locale", "en"] },
      ],
    });
    // fallback 付きのクエリ（生 SQL）は使わない
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("ピン留め → 公開日時の新しい順に並べ、件数と開始位置を渡す", async () => {
    await getPublishedAnnouncementsExact("en", 5, 10);

    const [pinned, published] = chain.orderBy.mock.calls[0] ?? [];
    expect(pinned).toMatchObject({ op: "sql", values: ["pinned_at"] });
    expect(pinned.strings.join("")).toContain("DESC NULLS LAST");
    expect(published).toEqual({ op: "desc", args: ["published_at"] });
    expect(chain.limit).toHaveBeenCalledWith(5);
    expect(chain.offset).toHaveBeenCalledWith(10);
  });

  it("取得した行をそのまま返す", async () => {
    expect(await getPublishedAnnouncementsExact("en", 5, 0)).toEqual(ROWS);
  });
});

describe("getPublishedAnnouncementsPaginated（既存の fallback 付き）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue(ROWS);
  });

  it("要求した言語 → 日本語の順で埋める SQL を使い続ける", async () => {
    await getPublishedAnnouncementsPaginated("en", 5, 0);

    expect(mockSelect).not.toHaveBeenCalled();
    const [query] = mockExecute.mock.calls[0] ?? [];
    expect(query.values).toEqual(
      expect.arrayContaining(["en", "ja", "published", 5, 0]),
    );
  });
});
