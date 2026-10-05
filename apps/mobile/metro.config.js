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

// Hermes と Expo の winter runtime の食い違いを埋める polyfill を全モジュールより先に読む
const defaultGetPolyfills = config.serializer.getPolyfills;
config.serializer.getPolyfills = (options) => {
  return [
    path.resolve(projectRoot, "polyfill.js"),
    ...defaultGetPolyfills(options),
  ];
};

module.exports = config;
