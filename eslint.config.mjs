import { config as baseConfig } from "@mahjong-scoring/eslint-config/base";
import { nextJsConfig } from "@mahjong-scoring/eslint-config/next";
import { reactConfig } from "@mahjong-scoring/eslint-config/react";

/**
 * 共有設定の各項目をディレクトリ配下に限定する
 *
 * 既に `files` を持つ項目（テストファイルだけ型アサーション禁止を解除する
 * 緩和など）は、その範囲をディレクトリ配下に絞る。`files` を一律に
 * 上書きすると、テスト専用の緩和がディレクトリ全体に広がってしまう
 * （以前はそうなっていて、apps/web では型アサーション禁止が効いていなかった）。
 *
 * @param {string} dir - 限定先のディレクトリ
 * @returns {(config: import("eslint").Linter.Config) => import("eslint").Linter.Config}
 */
const scopeTo = (dir) => (config) => ({
  ...config,
  files: config.files
    ? config.files.map((pattern) => `${dir}/${pattern}`)
    : [`${dir}/**/*.{js,jsx,ts,tsx}`],
});

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  ...nextJsConfig.map(scopeTo("apps/web")),
  ...reactConfig.map(scopeTo("apps/mobile")),
  {
    // CommonJS で書かれた設定ファイル（postcss 等）。`module` / `require` を
    // 未定義扱いにしない
    files: ["apps/web/*.config.js"],
    languageOptions: { sourceType: "commonjs" },
  },
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
