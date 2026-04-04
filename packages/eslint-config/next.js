import nextPlugin from "@next/eslint-plugin-next";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import { config as baseConfig } from "./base.js";

export const nextJsConfig = [
  ...baseConfig,
  {
    plugins: {
      "@next/next": nextPlugin,
      react: pluginReact,
      "react-hooks": pluginReactHooks,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...pluginReactHooks.configs.recommended.rules,
    },
  },
];
