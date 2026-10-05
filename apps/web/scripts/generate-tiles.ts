/**
 * 牌画像（`public/tiles/*.webp`）を @pai-forge/mahjong-react-ui 同梱の PNG から生成する。
 *
 * 牌は `TileImageProvider`（`src/app/_contexts/tile-image-context.tsx`）経由で
 * この静的ファイルを参照する。同梱の data URI をそのまま描くと、牌を並べる
 * ページの HTML に画像本体が埋め込まれて 1〜5MB になり、キャッシュにも乗らない
 * （2026-09 に本番で実測）。
 *
 * 同梱の PNG は 600×800 で、表示は最大でも xl の 72×101px。高 DPI でも足りる
 * 2 倍の 144×192 に縮小し、WebP にする（1 枚 20〜80KB → 数 KB）。
 *
 * パッケージを更新して牌の絵柄が変わったら再実行すること:
 *   pnpm --filter web tiles:generate
 * `src/app/tile-assets.test.ts` が、生成物がパッケージの牌一覧と揃っていることを検査する。
 */
import { mkdirSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

/** 表示サイズ xl（72×101）の 2 倍。縦横比は同梱画像と同じ 3:4 */
const TILE_WIDTH = 144;
const TILE_HEIGHT = 192;

const require = createRequire(import.meta.url);
// exports の "./assets/*" を通して同梱ディレクトリを引く（パッケージ本体は
// react-native を import するため node では読み込めない）
const sourceDir = dirname(
  require.resolve("@pai-forge/mahjong-react-ui/assets/tiles/Back.png"),
);
const outDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "tiles",
);

async function main(): Promise<void> {
  mkdirSync(outDir, { recursive: true });
  const sources = readdirSync(sourceDir).filter((name) =>
    name.endsWith(".png"),
  );
  for (const name of sources) {
    const outName = name.replace(/\.png$/, ".webp");
    await sharp(join(sourceDir, name))
      .resize(TILE_WIDTH, TILE_HEIGHT)
      .webp({ quality: 85 })
      .toFile(join(outDir, outName));
  }
  console.log(`generated ${sources.length} tiles in public/tiles/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
