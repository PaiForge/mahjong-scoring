import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "next-intl/server",
  async () => await import("@/test/intl-namespace-mock"),
);

import {
  mockGetTranslations,
  setupTranslations,
} from "@/test/intl-namespace-mock";

import {
  createMetadata,
  createNamespaceMetadata,
  createPrivateMetadata,
  createResultMetadata,
  createTitleOnlyMetadata,
} from "../metadata";

/**
 * OGP / Twitter Card に毎回明示する画像。
 *
 * Next は openGraph / twitter をオブジェクトごと差し替えるため、ヘルパーは毎回
 * 完全な形を返す必要がある。ここを緩めると「og:image だけ欠けたページ」に
 * 気付けなくなるので、各テストは openGraph / twitter を完全一致で見る。
 *
 * 期待値は本体（OG_IMAGE・buildSocialCard）を写さずリテラルで書く。写しは本体と
 * 同じ誤りを持つので、本体が崩れてもテストが落ちない。
 */
const EXPECTED_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "麻雀点数計算教室 - 麻雀の点数計算トレーニング",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createNamespaceMetadata", () => {
  it("既定では title / description キーを引く", async () => {
    setupTranslations({
      jantouFu: { title: "雀頭符", description: "雀頭の符を学ぶ" },
    });

    await expect(createNamespaceMetadata("jantouFu")).resolves.toEqual({
      title: "雀頭符 - 麻雀点数計算教室",
      description: "雀頭の符を学ぶ",
      openGraph: {
        type: "website",
        siteName: "麻雀点数計算教室",
        locale: "ja_JP",
        title: "雀頭符 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
        description: "雀頭の符を学ぶ",
      },
      twitter: {
        card: "summary_large_image",
        title: "雀頭符 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
        description: "雀頭の符を学ぶ",
      },
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
      title: "点数表 - 麻雀点数計算教室",
      description: "早見表",
      openGraph: {
        type: "website",
        siteName: "麻雀点数計算教室",
        locale: "ja_JP",
        title: "点数表 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
        description: "早見表",
      },
      twitter: {
        card: "summary_large_image",
        title: "点数表 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
        description: "早見表",
      },
    });
  });

  it("path を渡すと canonical に通す", async () => {
    setupTranslations({
      jantouFu: { title: "雀頭符", description: "雀頭の符を学ぶ" },
    });

    await expect(
      createNamespaceMetadata("jantouFu", { path: "/lessons/jantou-fu" }),
    ).resolves.toMatchObject({
      alternates: { canonical: "/lessons/jantou-fu" },
      openGraph: { url: "/lessons/jantou-fu" },
    });
  });
});

describe("createTitleOnlyMetadata", () => {
  it("description を引かない（辞書に無いキーを参照しない）", async () => {
    setupTranslations({ jantouFu: { title: "雀頭符" } });

    const metadata = await createTitleOnlyMetadata("jantouFu");

    expect(metadata).toEqual({
      title: "雀頭符 - 麻雀点数計算教室",
      openGraph: {
        type: "website",
        siteName: "麻雀点数計算教室",
        locale: "ja_JP",
        title: "雀頭符 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
      },
      twitter: {
        card: "summary_large_image",
        title: "雀頭符 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
      },
    });
    expect(metadata).not.toHaveProperty("description");
    expect(metadata.openGraph).not.toHaveProperty("description");
  });

  it("タイトルのキーを上書きできる", async () => {
    setupTranslations({ scoreTable: { pageTitle: "点数表" } });

    await expect(
      createTitleOnlyMetadata("scoreTable", "pageTitle"),
    ).resolves.toEqual({
      title: "点数表 - 麻雀点数計算教室",
      openGraph: {
        type: "website",
        siteName: "麻雀点数計算教室",
        locale: "ja_JP",
        title: "点数表 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
      },
      twitter: {
        card: "summary_large_image",
        title: "点数表 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
      },
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
      title: "マイページ - 麻雀点数計算教室",
      robots: { index: false, follow: false },
      openGraph: {
        type: "website",
        siteName: "麻雀点数計算教室",
        locale: "ja_JP",
        title: "マイページ - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
      },
      twitter: {
        card: "summary_large_image",
        title: "マイページ - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
      },
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
      title: "ユーザー名の設定 - 麻雀点数計算教室",
      robots: { index: false, follow: false },
      openGraph: {
        type: "website",
        siteName: "麻雀点数計算教室",
        locale: "ja_JP",
        title: "ユーザー名の設定 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
      },
      twitter: {
        card: "summary_large_image",
        title: "ユーザー名の設定 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
      },
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
      title: "雀頭符 - 結果 - 麻雀点数計算教室",
      robots: { index: false, follow: true },
      openGraph: {
        type: "website",
        siteName: "麻雀点数計算教室",
        locale: "ja_JP",
        title: "雀頭符 - 結果 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
      },
      twitter: {
        card: "summary_large_image",
        title: "雀頭符 - 結果 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
      },
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
      title: "練習 - 麻雀点数計算教室",
      openGraph: {
        type: "website",
        siteName: "麻雀点数計算教室",
        locale: "ja_JP",
        title: "練習 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
      },
      twitter: {
        card: "summary_large_image",
        title: "練習 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
      },
    });
  });

  it("description を渡すとそのまま含める", () => {
    expect(createMetadata({ title: "練習", description: "説明" })).toEqual({
      title: "練習 - 麻雀点数計算教室",
      description: "説明",
      openGraph: {
        type: "website",
        siteName: "麻雀点数計算教室",
        locale: "ja_JP",
        title: "練習 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
        description: "説明",
      },
      twitter: {
        card: "summary_large_image",
        title: "練習 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
        description: "説明",
      },
    });
  });

  it("path を渡すと canonical と og:url が付く", () => {
    expect(createMetadata({ title: "練習", path: "/practice" })).toEqual({
      title: "練習 - 麻雀点数計算教室",
      alternates: { canonical: "/practice" },
      openGraph: {
        type: "website",
        siteName: "麻雀点数計算教室",
        locale: "ja_JP",
        title: "練習 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
        url: "/practice",
      },
      twitter: {
        card: "summary_large_image",
        title: "練習 - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
      },
    });
  });

  it("path を省略すると canonical を持たない", () => {
    const metadata = createMetadata({ title: "練習" });

    expect(metadata).not.toHaveProperty("alternates");
    expect(metadata.openGraph).not.toHaveProperty("url");
  });

  it("OGP 画像を必ず含める（file convention に頼らない）", () => {
    const metadata = createMetadata({ title: "練習" });

    expect(metadata.openGraph).toMatchObject({ images: [EXPECTED_IMAGE] });
    expect(metadata.twitter).toMatchObject({ images: [EXPECTED_IMAGE] });
  });
});
