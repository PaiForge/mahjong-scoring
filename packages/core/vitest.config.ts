import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globals: true,
    // 出題ジェネレータの統計的テスト（数万回試行のサンプリング）は単体では
    // 1〜3秒だが、turbo で web のテストと並走すると CPU を分け合って既定の
    // 5秒を超え、負荷起因で flake する。テスト自体は試行回数で打ち切られる
    // ため、時間の上限は余裕を持たせる
    testTimeout: 30_000,
  },
});
