# デプロイ

## Vercel

このアプリは [Vercel](https://vercel.com/) にデプロイされます。リポジトリは Turborepo モノレポのため、Vercel プロジェクトを以下のように設定してください:

| 設定項目           | 値         |
| ----------------- | --------- |
| Framework Preset  | Next.js   |
| Root Directory    | `apps/web` |

## Supabase の設定

### Supabase プロジェクトの作成

本番用の Supabase プロジェクトを事前に作成しておく必要があります。

1. [Supabase Dashboard](https://supabase.com/dashboard/new/<org-id>) から新規プロジェクトを作成する
2. 作成したプロジェクトを、次の手順（Vercel Marketplace Integration）で連携する

| 設定項目            | 値                              | 理由                                                        |
| ------------------ | ------------------------------ | ----------------------------------------------------------- |
| Region             | Northeast Asia (Tokyo)          | ユーザーの大半が日本在住。Vercel のデプロイリージョン (hnd1) とも近接 |
| Enable Data API    | **オフ**                        | データアクセスは Drizzle ORM で直接 PostgreSQL に接続しており、PostgREST（Data API）は使用しない。Supabase クライアントは認証（`supabase.auth.*`）のみに利用。不要な API エンドポイントを無効化することで攻撃対象面を減らせる |

> **ヒント:** Database Password を控える必要はありません。Vercel Supabase Integration 経由で `POSTGRES_URL` 等の接続情報が自動設定されます。

### Vercel Marketplace 経由（推奨）

Supabase Integration はアカウント（チーム）レベルでインストールされます。すでに他のプロジェクトで導入済みかどうかで手順が異なります。

#### 初回（Integration 未インストールの場合）

1. Vercel Dashboard → 対象プロジェクト → **Settings** → **Integrations** → **Browse Marketplace** を開く
2. 「Supabase」を検索し **Add Integration** をクリック
3. Supabase アカウントを接続し、使用する Supabase プロジェクトを選択（または新規作成）

#### 既存 Integration にプロジェクトを追加する場合

1. Vercel Dashboard → **Settings** → **Integrations**（`https://vercel.com/<team>/~/integrations`）を開く
2. Supabase の **「Manage Access」** をクリック → モーダルで対象の Vercel プロジェクトにアクセス権を付与
3. **「Configure」** をクリック → Supabase 側の管理画面に遷移
4. **「Add new project connection」** で Vercel プロジェクトと Supabase プロジェクトを紐付ける

#### 自動設定される環境変数

いずれの手順でも、接続が完了すると以下の環境変数が対象の Vercel プロジェクトに自動同期されます:

- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- その他 Supabase 関連の変数

> **ヒント:** Vercel Marketplace の Supabase Integration により `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` が自動設定されます。

## マイグレーションの自動実行

`prebuild` スクリプトにより、Vercel ビルド時にデータベースマイグレーションが自動実行されます。`POSTGRES_URL_NON_POOLING`、`POSTGRES_URL`、`DATABASE_URL` のいずれかの環境変数が設定されている場合にマイグレーションが実行され、未設定の場合はスキップされます。

## 環境変数

| 変数名                            | 説明                                                                                                  | 必須                   | 備考 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`       | Supabase プロジェクト URL（例: `https://<reference-id>.supabase.co`）                                  | はい                   | Integration で自動設定 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 公開（publishable）キー                                                                       | はい                   | Integration で自動設定 |
| `SUPABASE_SERVICE_ROLE_KEY`      | Supabase サービスロールキー（Admin API アクセス用）。[管理画面のセットアップ](admin-panel-setup.md)を参照。 | はい                   | Integration で自動設定 |
| `POSTGRES_URL`                   | PostgreSQL 接続 URL（プーリング経由）                                                                    | はい                   | Integration で自動設定 |
| `POSTGRES_URL_NON_POOLING`       | PostgreSQL 接続 URL（直接接続、マイグレーション用）                                                        | はい                   | Integration で自動設定 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`  | Google Analytics 4 測定 ID（例: `G-XXXXXXXXXX`）。設定時のみ GA スクリプトが読み込まれます。                | いいえ（本番環境のみ）   | — |
