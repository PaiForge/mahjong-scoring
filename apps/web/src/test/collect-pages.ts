import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * App Router の page.tsx を「URL パス → page.tsx のファイルパス」で集める
 * ページ収集
 *
 * ルート構成を検査するテスト（loading 境界・SEO カバレッジ）が、同じ
 * 「ディレクトリ → URL」の対応で page.tsx を引くための唯一の実装。
 * route group（`(user)` 等）と `_` プレフィックスのディレクトリは URL に
 * 現れないので落とす。`dir` 直下の page.tsx は `/` になる。
 *
 * @param dir - `src/app` の絶対パス
 */
export function collectPages(dir: string): Map<string, string> {
  const pages = new Map<string, string>();
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name === "node_modules") continue;
        walk(join(current, entry.name));
      } else if (entry.name === "page.tsx") {
        const segments = relative(dir, current)
          .split(sep)
          .filter(
            (seg) => seg !== "" && !seg.startsWith("(") && !seg.startsWith("_"),
          );
        pages.set(`/${segments.join("/")}`, join(current, "page.tsx"));
      }
    }
  };
  walk(dir);
  return pages;
}
