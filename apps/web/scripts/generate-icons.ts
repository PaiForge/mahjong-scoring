/**
 * ファビコン一式（`src/app/` の Next file convention）を `public/logo.png` から生成する。
 *
 * - `favicon.ico` … 16 / 32 / 48px を束ねた ICO。`/favicon.ico` を直接見にくる
 *   クローラやブックマーク向け。sharp は ICO 出力を持たないため自前で束ねる。
 * - `icon.png` … 通常のタブアイコン（`<link rel="icon">`）。
 * - `apple-icon.png` … iOS のホーム画面追加用（180px 固定）。
 *
 * ロゴを差し替えたら再実行すること:
 *   pnpm --filter web icons:generate
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

/** ICO に束ねるサイズ。48px までで Windows のタスクバーまで賄える。 */
const ICO_SIZES = [16, 32, 48] as const;
/** `<link rel="icon">` 用。高 DPI のタブでも潰れない大きさにする。 */
const ICON_SIZE = 192;
/** Apple のホーム画面アイコンは 180px が標準 */
const APPLE_ICON_SIZE = 180;

/**
 * PNG を ICO コンテナに束ねる。
 *
 * ICO は「6 バイトのヘッダ + 16 バイト × 枚数のディレクトリ + 各画像データ」。
 * Vista 以降は各エントリに PNG をそのまま入れてよいので BMP 変換は不要。
 */
function buildIco(images: readonly { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(16 * images.length);
  let offset = header.length + directory.length;

  images.forEach(({ size, data }, i) => {
    const at = 16 * i;
    // 256px は 0 で表す仕様。ここでは 48px までなのでそのまま入る。
    directory.writeUInt8(size >= 256 ? 0 : size, at);
    directory.writeUInt8(size >= 256 ? 0 : size, at + 1);
    directory.writeUInt8(0, at + 2); // パレット数（true color なので 0）
    directory.writeUInt8(0, at + 3); // reserved
    directory.writeUInt16LE(1, at + 4); // color planes
    directory.writeUInt16LE(32, at + 6); // bits per pixel
    directory.writeUInt32LE(data.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });

  return Buffer.concat([header, directory, ...images.map((i) => i.data)]);
}

async function main(): Promise<void> {
  const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
  const source = readFileSync(join(webRoot, "public/logo.png"));

  const render = (size: number): Promise<Buffer> =>
    sharp(source)
      .resize(size, size, {
        fit: "contain",
        // 既定の背景は不透明の黒。非正方のロゴに差し替えて再実行したとき
        // レターボックスが黒帯にならないよう、余白は透明で埋める。
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

  const icoEntries = await Promise.all(
    ICO_SIZES.map(async (size) => ({ size, data: await render(size) })),
  );

  const outputs: readonly [string, Buffer][] = [
    [join(webRoot, "src/app/favicon.ico"), buildIco(icoEntries)],
    [join(webRoot, "src/app/icon.png"), await render(ICON_SIZE)],
    [join(webRoot, "src/app/apple-icon.png"), await render(APPLE_ICON_SIZE)],
  ];

  for (const [dest, data] of outputs) {
    writeFileSync(dest, data);
    console.log(`generated ${dest} (${data.length} bytes)`);
  }
}

main().catch((err) => {
  console.error("Icon generation failed:", err);
  process.exit(1);
});
