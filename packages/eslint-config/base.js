import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

/**
 * Shared base ESLint configuration.
 *
 * @remarks
 * このパッケージは devDependencies で `typescript` を
 * `npm:@typescript/typescript6` にエイリアスしている。typescript-eslint は
 * TypeScript 7 を実行時に明示的に拒否する（`does not support TS 7.0`）ため、
 * アプリ側が TypeScript 7 を使いつつ lint を動かすには、typescript-eslint が
 * 解決する `typescript` だけを 6 系に固定する必要がある。
 *
 * この固定を外すと peer が TypeScript 7 に解決され lint 全体が起動しなくなる。
 * typescript-eslint が TS7 を peerDependencies で受け入れたら不要になる。
 * 追跡: typescript-eslint#10940
 *
 * 型情報を使うルール（`parserOptions.project` / `*-type-checked`）は
 * 使っていないため、パーサが TS6 でも lint 結果は変わらない。
 *
 * Includes PaiForge coding standards:
 * - No `null` (use `undefined`)
 * - No variable shadowing
 * - No `as` type assertions (except in test files)
 * - No wrapper types (String, Number, etc.)
 * - Prefer `interface` over `type` for object definitions
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  {
    rules: {
      // --- typescript-eslint rules ---

      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],

      // No variable shadowing
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "error",

      // No `as` type assertions (enforced via consistent-type-assertions)
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],

      // Prefer `interface` over `type` for object definitions
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],

      // No wrapper types (String, Number, Boolean, Symbol, Object)
      "@typescript-eslint/no-wrapper-object-types": "error",
    },
  },
  // Allow `as` assertions in test files
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": "off",
    },
  },
  {
    ignores: ["dist/**"],
  },
];
