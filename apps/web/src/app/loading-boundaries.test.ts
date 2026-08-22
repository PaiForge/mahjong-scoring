import { existsSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * ローディング境界の不変条件: すべての page.tsx は、祖先に loading.tsx を
 * ちょうど 1 つだけ持つ。
 *
 * - 0 枚だと、動的ルートへのクライアント遷移でプリフェッチに見せるものが無く、
 *   サーバ応答が返るまでクリックが無反応になる
 * - 2 枚以上だと Suspense 境界が入れ子になり、Link のプリフェッチは最も外側の
 *   境界までしか取らないため、内側の個別スケルトンは「速いサーバでは一度も
 *   出ない / 遅いサーバでは本文直前に一瞬だけ出る」状態になる（2026-08 に実測）
 *
 * 境界は「遷移時に新しくマウントされるスロット」に無いとフォールバックが出ない。
 * React は遷移中、既にマウント済みの Suspense のフォールバックを出さないため、
 * 祖先の共通 loading.tsx は同じセグメント内の遷移（/learn → /learn/x 等）で
 * 効かず、クリックが無反応になる（2026-08 に実測）。よって境界は leaf
 * （page.tsx と同じディレクトリか、配下に他の loading.tsx を持たない最小の祖先）に置く。
 * 複数の子を 1 枚で受けたい場合は `PracticeLoading` のように pathname で
 * 振り分ける。
 * index ページだけ固有のスケルトンにしたい場合は、page.tsx と loading.tsx を
 * route group に退避して兄弟ルートの祖先にならないようにする
 * （`mypage/(home)`, `admin/(dashboard)` 参照）。
 */
const APP_DIR = dirname(fileURLToPath(import.meta.url));

function collectPageDirs(dir: string): string[] {
  const pageDirs: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      pageDirs.push(...collectPageDirs(join(dir, entry.name)));
    } else if (entry.name === "page.tsx") {
      pageDirs.push(dir);
    }
  }
  return pageDirs;
}

/** page のディレクトリから src/app までを遡り、loading.tsx を持つディレクトリを返す */
function findLoadingBoundaries(pageDir: string): string[] {
  const boundaries: string[] = [];
  let current = pageDir;
  for (;;) {
    if (existsSync(join(current, "loading.tsx"))) {
      boundaries.push(relative(APP_DIR, join(current, "loading.tsx")));
    }
    if (current === APP_DIR) break;
    current = dirname(current);
  }
  return boundaries;
}

describe("loading.tsx の境界", () => {
  const pageDirs = collectPageDirs(APP_DIR);

  it("page.tsx が見つかる（テスト自体の健全性）", () => {
    expect(pageDirs.length).toBeGreaterThan(0);
  });

  it.each(pageDirs.map((dir) => [relative(APP_DIR, dir) || "."]))(
    "%s は祖先に loading.tsx をちょうど 1 つ持つ",
    (pageRelDir) => {
      const boundaries = findLoadingBoundaries(join(APP_DIR, pageRelDir));
      expect(
        boundaries,
        `loading.tsx は 1 枚だけにする（現在: ${boundaries.length} 枚）`,
      ).toHaveLength(1);
    },
  );
});
