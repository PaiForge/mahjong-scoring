import pluginReactHooks from "eslint-plugin-react-hooks";

/**
 * React フックのルールだけを足す設定（JSX を持たないパッケージ用）
 *
 * @remarks
 * `react.js` は eslint-plugin-react を含むが、同プラグインは ESLint 10 で
 * 動かない（`context.getFilename` が無い）。フックだけを書くパッケージ
 * （features）にはこちらを当てる。ルールは web（`next.js`）と同じ
 * recommended 一式。
 *
 * base の設定は含まない。呼び出し側で base と組み合わせること。
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const reactHooksConfig = [
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
    },
  },
];
