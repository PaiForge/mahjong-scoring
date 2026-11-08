import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";
import { webLocalePath } from "@mahjong-scoring/features/i18n/web-locale-path";
import { PRODUCTION_SITE_URL } from "@mahjong-scoring/features/site-url";
import { messages as en } from "@mahjong-scoring/messages/en";
import { TERMINOLOGY } from "@mahjong-scoring/messages/terminology";
import { auditEnglishText } from "@mahjong-scoring/messages/translation-audit";

/**
 * App Store の英語（English (U.S.)）の素材の検査
 *
 * @description
 * App Store Connect（ASC）にだけある素材はレビューも差分も残らないので、英語の素材は
 * `apps/mobile/store/en-US/` にファイルで置き、辞書の訳文と同じ検査をここで掛ける。
 * ASC の更新（別承認）のときは、このファイルの中身をそのまま貼る。貼る画面・撮影の
 * 手順は `store/README.md`。
 *
 * 検査すること:
 *
 * - 文字数の上限（ASC が受け付ける長さ。name 30・subtitle 30・promotional text 170・
 *   description 4000・keywords 100・What's New 4000・アプリ内課金の表示名 30・説明 45）
 * - 日本語の文字が残っていない（英語のストアに日本語が出ると、訳し漏れに見える）
 * - 訳語表（`terminology.ts`）の `avoid` の語を使わない（辞書と同じ規則）
 * - アプリが持たない・アプリの中で触れない主張をしない: 価格と通貨（StoreKit の価格が
 *   正で、審査ガイドライン 3.1.1 によりアプリの中で web の価格に触れない）、他の OS、
 *   定期購読（どちらの商品も自動更新しない）、web だけの機能（ランキングの一覧・公開
 *   プロフィール。アプリは他の利用者を見せない）
 * - URL は本番の web の英語のページ（`PRODUCTION_SITE_URL` + `/en` 系）。お問い合わせと
 *   プライバシーポリシーはアプリが開く web のページ（`MOBILE_WEB_PAGES`）で、web の
 *   `publication-gate.test.ts` が英語で公開済みであることを固定している。`/en` は
 *   英語の LP で、web の許可リストで公開済み
 * - アプリ内課金の表示名は、プラン画面の商品名（辞書の `mobilePlan.offers.*.title`）と
 *   同じ。購入シート・領収書の名前とアプリの画面の名前が割れると、同じ商品に見えない
 * - 綴り・文法（`translation-audit` の `auditEnglishText` の `error` が 0 件）。日本語の
 *   素材を持たないので、数・固有名・長さの対応は見ない
 *
 * 「うたった機能がアプリの実画面にある」ことは機械では確かめられないので、文面を
 * 変えたら英語の Release ビルドのスクリーンショットと見比べる（`store/README.md`）。
 */

/** 素材の置き場所 */
const STORE_DIR = new URL("../../store/en-US/", import.meta.url);

/** ASC の 1 欄ごとの上限（文字数） */
const TEXT_FIELD_LIMITS = {
  name: 30,
  subtitle: 30,
  promotional_text: 170,
  description: 4000,
  keywords: 100,
  release_notes: 4000,
} as const;

/** 欄の名前（`<欄>.txt`） */
type TextField = keyof typeof TEXT_FIELD_LIMITS;

const TEXT_FIELDS = Object.keys(TEXT_FIELD_LIMITS) as TextField[];

/** アプリ内課金の表示名・説明の上限（文字数） */
const IAP_NAME_LIMIT = 30;
const IAP_DESCRIPTION_LIMIT = 45;

/** アプリ内課金の商品（Product ID → プラン画面の商品名） */
const IAP_PRODUCTS = {
  "help.mahjong.score.pro.pass30days": en.mobilePlan.offers.pass.title,
  "help.mahjong.score.pro.lifetime": en.mobilePlan.offers.lifetime.title,
} as const;

/**
 * かな・カナ・漢字・全角の記号（日本語の残存）
 *
 * 和文の空白・句読点とかな（U+3000〜U+30FF）、CJK 統合漢字（拡張 A を含む U+3400〜U+9FFF）、
 * 互換漢字（U+F900〜U+FAFF）、全角・半角形（U+FF00〜U+FFEF）。範囲は符号位置で組む
 * （和文の空白を文字のまま書くと ESLint の no-irregular-whitespace が落とす）。
 */
const JAPANESE_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x3000, 0x30ff],
  [0x3400, 0x9fff],
  [0xf900, 0xfaff],
  [0xff00, 0xffef],
];
const JAPANESE_PATTERN = new RegExp(
  `[${JAPANESE_RANGES.map(
    ([from, to]) => `${String.fromCodePoint(from)}-${String.fromCodePoint(to)}`,
  ).join("")}]`,
  "u",
);

/**
 * 素材でうたわない語（小文字。単語の境界で照合する）
 *
 * 価格と通貨・他の OS・定期購読・web だけの機能。理由はモジュールの TSDoc。
 */
const UNCLAIMED_WORDS = [
  "price",
  "prices",
  "usd",
  "jpy",
  "yen",
  "free trial",
  "android",
  "ipad",
  "subscription",
  "subscribe",
  "leaderboard",
  "leaderboards",
  "ranking",
  "rankings",
  "profile",
  "profiles",
] as const;

/** 通貨の記号 */
const CURRENCY_PATTERN = /[$¥€£]/u;

/** 素材の 1 欄（末尾の改行 1 つは除く。ファイルの終わりの改行は ASC に貼らない） */
function readField(file: string): string {
  return readFileSync(new URL(file, STORE_DIR), "utf8").replace(/\n$/u, "");
}

/** JSON の素材 */
function readJson(file: string): unknown {
  return JSON.parse(readFileSync(new URL(file, STORE_DIR), "utf8"));
}

/** アプリ内課金の 1 商品の素材 */
interface IapLocalization {
  readonly name: string;
  readonly description: string;
}

function isIapLocalization(value: unknown): value is IapLocalization {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.keys(value).length === 2 &&
    typeof Reflect.get(value, "name") === "string" &&
    typeof Reflect.get(value, "description") === "string"
  );
}

function readIap(productId: string): IapLocalization {
  const value = readJson(`iap/${productId}.json`);
  if (!isIapLocalization(value)) {
    throw new Error(
      `iap/${productId}.json は { name, description } の形ではない`,
    );
  }
  return value;
}

/** 検査に掛ける素材の文（キー → 文） */
function allTexts(): ReadonlyArray<readonly [string, string]> {
  return [
    ...TEXT_FIELDS.map(
      (field) => [`store.en-US.${field}`, readField(`${field}.txt`)] as const,
    ),
    ...Object.keys(IAP_PRODUCTS).flatMap((productId) => {
      const iap = readIap(productId);
      return [
        [`store.en-US.iap.${productId}.name`, iap.name] as const,
        [`store.en-US.iap.${productId}.description`, iap.description] as const,
      ];
    }),
  ];
}

/** 文に語が単語として出るか（大文字・小文字を区別しない） */
function containsWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "iu").test(text);
}

/** 文字数（ASC は UTF-16 の単位ではなく文字で数える） */
function lengthOf(text: string): number {
  return [...text].length;
}

describe("App Store の英語の素材（store/en-US）", () => {
  it("ASC の欄ごとのファイルとアプリ内課金の商品のファイルだけがある", () => {
    const files = readdirSync(STORE_DIR).sort();
    expect(files).toEqual(
      [
        ...TEXT_FIELDS.map((field) => `${field}.txt`),
        "iap",
        "urls.json",
      ].sort(),
    );
    expect(readdirSync(new URL("iap/", STORE_DIR)).sort()).toEqual(
      Object.keys(IAP_PRODUCTS)
        .map((productId) => `${productId}.json`)
        .sort(),
    );
  });

  it.each(TEXT_FIELDS)("%s は空でなく ASC の上限の文字数に収まる", (field) => {
    const text = readField(`${field}.txt`);
    expect(text.trim()).toBe(text);
    expect(text.length).toBeGreaterThan(0);
    expect(lengthOf(text)).toBeLessThanOrEqual(TEXT_FIELD_LIMITS[field]);
  });

  it.each(Object.entries(IAP_PRODUCTS))(
    "アプリ内課金 %s の表示名はプラン画面の商品名と同じで、説明は上限に収まる",
    (productId, title) => {
      const iap = readIap(productId);
      expect(iap.name).toBe(title);
      expect(lengthOf(iap.name)).toBeLessThanOrEqual(IAP_NAME_LIMIT);
      expect(iap.description.trim()).toBe(iap.description);
      expect(iap.description.length).toBeGreaterThan(0);
      expect(lengthOf(iap.description)).toBeLessThanOrEqual(
        IAP_DESCRIPTION_LIMIT,
      );
    },
  );

  it("日本語の文字を残さない", () => {
    const leftovers = allTexts().filter(([, text]) =>
      JAPANESE_PATTERN.test(text),
    );
    expect(leftovers).toEqual([]);
  });

  it("訳語表の avoid の語を使わない", () => {
    const avoid = TERMINOLOGY.flatMap((entry) =>
      "avoid" in entry ? entry.avoid : [],
    );
    const found = allTexts().flatMap(([key, text]) =>
      avoid
        .filter((word) => containsWord(text, word))
        .map((word) => `${key}: ${word}`),
    );
    expect(found).toEqual([]);
  });

  it("価格・通貨・他の OS・定期購読・web だけの機能をうたわない", () => {
    const found = allTexts().flatMap(([key, text]) => [
      ...UNCLAIMED_WORDS.filter((word) => containsWord(text, word)).map(
        (word) => `${key}: ${word}`,
      ),
      ...(CURRENCY_PATTERN.test(text) ? [`${key}: 通貨の記号`] : []),
    ]);
    expect(found).toEqual([]);
  });

  it("URL は本番の web の英語で公開済みのページ（LP・お問い合わせ・プライバシーポリシー）", () => {
    expect(readJson("urls.json")).toEqual({
      support: `${PRODUCTION_SITE_URL}${webLocalePath("/contact", "en")}`,
      marketing: `${PRODUCTION_SITE_URL}${webLocalePath("/", "en")}`,
      privacy: `${PRODUCTION_SITE_URL}${webLocalePath("/privacy", "en")}`,
    });
  });

  it("キーワードはカンマ区切りで、空・重複・前後の空白・アプリ名の語を持たない", () => {
    const keywords = readField("keywords.txt").split(",");
    const nameWords = readField("name.txt").toLowerCase().split(/\s+/u);
    expect(
      keywords.filter(
        (keyword) => keyword.trim() !== keyword || keyword === "",
      ),
    ).toEqual([]);
    expect(new Set(keywords.map((keyword) => keyword.toLowerCase())).size).toBe(
      keywords.length,
    );
    expect(
      keywords.filter((keyword) =>
        nameWords.some((word) => containsWord(keyword, word)),
      ),
    ).toEqual([]);
  });

  it("What's New は英語に対応したことを伝える", () => {
    expect(readField("release_notes.txt")).toContain(
      "English is now supported.",
    );
  });

  it("綴り・文法の機械検査（translation-audit）の error が無い", async () => {
    const issues = (
      await Promise.all(
        allTexts().map(([key, text]) => auditEnglishText(key, text)),
      )
    )
      .flat()
      .filter((issue) => issue.severity === "error");
    expect(issues).toEqual([]);
  }, 60_000);
});
