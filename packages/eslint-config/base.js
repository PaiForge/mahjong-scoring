import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

/**
 * Shared base ESLint configuration.
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
