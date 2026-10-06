import { defineConfig } from "vitest/config";

/**
 * モバイルの単体テスト
 *
 * 画面（React Native のコンポーネント）は Metro と実機の描画に依存するため
 * ここでは扱わず、src/ の純粋なモジュールだけを Node で検査する。
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
