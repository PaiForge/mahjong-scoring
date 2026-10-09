import { config as baseConfig } from "@mahjong-scoring/eslint-config/base";
import { reactHooksConfig } from "@mahjong-scoring/eslint-config/hooks";
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
  ...reactHooksConfig.map(scopeTo("packages/features")),
  {
    // features は web（サーバーコンポーネントを含む）とモバイルの両方から
    // ファイル単位で import される。React・zustand・use-intl に触れてよいのは
    // フック・ストアのファイル（`use-*.ts`）だけにして、それ以外の純粋な
    // モジュールはサーバーでも Node のテストでもそのまま読めるようにする。
    // フックのファイルを純粋なモジュールから import することも同じ理由で禁じる
    files: ["packages/features/src/**/*.ts"],
    ignores: [
      "packages/features/src/**/use-*.ts",
      "packages/features/src/**/*.test.ts",
      "packages/features/src/test/**",
    ],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: ["react", "zustand", "zustand/middleware", "use-intl"].map(
            (name) => ({
              name,
              allowTypeImports: true,
              message:
                "React・zustand・use-intl を使うコードは use-*.ts（フック・ストア）に置く",
            }),
          ),
          patterns: [
            {
              regex: "(^|/)use-[^/]+$",
              allowTypeImports: true,
              message:
                "純粋なモジュールからフック（use-*.ts）を import しない。フック側から純粋なモジュールを使う",
            },
          ],
        },
      ],
    },
  },
  {
    // 牌の並び（理牌）の順を決めるのは riichi-mahjong だけにする。牌種 ID は
    // 数値なので `(a, b) => a - b` でも並ぶが、それを許すと牌の順の定義が
    // アプリのあちこちに散り、赤 5 のような ID の大小と一致しない牌で
    // 並びが食い違う。型情報を使わない lint では配列が牌かどうかを見分け
    // られないため、要素どうしを引き算するだけの比較関数そのものを禁じ、
    // 牌は sortHaiCodes / compareHaiCode、数値は compareNumbers と、何を
    // 並べているかを呼び出し側に書かせる
    files: ["**/*.{js,jsx,ts,tsx,mts}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name=/^(sort|toSorted)$/] > ArrowFunctionExpression[params.length=2][body.type='BinaryExpression'][body.operator='-'][body.left.type='Identifier'][body.right.type='Identifier']",
          message:
            "牌は sortHaiCodes / compareHaiCode（理牌の順）、数値は compareNumbers で並べる",
        },
      ],
    },
  },
  {
    // CommonJS で書かれた設定ファイル（postcss・Metro・Babel 等）。`module` /
    // `require` を未定義扱いにしない
    files: [
      "apps/web/*.config.js",
      "apps/mobile/*.config.js",
      "apps/mobile/index.js",
    ],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
      },
    },
  },
  {
    ignores: [
      "apps/web/.next/**",
      "apps/mobile/.expo/**",
      // supabase start が生成する作業ディレクトリ（バンドル済みの edge runtime を含む）
      "**/supabase/.temp/**",
      "**/dist/**",
      "**/node_modules/**",
    ],
  },
];
