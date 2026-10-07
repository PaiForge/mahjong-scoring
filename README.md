# Mahjong Scoring

麻雀の点数計算を学習するアプリ。

[Turborepo](https://turbo.build/) で管理する Monorepo 構成です。

## ディレクトリ構成

- `apps/web` — Next.js Web アプリケーション
- `apps/mobile` — Expo（React Native）モバイルアプリケーション
- `packages/core` — UI 非依存の共有ドメインロジック
- `packages/features` — web とモバイルで共有するアプリのロジック
- `packages/messages` — i18n 辞書（web とモバイルで共有）
- `packages/eslint-config` — 共有 ESLint 設定

## セットアップ

### 前提条件

- Node.js 24.x
- pnpm 10.x

> [!TIP]
> [Volta](https://volta.sh/) を導入済みであれば、`package.json` に定義された Node.js バージョンへ自動的に切り替わります。
>
> ```bash
> volta pin node@24
> volta install pnpm@10
> ```

### クローン

```bash
git clone https://github.com/PaiForge/mahjong-scoring.git
cd mahjong-scoring
```

### インストール

```bash
pnpm install
```

### 開発サーバーの起動

```bash
pnpm dev
```

### モバイルアプリの起動

```bash
pnpm --filter @mahjong-scoring/mobile start   # Expo の開発サーバー（Expo Go / シミュレーターで開く）
pnpm --filter @mahjong-scoring/mobile ios     # iOS シミュレーター
pnpm --filter @mahjong-scoring/mobile android # Android エミュレーター
pnpm --filter @mahjong-scoring/mobile web     # ブラウザで確認（画面確認用）
```

### スクリプト一覧

| コマンド            | 説明                                      |
| ------------------- | ----------------------------------------- |
| `pnpm dev`          | 全アプリを開発モードで起動                |
| `pnpm build`        | 全アプリをビルド                          |
| `pnpm lint`         | リント実行                                |
| `pnpm typecheck`    | 型チェック                                |
| `pnpm test`         | テスト実行                                |
| `pnpm format`       | Prettier でフォーマット                   |
| `pnpm format:check` | Prettier の整形漏れを検査（書き換えない） |

## コーディング規約

コーディング規約と牌の表記法は、PaiForge の別リポジトリで一元管理しています。

- コーディング規約: [PaiForge/docs](https://github.com/PaiForge/docs)（https://raw.githubusercontent.com/PaiForge/docs/0b464878e4e24b6b8c154d90f96e1657e212ddaa/coding-standards.md）
- 牌の表記法 Extended MPSZ: [PaiForge/extended-mpsz](https://github.com/PaiForge/extended-mpsz)（https://raw.githubusercontent.com/PaiForge/extended-mpsz/72ee9ede74583d58587bc8c6ed36166bb808b5bd/SPEC.md）

URL はコミット SHA で固定しています。共有文書を更新したら、CLAUDE.md・`.github/claude/system-prompt.md`・この README の SHA を差し替えてください。

## バージョニング

[Semantic Versioning](https://semver.org/) に従います。

### Git タグ形式

Git タグはアプリケーションごとにプレフィックスを付与します:

- **Web**: `web/v0.1.0`, `web/v0.2.0`, ...
- **Mobile**: `mobile/v0.1.0`, `mobile/v0.2.0`, ...（予定）
