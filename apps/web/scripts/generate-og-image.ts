/**
 * OGP 画像（日本語 `public/og-image.png`・英語 `public/og-image-en.png`）を生成する。
 *
 * 実行時に ImageResponse で描くと日本語フォントの埋め込みが必要になり、
 * サーバーレス環境でのフォント取得が失敗要因になるため、静的 PNG を選んだ。
 *
 * `app/opengraph-image.png` の file convention は使わない。ページが自前の
 * `openGraph` を持つと convention 側の画像が消えるため（実測）、
 * createMetadata から明示的に参照できる public/ に置く。
 *
 * 言語ごとに文言を焼き込んだ別のファイルを持つ（英語のページが日本語の
 * キャッチコピーの画像を出さないように）。英語でもサイト名は日本語のブランド名
 * のまま（辞書の `metadata.siteName`）で、キャッチコピーだけが英語になる。
 * ファイル名は `src/app/_lib/metadata.ts` の `OG_IMAGE_PATHS` と揃える
 * （`metadata.test.ts` が各言語の画像の実在と寸法を検査する）。
 *
 * サイト名やキャッチコピーを変えたら再実行すること:
 *   pnpm --filter web og:generate                 # 全言語
 *   pnpm --filter web og:generate -- --locale en  # 英語だけ（日本語の画像に触れない）
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

/** 生成する言語ごとの文言と出力先（`webRoot` からの相対パス） */
const TARGETS = {
  ja: { metadata: jaMessages.metadata, dest: "public/og-image.png" },
  en: { metadata: enMessages.metadata, dest: "public/og-image-en.png" },
} as const;

type TargetLocale = keyof typeof TARGETS;

function isTargetLocale(value: string): value is TargetLocale {
  return Object.hasOwn(TARGETS, value);
}

/** OGP の推奨サイズ（Twitter の summary_large_image もこの比率） */
const WIDTH = 1200;
const HEIGHT = 630;

/** globals.css の @theme と揃える。ここを直接いじらず globals.css を正典にする。 */
const PRIMARY_500 = "#00904a";
const PRIMARY_700 = "#006833";
const INK = "#2f6b4f";
const SURFACE_600 = "#475569";
const SURFACE_900 = "#0f172a";

/** 日本語が豆腐にならないよう、macOS / Linux 双方の実在フォントを並べる */
const FONT_STACK =
  "Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans JP, Noto Sans CJK JP, sans-serif";

const CARD = { x: 64, y: 64, w: WIDTH - 128, h: HEIGHT - 128, r: 32 } as const;
const SHADOW_OFFSET = 12;
const LOGO_SIZE = 220;
/** サイト名「麻雀点数計算教室」（8 文字）がカードの実効幅 700px に収まる大きさ */
const SITE_NAME_FONT_SIZE = 80;
const TAGLINE_FONT_SIZE = 36;

function escapeXml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c] ?? c,
  );
}

/** 全角（CJK・全角記号）の文字か。幅の見積もりで 1em と数える */
function isFullWidth(char: string): boolean {
  return /[\u3000-\u9fff\uf900-\ufaff\uff00-\uffef]/u.test(char);
}

/**
 * テキストの描画幅を見積もる
 *
 * 全角の文字は 1em。それ以外（英数字・半角記号・空白）は 1em とすると英語の
 * キャッチコピーが常に収まらない判定になるため、プロポーショナルな欧文の
 * 平均より広めの 0.62em で数える（大文字の多い文言でも過小評価しにくい値）。
 * 日本語だけの文言では「フォントサイズ × 文字数」になり、従来の判定と同じ。
 */
function estimateTextWidth(text: string, fontSize: number): number {
  return [...text].reduce(
    (width, char) => width + fontSize * (isFullWidth(char) ? 1 : 0.62),
    0,
  );
}

/**
 * テキストがカードからはみ出さないことを検証する。
 *
 * SVG の <text> は幅を超えても警告なく描画し続けるため、辞書の文言を
 * 長くして再生成すると枠外へ silent にはみ出す。見積もりの幅
 * （{@link estimateTextWidth}）がカード内の実効幅に収まるかを見る。
 */
function assertTextFits(label: string, text: string, fontSize: number): void {
  const textX = CARD.x + LOGO_SIZE + 112;
  const available = CARD.x + CARD.w - 40 - textX;
  const estimated = estimateTextWidth(text, fontSize);
  if (estimated > available) {
    throw new Error(
      `${label}「${text}」(推定 ${Math.ceil(estimated)}px) がカードに収まりません` +
        `（${fontSize}px で実効幅 ${available}px）。` +
        "文言を短くするか、scripts/generate-og-image.ts のレイアウトを調整してください。",
    );
  }
}

function buildBackgroundSvg(siteName: string, tagline: string): string {
  const textX = CARD.x + LOGO_SIZE + 112;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${PRIMARY_500}"/>
      <stop offset="100%" stop-color="${PRIMARY_700}"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect x="${CARD.x + SHADOW_OFFSET}" y="${CARD.y + SHADOW_OFFSET}"
        width="${CARD.w}" height="${CARD.h}" rx="${CARD.r}" fill="${INK}"/>
  <rect x="${CARD.x}" y="${CARD.y}" width="${CARD.w}" height="${CARD.h}"
        rx="${CARD.r}" fill="#ffffff" stroke="${INK}" stroke-width="6"/>
  <text x="${textX}" y="${HEIGHT / 2 - 16}" font-family="${FONT_STACK}"
        font-size="${SITE_NAME_FONT_SIZE}" font-weight="700" fill="${SURFACE_900}">${escapeXml(siteName)}</text>
  <text x="${textX}" y="${HEIGHT / 2 + 56}" font-family="${FONT_STACK}"
        font-size="${TAGLINE_FONT_SIZE}" font-weight="400" fill="${SURFACE_600}">${escapeXml(tagline)}</text>
</svg>`;
}

/**
 * コマンドライン引数から生成する言語を決める
 *
 * `--locale <ja|en>`（または `--locale=<ja|en>`）で 1 言語だけ。省略時は全言語。
 * 英語だけを足し直すときに日本語の画像を書き換えない（バイト一致のまま残す）ため。
 */
function parseTargetLocales(argv: readonly string[]): readonly TargetLocale[] {
  const index = argv.findIndex(
    (arg) => arg === "--locale" || arg.startsWith("--locale="),
  );
  if (index === -1) return Object.keys(TARGETS).filter(isTargetLocale);
  const flag = argv[index] ?? "";
  const value = flag.includes("=")
    ? flag.slice(flag.indexOf("=") + 1)
    : argv[index + 1];
  if (value === undefined || !isTargetLocale(value)) {
    throw new Error(
      `--locale には ${Object.keys(TARGETS).join(" / ")} のいずれかを指定してください（指定: ${String(value)}）`,
    );
  }
  return [value];
}

async function generate(webRoot: string, locale: TargetLocale): Promise<void> {
  const { metadata, dest: relativeDest } = TARGETS[locale];
  const { siteName, siteTagline } = metadata;
  assertTextFits("サイト名", siteName, SITE_NAME_FONT_SIZE);
  assertTextFits("キャッチコピー", siteTagline, TAGLINE_FONT_SIZE);

  const background = await sharp(
    Buffer.from(buildBackgroundSvg(siteName, siteTagline)),
  )
    .png()
    .toBuffer();

  const logo = await sharp(readFileSync(join(webRoot, "public/logo.png")))
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: "contain" })
    .png()
    .toBuffer();

  const out = await sharp(background)
    .composite([
      {
        input: logo,
        left: CARD.x + 72,
        top: Math.round((HEIGHT - LOGO_SIZE) / 2),
      },
    ])
    .png()
    .toBuffer();

  const dest = join(webRoot, relativeDest);
  writeFileSync(dest, out);
  console.log(`generated ${dest} (${WIDTH}x${HEIGHT}, ${out.length} bytes)`);
}

async function main(): Promise<void> {
  const locales = parseTargetLocales(process.argv.slice(2));
  const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
  for (const locale of locales) {
    await generate(webRoot, locale);
  }
}

main().catch((err) => {
  console.error("OGP image generation failed:", err);
  process.exit(1);
});
