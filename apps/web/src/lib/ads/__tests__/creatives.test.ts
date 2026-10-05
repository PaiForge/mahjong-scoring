import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCachedRead, mockTrackingId } = vi.hoisted(() => ({
  mockCachedRead: vi.fn(),
  mockTrackingId: vi.fn(),
}));

// unstable_cache はモジュール読み込み時に 1 度ずつ呼ばれ、返した関数が
// スロットごとの読み込み / トラッキング ID の読み込みになる。DB を経由せず、
// その関数の戻り値を差し替える。
vi.mock("next/cache", () => ({
  unstable_cache: (_fn: unknown, keys: readonly string[]) =>
    keys[0] === "amazon-tracking-id" ? mockTrackingId : mockCachedRead,
}));
vi.mock("@/lib/db", () => ({
  db: {},
  adCreatives: {},
  adCreativeTranslations: {},
  adNetworkSettings: {},
}));

import {
  getNativeAdCreative,
  getNativeAdCreatives,
  getNativeAdPlacements,
} from "../creatives";

function creative(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    kind: "native_card",
    href: "https://www.amazon.co.jp/dp/xxx?tag=example-22",
    asin: null,
    icon: "📘",
    imagePath: null,
    imageAlt: null,
    hand: null,
    copy: { title: { ja: "麻雀の本" }, description: { ja: "説明" } },
    ...overrides,
  };
}

describe("getNativeAdCreatives", () => {
  beforeEach(() => {
    mockCachedRead.mockReset();
    mockTrackingId.mockReset();
    mockTrackingId.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("掲載中の広告を画面に渡す形にし、NULL を undefined にする", async () => {
    mockCachedRead.mockResolvedValue([creative()]);
    await expect(
      getNativeAdCreatives("practice-grid-native-ad"),
    ).resolves.toEqual([
      {
        id: "c1",
        kind: "native_card",
        href: "https://www.amazon.co.jp/dp/xxx?tag=example-22",
        icon: "📘",
        imageUrl: undefined,
        imageAlt: "",
        hand: undefined,
        title: "麻雀の本",
        description: "説明",
      },
    ]);
  });

  it("手牌の表記を牌の並びにし、読めない表記は手牌なしにする", async () => {
    mockCachedRead.mockResolvedValue([
      creative({ hand: "123m" }),
      creative({ id: "c2", hand: "xyz" }),
    ]);
    const [valid, invalid] = await getNativeAdCreatives(
      "practice-grid-native-ad",
    );
    expect(valid?.hand).toHaveLength(3);
    expect(invalid?.hand).toBeUndefined();
  });

  it("ASIN の広告はトラッキング ID とリンクを組み立て、未設定なら出さない", async () => {
    const asinCreative = creative({ href: null, asin: "B08721VWS5" });
    mockCachedRead.mockResolvedValue([asinCreative]);
    await expect(
      getNativeAdCreatives("practice-grid-native-ad"),
    ).resolves.toEqual([]);

    mockTrackingId.mockResolvedValue("example-22");
    const [ad] = await getNativeAdCreatives("practice-grid-native-ad");
    expect(ad?.href).toBe(
      "https://www.amazon.co.jp/dp/B08721VWS5?tag=example-22",
    );
  });

  it("スロットが受け付けない kind の行は描画に通さない", async () => {
    mockCachedRead.mockResolvedValue([creative({ kind: "native_row" })]);
    await expect(
      getNativeAdCreatives("practice-grid-native-ad"),
    ).resolves.toEqual([]);
  });

  it("タイトルを持たない行は描画に通さない", async () => {
    mockCachedRead.mockResolvedValue([
      creative({ copy: { title: {}, description: { ja: "説明" } } }),
    ]);
    await expect(
      getNativeAdCreatives("practice-grid-native-ad"),
    ).resolves.toEqual([]);
  });

  it("読み込みに失敗したら広告を出さない（ページを落とさない）", async () => {
    mockCachedRead.mockRejectedValue(new Error("db down"));
    await expect(
      getNativeAdCreatives("practice-grid-native-ad"),
    ).resolves.toEqual([]);
  });
});

describe("getNativeAdCreative", () => {
  beforeEach(() => {
    mockTrackingId.mockResolvedValue(null);
  });

  it("並び順の先頭を返し、無ければ undefined", async () => {
    mockCachedRead.mockResolvedValueOnce([
      creative({ id: "first" }),
      creative({ id: "second" }),
    ]);
    await expect(
      getNativeAdCreative("practice-grid-native-ad"),
    ).resolves.toMatchObject({ id: "first" });

    mockCachedRead.mockResolvedValueOnce([]);
    await expect(
      getNativeAdCreative("practice-grid-native-ad"),
    ).resolves.toBeUndefined();
  });
});

describe("getNativeAdPlacements", () => {
  beforeEach(() => {
    mockTrackingId.mockResolvedValue(null);
  });

  it("並び順の先頭からスロットの枠数（教本の目次は 3）までを返す", async () => {
    mockCachedRead.mockResolvedValueOnce(
      ["a", "b", "c", "d"].map((id) => creative({ id, kind: "native_row" })),
    );
    const ads = await getNativeAdPlacements("learn-index-native-ad");
    expect(ads.map((ad) => ad.id)).toEqual(["a", "b", "c"]);
  });

  it("掲載中が枠数より少なければ繰り返して埋めない", async () => {
    mockCachedRead.mockResolvedValueOnce([
      creative({ id: "a", kind: "native_row" }),
    ]);
    const ads = await getNativeAdPlacements("learn-index-native-ad");
    expect(ads.map((ad) => ad.id)).toEqual(["a"]);
  });
});
