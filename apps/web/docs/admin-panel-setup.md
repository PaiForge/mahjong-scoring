# 管理画面のセットアップ

管理画面（`/admin`）を利用するには、以下のセットアップが必要です。

## 1. 環境変数の追加

`SUPABASE_SERVICE_ROLE_KEY` を `.env.local` に追加します。

```bash
supabase status -o json
```

| `supabase status -o json` のフィールド | `.env.local` の変数              | 備考                                          |
| -------------------------------------- | ------------------------------- | --------------------------------------------- |
| `SERVICE_ROLE_KEY`                     | `SUPABASE_SERVICE_ROLE_KEY`     | Admin API 用シークレットキー                    |

> **WARNING**: `NEXT_PUBLIC_` プレフィックスを付けないでください。このキーは RLS をバイパスしてユーザー管理が可能なフルアクセスキーであり、ブラウザに露出させてはいけません。Admin Client は `import 'server-only'` ガードで保護されています。

## 2. マイグレーションの確認

[セットアップ](../README.md#セットアップ)でマイグレーションを実行済みであれば、`user_roles` テーブルは既に作成されています。まだ実行していない場合は `pnpm db:run-migrate` を実行してください。

## 3. 管理者ロールの付与

Supabase Studio（http://127.0.0.1:54323）の SQL Editor、または psql で以下を実行します:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('<your-user-uuid>', 'admin');
```

`<your-user-uuid>` は `auth.users` テーブルで確認できます。

## 4. 確認

サインアウト → 再サインインし、`/admin` にアクセスして管理画面が表示されることを確認します。
