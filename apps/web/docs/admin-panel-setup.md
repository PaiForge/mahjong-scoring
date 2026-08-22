# 管理画面のセットアップ

管理画面（`/admin`）を利用するには、以下のセットアップが必要です。

## 1. 環境変数の追加

`SUPABASE_SERVICE_ROLE_KEY` を `.env.local` に追加します。

```bash
pnpm supabase status -o json
```

| `pnpm supabase status -o json` のフィールド | `.env.local` の変数         | 備考                         |
| ------------------------------------------- | --------------------------- | ---------------------------- |
| `SERVICE_ROLE_KEY`                          | `SUPABASE_SERVICE_ROLE_KEY` | Admin API 用シークレットキー |

> **WARNING**: `NEXT_PUBLIC_` プレフィックスを付けないでください。このキーは RLS をバイパスしてユーザー管理が可能なフルアクセスキーであり、ブラウザに露出させてはいけません。Admin Client は `import 'server-only'` ガードで保護されています。

## 2. マイグレーションの確認

[セットアップ](../README.md#セットアップ)でマイグレーションを実行済みであれば、`user_roles` テーブルは既に作成されています。まだ実行していない場合は `pnpm db:run-migrate` を実行してください。

## 3. 管理者ロールの付与

### 開発用シードを使う（推奨）

```bash
pnpm --filter web db:seed:dev
```

管理者（`admin@example.local`）と一般ユーザー（`user@example.local`）を投入します。
パスワードはどちらも `devpass1`、メール確認済みの状態で作られるのでそのままサインインできます。
何度実行しても既存ユーザーは作り直しません。

DB と Supabase の両方がローカルホストでない場合は実行を拒否するため、
本番環境に対しては使えません。

### 既存のユーザーに付与する

すでに使っているアカウントを管理者にしたい場合は、Supabase Studio（http://127.0.0.1:54323）の
SQL Editor、または psql で以下を実行します:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('<your-user-uuid>', 'admin');
```

`<your-user-uuid>` は `auth.users` テーブルで確認できます。

## 4. 確認

サインアウト → 再サインインし、`/admin` にアクセスして管理画面が表示されることを確認します。
