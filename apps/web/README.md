# @mahjong-scoring/web

麻雀の点数計算を学習する Next.js Web アプリケーション。

## クイックスタート

### 前提条件

- Node.js 24.x
- pnpm 10.x
- Docker（Supabase CLI に必要）
- [Supabase CLI](https://supabase.com/docs/guides/local-development)

### セットアップ

```bash
# 依存パッケージのインストール（モノレポのルートで実行）
pnpm install

# Supabase ローカル環境の起動（初回は Docker イメージのダウンロードが行われます）
supabase start
```

`supabase start` 完了後、`supabase status -o json` を実行して API キーを取得します。取得した値を `.env.local` にコピーしてください:

```bash
supabase status -o json
cp .env.example .env.local
```

| `supabase status -o json` のフィールド | `.env.local` の変数              | 備考                                          |
| -------------------------------------- | ------------------------------- | --------------------------------------------- |
| `PUBLISHABLE_KEY`                      | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ブラウザクライアントで使用する公開キー          |
| `API_URL`                              | `NEXT_PUBLIC_SUPABASE_URL`      | デフォルト値は `http://127.0.0.1:54321`        |
| —                                      | `POSTGRES_URL`                  | ローカル開発ではデフォルト値が使われるため設定不要 |

> **ヒント:** これらの値は `supabase start` の出力にも表示されます（"Authentication Keys" の Publishable と "APIs" の Project URL）。

```bash
# データベースマイグレーションの実行
pnpm db:run-migrate
```

> **注意:** `drizzle-kit push` ではなく `pnpm db:run-migrate` を使用してください。`db:run-migrate` は Drizzle マイグレーションに加えて、Supabase 固有の SQL（RLS ポリシー、外部キー制約等）も適用します。

```bash
# 開発サーバーの起動
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて動作を確認してください。

## ローカル開発

### Google OAuth の設定（Google サインイン用）

Google サインインをローカルでテストするには、OAuth 認証情報の設定が必要です。詳細は [docs/authentication-setup.md](docs/authentication-setup.md) を参照してください。

### 管理画面のセットアップ

管理画面（`/admin`）を利用するにはセットアップが必要です。詳細は [docs/admin-panel-setup.md](docs/admin-panel-setup.md) を参照してください。

### ローカルサービス

- **Supabase Studio**: http://127.0.0.1:54323
- **Inbucket（メールテスト用）**: http://127.0.0.1:54324
- **PostgreSQL**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Supabase を停止するには:

```bash
supabase stop
```

## デプロイ

Vercel にデプロイされます。Vercel プロジェクト設定、Supabase Integration、環境変数については [docs/deployment.md](docs/deployment.md) を参照してください。

## 技術スタック

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS v4
- React 19
- Supabase (Auth, PostgreSQL)
- next-intl (i18n)
- Vitest（ユニットテスト）
