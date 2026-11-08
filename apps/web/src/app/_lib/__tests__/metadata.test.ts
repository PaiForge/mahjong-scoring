import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", async () => await import("./locale-intl-mock"));

import {
  mockGetTranslations,
  setupLocaleTranslations,
} from "./locale-intl-mock";

import {
  buildSocialCard,
  createMetadata,
  createNamespaceMetadata,
  createPrivateMetadata,
  createResultMetadata,
  createTitleOnlyMetadata,
  DEFAULT_TITLE,
  OG_IMAGE,
  siteIdentity,
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

/** 日本語の辞書だけを差し込む（locale を省略したヘルパーは日本語で引く） */
function setupTranslations(dict: Record<string, Record<string, string>>) {
  setupLocaleTranslations({ ja: dict });
}

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

    expect(mockGetTranslations).toHaveBeenCalledWith({
      locale: "ja",
      namespace: "yakuHanChallenge",
    });
    expect(mockGetTranslations).toHaveBeenCalledWith({
      locale: "ja",
      namespace: "challenge",
    });
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

  it("path を渡すと canonical・hreflang・og:url が付く", () => {
    expect(
      createMetadata({ title: "ランキング", path: "/leaderboard" }),
    ).toEqual({
      title: "ランキング - 麻雀点数計算教室",
      // 日本語だけで索引させるページ（ランキングは英語で未公開）の hreflang は実在する日本語と x-default だけ
      alternates: {
        canonical: "/leaderboard",
        languages: { ja: "/leaderboard", "x-default": "/leaderboard" },
      },
      openGraph: {
        type: "website",
        siteName: "麻雀点数計算教室",
        locale: "ja_JP",
        title: "ランキング - 麻雀点数計算教室",
        images: [EXPECTED_IMAGE],
        url: "/leaderboard",
      },
      twitter: {
        card: "summary_large_image",
        title: "ランキング - 麻雀点数計算教室",
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

/**
 * 英語の OGP 画像。日本語と別のファイルで、alt も英語のタグラインになる。
 * サイト名は英語でも日本語のブランド名のまま。
 */
const EXPECTED_EN_IMAGE = {
  url: "/og-image-en.png",
  width: 1200,
  height: 630,
  alt: "麻雀点数計算教室 - Riichi Mahjong Scoring Practice",
};

/** 点数表は日英どちらも索引させる翻訳の組。hreflang は 3 つ（パスで返す） */
const SCORE_TABLE_LANGUAGES = {
  ja: "/reference/score-table",
  en: "/en/reference/score-table",
  "x-default": "/reference/score-table",
};

describe("locale を渡したとき（英語）", () => {
  it("点数表は英語の辞書・自己 canonical・hreflang・英語の OGP を完全な形で返す", async () => {
    setupLocaleTranslations({
      en: {
        scoreTable: {
          pageTitle: "Riichi Mahjong Scoring Table",
          pageDescription: "Look up every hand value.",
        },
      },
    });

    await expect(
      createNamespaceMetadata("scoreTable", {
        title: "pageTitle",
        description: "pageDescription",
        path: "/reference/score-table",
        locale: "en",
      }),
    ).resolves.toEqual({
      title: "Riichi Mahjong Scoring Table - 麻雀点数計算教室",
      description: "Look up every hand value.",
      alternates: {
        canonical: "/en/reference/score-table",
        languages: SCORE_TABLE_LANGUAGES,
      },
      openGraph: {
        type: "website",
        siteName: "麻雀点数計算教室",
        locale: "en_US",
        title: "Riichi Mahjong Scoring Table - 麻雀点数計算教室",
        images: [EXPECTED_EN_IMAGE],
        description: "Look up every hand value.",
        url: "/en/reference/score-table",
      },
      twitter: {
        card: "summary_large_image",
        title: "Riichi Mahjong Scoring Table - 麻雀点数計算教室",
        images: [EXPECTED_EN_IMAGE],
        description: "Look up every hand value.",
      },
    });
    expect(mockGetTranslations).toHaveBeenCalledWith({
      locale: "en",
      namespace: "scoreTable",
    });
  });

  it("日本語の点数表は canonical を変えず、英語との hreflang を持つ", async () => {
    setupTranslations({
      scoreTable: { pageTitle: "点数表", pageDescription: "早見表" },
    });

    const metadata = await createNamespaceMetadata("scoreTable", {
      title: "pageTitle",
      description: "pageDescription",
      path: "/reference/score-table",
    });

    expect(metadata.alternates).toEqual({
      canonical: "/reference/score-table",
      languages: SCORE_TABLE_LANGUAGES,
    });
    expect(metadata.openGraph).toEqual({
      type: "website",
      siteName: "麻雀点数計算教室",
      locale: "ja_JP",
      title: "点数表 - 麻雀点数計算教室",
      images: [EXPECTED_IMAGE],
      description: "早見表",
      url: "/reference/score-table",
    });
  });

  it("locale: 'ja' を明示しても省略時と同じ出力になる", async () => {
    setupTranslations({
      jantouFu: { title: "雀頭符", description: "雀頭の符を学ぶ" },
    });

    const implicit = await createNamespaceMetadata("jantouFu", {
      path: "/lessons/jantou-fu",
    });
    const explicit = await createNamespaceMetadata("jantouFu", {
      path: "/lessons/jantou-fu",
      locale: "ja",
    });

    expect(explicit).toEqual(implicit);
  });

  it("英語で索引させない画面は自己 canonical を持てるが、hreflang に英語を挙げない", () => {
    // 道場は日本語で索引対象、英語では出すが索引させない
    expect(
      createMetadata({ title: "Dojo", path: "/dojo", locale: "en" }).alternates,
    ).toEqual({
      canonical: "/en/dojo",
      languages: { ja: "/dojo", "x-default": "/dojo" },
    });
  });

  it("query・hash は canonical と og:url に混ぜない", () => {
    const metadata = createMetadata({
      title: "Score table",
      path: "/reference/score-table?variant=x#top",
      locale: "en",
    });

    expect(metadata.alternates).toEqual({
      canonical: "/en/reference/score-table",
      languages: SCORE_TABLE_LANGUAGES,
    });
    expect(metadata.openGraph).toMatchObject({
      url: "/en/reference/score-table",
    });
  });

  it("索引させないページは hreflang を持たない（noindex の相手を列挙しない）", () => {
    const metadata = createMetadata({ title: "マイページ", path: "/mypage" });

    expect(metadata.alternates).toEqual({ canonical: "/mypage" });
  });

  it("結果・非公開・タイトルのみのヘルパーも英語の辞書と OGP を使う", async () => {
    setupLocaleTranslations({
      en: {
        scoreTable: { pageTitle: "Score table" },
        jantouFu: { title: "Pair fu" },
        challenge: { resultSuffix: "Result" },
      },
    });

    const titleOnly = await createTitleOnlyMetadata(
      "scoreTable",
      "pageTitle",
      undefined,
      { locale: "en" },
    );
    const privatePage = await createPrivateMetadata("scoreTable", "pageTitle", {
      locale: "en",
    });
    const result = await createResultMetadata("jantouFu", { locale: "en" });

    expect(titleOnly).toMatchObject({
      title: "Score table - 麻雀点数計算教室",
      openGraph: { locale: "en_US", images: [EXPECTED_EN_IMAGE] },
      twitter: { images: [EXPECTED_EN_IMAGE] },
    });
    expect(privatePage).toMatchObject({
      title: "Score table - 麻雀点数計算教室",
      robots: { index: false, follow: false },
      openGraph: { locale: "en_US" },
    });
    expect(result).toMatchObject({
      title: "Pair fu - Result - 麻雀点数計算教室",
      robots: { index: false, follow: true },
      openGraph: { locale: "en_US" },
    });
  });
});

describe("buildSocialCard", () => {
  it("locale を省略すると日本語のカード（ルートレイアウト・トップの既存出力）", () => {
    expect(
      buildSocialCard({ title: "T", description: "D", path: "/" }),
    ).toEqual({
      openGraph: {
        type: "website",
        siteName: "麻雀点数計算教室",
        locale: "ja_JP",
        title: "T",
        images: [EXPECTED_IMAGE],
        description: "D",
        url: "/",
      },
      twitter: {
        card: "summary_large_image",
        title: "T",
        images: [EXPECTED_IMAGE],
        description: "D",
      },
    });
  });

  it("英語は og:url を英語のパスにし、英語の画像を使う", () => {
    expect(buildSocialCard({ title: "T", path: "/", locale: "en" })).toEqual({
      openGraph: {
        type: "website",
        siteName: "麻雀点数計算教室",
        locale: "en_US",
        title: "T",
        images: [EXPECTED_EN_IMAGE],
        url: "/en",
      },
      twitter: {
        card: "summary_large_image",
        title: "T",
        images: [EXPECTED_EN_IMAGE],
      },
    });
  });
});

/** `apps/web/public`（OGP 画像の置き場） */
const PUBLIC_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../public",
);

describe("サイトの既定値", () => {
  it("日本語の既定タイトルと OGP 画像は既存の値のまま", () => {
    expect(DEFAULT_TITLE).toBe("麻雀点数計算教室 - 麻雀の点数計算トレーニング");
    expect(OG_IMAGE).toEqual(EXPECTED_IMAGE);
  });

  it.each(["ja", "en"] as const)(
    "%s の OGP 画像は public/ に実在し、宣言した寸法の PNG",
    (locale) => {
      const { ogImage } = siteIdentity(locale);
      const png = readFileSync(join(PUBLIC_DIR, ogImage.url));

      // PNG の IHDR（16 バイト目から幅・高さが 4 バイトずつ、ビッグエンディアン）
      expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
      expect(png.readUInt32BE(16)).toBe(ogImage.width);
      expect(png.readUInt32BE(20)).toBe(ogImage.height);
    },
  );

  it("英語はブランド名に英語のタグラインを添える", () => {
    expect(siteIdentity("en").defaultTitle).toBe(
      "麻雀点数計算教室 - Riichi Mahjong Scoring Practice",
    );
  });
});
