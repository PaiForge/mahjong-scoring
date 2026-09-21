import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { TILE_IMAGE_FILE_NAMES } from "@pai-forge/mahjong-react-ui";
import { describe, expect, it } from "vitest";

/**
 * 牌画像の不変条件: `public/tiles/` には、パッケージが定義する牌の種類
 * （34 種 + 裏面）ぶんの WebP がちょうどある。
 *
 * `AppTileImageProvider` はパッケージのファイル名表から `/tiles/<name>.webp` を
 * 組み立てるだけで、ファイルの有無は見ない。パッケージを更新して牌が増減したり、
 * 生成し忘れたりすると、牌が壊れた画像として出る。
 * 直すには `pnpm --filter web tiles:generate` を実行する。
 */
const TILES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../public/tiles",
);

describe("public/tiles", () => {
  const expected = Object.values(TILE_IMAGE_FILE_NAMES).map((name) =>
    name.replace(/\.png$/, ".webp"),
  );

  it("パッケージの牌ごとに WebP がある", () => {
    for (const name of expected) {
      expect(existsSync(join(TILES_DIR, name)), `${name} が無い`).toBe(true);
    }
  });

  it("パッケージに無い牌の画像が残っていない", () => {
    const actual = readdirSync(TILES_DIR).filter((name) =>
      name.endsWith(".webp"),
    );
    expect(actual.sort()).toEqual([...expected].sort());
  });
});
