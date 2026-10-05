/* eslint-disable @typescript-eslint/no-require-imports */
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// モノレポ全体（packages/* の共有コード）を監視対象にする
config.watchFolders = [workspaceRoot];

// pnpm の node_modules をアプリ → ワークスペースルートの順で引く
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Claude Code が .claude/worktrees/ に作る別ブランチのチェックアウトを Metro から外す。
// watchFolders がワークスペースルート全体を含むため、外さないと別ブランチの
// 作業中のコードを解決して dev サーバーに混ぜてしまう
config.resolver.blockList = [
  ...[config.resolver.blockList].flat().filter(Boolean),
  /\/\.claude\/worktrees\/.*/,
  /\/apps\/web\/\.next\/.*/,
];

// web で zustand を CommonJS 版に解決する。zustand の exports は "import" 条件で
// ESM 版（esm/*.mjs）を返し、その middleware は `import.meta.env` を読む。Metro の
// web バンドルは ES モジュールではないため "Cannot use 'import.meta' outside a
// module" で落ちる。iOS / Android は "react-native" 条件で CommonJS 版に解決される
// ので、web だけ同じ条件で引き直す（web は画面確認用のターゲット）
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  if (platform === "web" && /^zustand(\/|$)/.test(moduleName)) {
    return resolve(
      {
        ...context,
        unstable_conditionNames: ["react-native", "require", "default"],
      },
      moduleName,
      platform,
    );
  }
  return resolve(context, moduleName, platform);
};

// Hermes と Expo の winter runtime の食い違いを埋める polyfill を全モジュールより先に読む
const defaultGetPolyfills = config.serializer.getPolyfills;
config.serializer.getPolyfills = (options) => {
  return [
    path.resolve(projectRoot, "polyfill.js"),
    ...defaultGetPolyfills(options),
  ];
};

module.exports = config;
