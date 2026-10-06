import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { config as baseConfig } from "./base.js";

/**
 * React アプリ（Expo のモバイル）の設定
 *
 * @remarks
 * eslint-plugin-react は ESLint 10 で動かない（`context.getFilename` が無い）
 * ため含めない。web（`next.js`）と同じく React フックの recommended 一式
 * （React Compiler 由来のルールを含む）だけを当てる。
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const reactConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
    },
  },
];
