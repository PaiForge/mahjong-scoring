import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    globals: true,
    server: {
      deps: {
        // 牌画像ライブラリは react-native を import するため、変換対象に含めて
        // 下の alias（web 用 shim）を効かせる。
        inline: [/@pai-forge\/mahjong-react-ui/],
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      // 牌画像ライブラリ（React Native 対応）を web 用 shim へ向ける。
      // next.config.ts の turbopack.resolveAlias と同じ差し替え。
      "react-native": resolve(__dirname, "src/shims/react-native.ts"),
    },
  },
});
