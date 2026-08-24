import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetTranslations } = vi.hoisted(() => ({
  mockGetTranslations: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: mockGetTranslations,
}));

import {
  createMetadata,
  createNamespaceMetadata,
  createPrivateMetadata,
  createResultMetadata,
  createTitleOnlyMetadata,
  OG_IMAGE,
  SITE_NAME,
} from "../metadata";

/** 名前空間ごとの辞書を引く翻訳関数を組み立てる */
function setupTranslations(dict: Record<string, Record<string, string>>) {
  mockGetTranslations.mockImplementation((namespace: string) =>
    Promise.resolve((key: string) => dict[namespace]?.[key] ?? `?${key}`),
  );
}

/**
 * createMetadata が常に付ける OGP / Twitter Card の期待値。
 *
 * Next は openGraph / twitter をオブジェクトごと差し替えるため、
 * ヘルパーは毎回完全な形を返す必要がある。ここを緩めると
 * 「og:image だけ欠けたページ」に気付けなくなるので完全一致で見る。
 *
 * @param title - サイト名サフィックス込みのタイトル
 * @param description - 説明（無いページでは省略される）
 * @param path - canonical のパス（指定時のみ og:url が付く）
 */
function expectedCard(title: string, description?: string, path?: string) {
  return {
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "ja_JP",
      title,
      images: [OG_IMAGE],
      ...(description ? { description } : {}),
      ...(path ? { url: path } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: [OG_IMAGE],
      ...(description ? { description } : {}),
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createNamespaceMetadata", () => {
  it("既定では title / description キーを引く", async () => {
    setupTranslations({
      jantouFu: { title: "雀頭符", description: "雀頭の符を学ぶ" },
    });

    await expect(createNamespaceMetadata("jantouFu")).resolves.toEqual({
      title: `雀頭符 - ${SITE_NAME}`,
      description: "雀頭の符を学ぶ",
      ...expectedCard(`雀頭符 - ${SITE_NAME}`, "雀頭の符を学ぶ"),
    });
  });

  it("キー名を上書きできる（pageTitle / pageDescription）", async () => {
    setupTranslations({
      scoreTable: { pageTitle: "点数表", pageDescription: "早見表" },
    });

    await expect(
      createNamespaceMetadata("scoreTable", {
        title: "pageTitle",
        description: "pageDescription",
      }),
    ).resolves.toEqual({
      title: `点数表 - ${SITE_NAME}`,
      description: "早見表",
      ...expectedCard(`点数表 - ${SITE_NAME}`, "早見表"),
    });
  });

  it("path を渡すと canonical に通す", async () => {
    setupTranslations({
      jantouFu: { title: "雀頭符", description: "雀頭の符を学ぶ" },
    });

    await expect(
      createNamespaceMetadata("jantouFu", { path: "/learn/jantou-fu" }),
    ).resolves.toMatchObject({
      alternates: { canonical: "/learn/jantou-fu" },
      openGraph: { url: "/learn/jantou-fu" },
    });
  });
});

describe("createTitleOnlyMetadata", () => {
  it("description を引かない（辞書に無いキーを参照しない）", async () => {
    setupTranslations({ jantouFu: { title: "雀頭符" } });

    const metadata = await createTitleOnlyMetadata("jantouFu");

    expect(metadata).toEqual({
      title: `雀頭符 - ${SITE_NAME}`,
      ...expectedCard(`雀頭符 - ${SITE_NAME}`),
    });
    expect(metadata).not.toHaveProperty("description");
    expect(metadata.openGraph).not.toHaveProperty("description");
  });

  it("タイトルのキーを上書きできる", async () => {
    setupTranslations({ scoreTable: { pageTitle: "点数表" } });

    await expect(
      createTitleOnlyMetadata("scoreTable", "pageTitle"),
    ).resolves.toEqual({
      title: `点数表 - ${SITE_NAME}`,
      ...expectedCard(`点数表 - ${SITE_NAME}`),
    });
  });

  it("path を渡すと canonical に通す", async () => {
    setupTranslations({ terms: { pageTitle: "利用規約" } });

    await expect(
      createTitleOnlyMetadata("terms", "pageTitle", "/terms"),
    ).resolves.toMatchObject({ alternates: { canonical: "/terms" } });
  });
});

describe("createPrivateMetadata", () => {
  it("サイト名サフィックス付きのタイトルに noindex を足す", async () => {
    setupTranslations({ mypage: { pageTitle: "マイページ" } });

    await expect(createPrivateMetadata("mypage")).resolves.toEqual({
      title: `マイページ - ${SITE_NAME}`,
      robots: { index: false, follow: false },
      ...expectedCard(`マイページ - ${SITE_NAME}`),
    });
  });

  it("canonical を持たない（検索結果に載せないため）", async () => {
    setupTranslations({ mypage: { pageTitle: "マイページ" } });

    const metadata = await createPrivateMetadata("mypage");

    expect(metadata).not.toHaveProperty("alternates");
  });

  it("タイトルのキーを上書きできる", async () => {
    setupTranslations({ setupUsername: { title: "ユーザー名の設定" } });

    await expect(
      createPrivateMetadata("setupUsername", "title"),
    ).resolves.toEqual({
      title: `ユーザー名の設定 - ${SITE_NAME}`,
      robots: { index: false, follow: false },
      ...expectedCard(`ユーザー名の設定 - ${SITE_NAME}`),
    });
  });
});

describe("createResultMetadata", () => {
  it("「<練習名> - <結果サフィックス>」を組み立てる", async () => {
    setupTranslations({
      jantouFu: { title: "雀頭符" },
      challenge: { resultSuffix: "結果" },
    });

    await expect(createResultMetadata("jantouFu")).resolves.toEqual({
      title: `雀頭符 - 結果 - ${SITE_NAME}`,
      robots: { index: false, follow: true },
      ...expectedCard(`雀頭符 - 結果 - ${SITE_NAME}`),
    });
  });

  it("noindex, follow を出す（intro と検索結果で競合させない）", async () => {
    setupTranslations({
      jantouFu: { title: "雀頭符" },
      challenge: { resultSuffix: "結果" },
    });

    await expect(createResultMetadata("jantouFu")).resolves.toMatchObject({
      robots: { index: false, follow: true },
    });
  });

  it("練習の名前空間と challenge の両方を引く", async () => {
    setupTranslations({
      yakuHanChallenge: { title: "役の翻数" },
      challenge: { resultSuffix: "結果" },
    });

    await createResultMetadata("yakuHanChallenge");

    expect(mockGetTranslations).toHaveBeenCalledWith("yakuHanChallenge");
    expect(mockGetTranslations).toHaveBeenCalledWith("challenge");
  });
});

describe("createMetadata", () => {
  it("サイト名を付けた title を返す", () => {
    expect(createMetadata({ title: "練習" })).toEqual({
      title: `練習 - ${SITE_NAME}`,
      ...expectedCard(`練習 - ${SITE_NAME}`),
    });
  });

  it("description を渡すとそのまま含める", () => {
    expect(createMetadata({ title: "練習", description: "説明" })).toEqual({
      title: `練習 - ${SITE_NAME}`,
      description: "説明",
      ...expectedCard(`練習 - ${SITE_NAME}`, "説明"),
    });
  });

  it("path を渡すと canonical と og:url が付く", () => {
    expect(createMetadata({ title: "練習", path: "/practice" })).toEqual({
      title: `練習 - ${SITE_NAME}`,
      alternates: { canonical: "/practice" },
      ...expectedCard(`練習 - ${SITE_NAME}`, undefined, "/practice"),
    });
  });

  it("path を省略すると canonical を持たない", () => {
    const metadata = createMetadata({ title: "練習" });

    expect(metadata).not.toHaveProperty("alternates");
    expect(metadata.openGraph).not.toHaveProperty("url");
  });

  it("OGP 画像を必ず含める（file convention に頼らない）", () => {
    const metadata = createMetadata({ title: "練習" });

    expect(metadata.openGraph).toMatchObject({ images: [OG_IMAGE] });
    expect(metadata.twitter).toMatchObject({ images: [OG_IMAGE] });
  });
});
