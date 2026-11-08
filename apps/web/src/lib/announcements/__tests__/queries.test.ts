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

// cache() はリクエスト内の重複排除で、テストでは素通しにして毎回クエリを見る
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T>(fn: T): T => fn,
}));

import { createQueryChain, type QueryChainMock } from "@/test/drizzle-mock";

import {
  getPublishedAnnouncement,
  getPublishedAnnouncementCount,
  getPublishedAnnouncementCountExact,
  getPublishedAnnouncementExact,
  getPublishedAnnouncementSlugsForSitemap,
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

describe("getPublishedAnnouncementCountExact", () => {
  let chain: QueryChainMock;

  beforeEach(() => {
    vi.clearAllMocks();
    chain = createQueryChain([{ count: "3" }]);
    mockSelect.mockReturnValue(chain);
  });

  it("公開済みで要求した言語の行だけを COUNT(*) で数える（(slug, locale) が一意なので DISTINCT は要らない）", async () => {
    await getPublishedAnnouncementCountExact("en");

    const [selection] = mockSelect.mock.calls[0] ?? [];
    expect(selection.count.strings.join("")).toBe("COUNT(*)");
    expect(chain.where).toHaveBeenCalledWith({
      op: "and",
      args: [
        { op: "eq", args: ["status", "published"] },
        { op: "eq", args: ["locale", "en"] },
      ],
    });
  });

  it("ドライバが文字列で返す件数を数値にして返す", async () => {
    expect(await getPublishedAnnouncementCountExact("en")).toBe(3);
  });
});

describe("getPublishedAnnouncementExact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("公開済み・slug・言語の 3 条件で 1 行に絞る（他の言語で埋めない）", async () => {
    const chain = createQueryChain([ROWS[0]]);
    mockSelect.mockReturnValue(chain);

    await getPublishedAnnouncementExact("release", "en");

    expect(chain.where).toHaveBeenCalledWith({
      op: "and",
      args: [
        { op: "eq", args: ["status", "published"] },
        { op: "eq", args: ["slug", "release"] },
        { op: "eq", args: ["locale", "en"] },
      ],
    });
    expect(chain.limit).toHaveBeenCalledWith(1);
  });

  it("その言語の行があればその行を返す", async () => {
    mockSelect.mockReturnValue(createQueryChain([ROWS[0]]));

    expect(await getPublishedAnnouncementExact("release", "en")).toEqual(
      ROWS[0],
    );
  });

  it("その言語の行が無ければ null（日本語の行へ fallback しない）", async () => {
    mockSelect.mockReturnValue(createQueryChain([]));

    expect(await getPublishedAnnouncementExact("release", "en")).toBeNull();
  });
});

describe("getPublishedAnnouncementCount（既存の fallback 付き）", () => {
  let chain: QueryChainMock;

  beforeEach(() => {
    vi.clearAllMocks();
    chain = createQueryChain([{ count: "2" }]);
    mockSelect.mockReturnValue(chain);
  });

  it("言語で絞らず、公開済みの slug を DISTINCT で数え続ける", async () => {
    expect(await getPublishedAnnouncementCount()).toBe(2);

    const [selection] = mockSelect.mock.calls[0] ?? [];
    expect(selection.count).toMatchObject({ op: "sql", values: ["slug"] });
    expect(selection.count.strings.join("")).toBe("COUNT(DISTINCT )");
    expect(chain.where).toHaveBeenCalledWith({
      op: "eq",
      args: ["status", "published"],
    });
  });
});

describe("getPublishedAnnouncementSlugsForSitemap（既存）", () => {
  it("言語で絞らず、公開済みの行を slug ごとに集約して返す", async () => {
    vi.clearAllMocks();
    const sitemapRows = [{ slug: "release", publishedAt: null }];
    const chain = createQueryChain(sitemapRows);
    mockSelect.mockReturnValue(chain);

    expect(await getPublishedAnnouncementSlugsForSitemap()).toEqual(
      sitemapRows,
    );
    expect(chain.where).toHaveBeenCalledWith({
      op: "eq",
      args: ["status", "published"],
    });
    expect(chain.groupBy).toHaveBeenCalledWith("slug");
  });
});

describe("getPublishedAnnouncement（既存の fallback 付き）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("言語で絞らずに slug の公開行をすべて引き、要求した言語の行を選ぶ", async () => {
    const variants = [
      { id: "ja1", slug: "release", locale: "ja" },
      { id: "en1", slug: "release", locale: "en" },
    ];
    const chain = createQueryChain(variants);
    mockSelect.mockReturnValue(chain);

    expect(await getPublishedAnnouncement("release", "en")).toEqual(
      variants[1],
    );
    expect(chain.where).toHaveBeenCalledWith({
      op: "and",
      args: [
        { op: "eq", args: ["slug", "release"] },
        { op: "eq", args: ["status", "published"] },
      ],
    });
  });

  it("要求した言語の行が無ければ日本語の行で埋める", async () => {
    const variants = [{ id: "ja1", slug: "release", locale: "ja" }];
    mockSelect.mockReturnValue(createQueryChain(variants));

    expect(await getPublishedAnnouncement("release", "en")).toEqual(
      variants[0],
    );
  });

  it("公開行が 1 件も無ければ null", async () => {
    mockSelect.mockReturnValue(createQueryChain([]));

    expect(await getPublishedAnnouncement("release", "en")).toBeNull();
  });
});
