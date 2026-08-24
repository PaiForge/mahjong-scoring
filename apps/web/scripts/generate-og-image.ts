/**
 * OGP 画像（`public/og-image.png`）を生成する。
 *
 * 実行時に ImageResponse で描くと日本語フォントの埋め込みが必要になり、
 * サーバーレス環境でのフォント取得が失敗要因になるため、静的 PNG を選んだ。
 *
 * `app/opengraph-image.png` の file convention は使わない。ページが自前の
 * `openGraph` を持つと convention 側の画像が消えるため（実測）、
 * createMetadata から明示的に参照できる public/ に置く。
 *
 * サイト名やキャッチコピーを変えたら再実行すること:
 *   pnpm --filter web og:generate
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import messages from "../src/messages/ja.json";

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

/**
 * テキストがカードからはみ出さないことを検証する。
 *
 * SVG の <text> は幅を超えても警告なく描画し続けるため、ja.json の文言を
 * 長くして再生成すると枠外へ silent にはみ出す。全角前提で
 * 「フォントサイズ × 文字数」がカード内の実効幅に収まるかを見る。
 */
function assertTextFits(label: string, text: string, fontSize: number): void {
  const textX = CARD.x + LOGO_SIZE + 112;
  const available = CARD.x + CARD.w - 40 - textX;
  const estimated = text.length * fontSize;
  if (estimated > available) {
    const max = Math.floor(available / fontSize);
    throw new Error(
      `${label}「${text}」(${text.length} 文字) がカードに収まりません` +
        `（${fontSize}px では最大 ${max} 文字）。` +
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
        font-size="88" font-weight="700" fill="${SURFACE_900}">${escapeXml(siteName)}</text>
  <text x="${textX}" y="${HEIGHT / 2 + 56}" font-family="${FONT_STACK}"
        font-size="36" font-weight="400" fill="${SURFACE_600}">${escapeXml(tagline)}</text>
</svg>`;
}

async function main(): Promise<void> {
  const { siteName, siteTagline } = messages.metadata;
  assertTextFits("サイト名", siteName, 88);
  assertTextFits("キャッチコピー", siteTagline, 36);
  const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

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

  const dest = join(webRoot, "public/og-image.png");
  writeFileSync(dest, out);
  console.log(`generated ${dest} (${WIDTH}x${HEIGHT}, ${out.length} bytes)`);
}

main().catch((err) => {
  console.error("OGP image generation failed:", err);
  process.exit(1);
});
