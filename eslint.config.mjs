import { config as baseConfig } from "@mahjong-scoring/eslint-config/base";
import { nextJsConfig } from "@mahjong-scoring/eslint-config/next";
import { reactConfig } from "@mahjong-scoring/eslint-config/react";

/** @type {import("eslint").Linter.Config} */
export default [
  ...baseConfig,
  ...nextJsConfig.map((config) => ({
    ...config,
    files: ["apps/web/**/*.{js,jsx,ts,tsx}"],
  })),
  ...reactConfig.map((config) => ({
    ...config,
    files: ["apps/mobile/**/*.{js,jsx,ts,tsx}"],
  })),
  {
    ignores: [
      "apps/web/.next/**",
      // supabase start が生成する作業ディレクトリ（バンドル済みの edge runtime を含む）
      "**/supabase/.temp/**",
      "**/dist/**",
      "**/node_modules/**",
    ],
  },
];
