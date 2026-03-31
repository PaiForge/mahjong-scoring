# Mahjong Scoring

麻雀の点数計算を学習するアプリ。

[Turborepo](https://turbo.build/) で管理する Monorepo 構成です。

## ディレクトリ構成

- `apps/web` — Next.js Web アプリケーション
- `packages/core` — UI 非依存の共有ドメインロジック
- `packages/eslint-config` — 共有 ESLint 設定
- `docs/` — [PaiForge/docs](https://github.com/PaiForge/docs)（git submodule — コーディング規約等）

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
git clone --recurse-submodules https://github.com/PaiForge/mahjong-scoring.git
cd mahjong-scoring
```

既にクローン済みで submodule が未取得の場合:

```bash
git submodule update --init --recursive
```

### インストール

```bash
pnpm install
```

### 開発サーバーの起動

```bash
pnpm dev
```

### スクリプト一覧

| コマンド | 説明 |
|---|---|
| `pnpm dev` | 全アプリを開発モードで起動 |
| `pnpm build` | 全アプリをビルド |
| `pnpm lint` | リント実行 |
| `pnpm typecheck` | 型チェック |
| `pnpm test` | テスト実行 |
| `pnpm format` | Prettier でフォーマット |

## コーディング規約

コーディング規約は `docs/` submodule で一元管理されています。

- [docs/coding-standards.md](docs/coding-standards.md)
- [docs/extended-mspz.md](docs/extended-mspz.md)

submodule を最新に更新するには:

```bash
git submodule update --remote docs
```

## バージョニング

[Semantic Versioning](https://semver.org/) に従います。

### Git タグ形式

Git タグはアプリケーションごとにプレフィックスを付与します:

- **Web**: `web/v0.1.0`, `web/v0.2.0`, ...
- **Mobile**: `mobile/v0.1.0`, `mobile/v0.2.0`, ...（予定）
