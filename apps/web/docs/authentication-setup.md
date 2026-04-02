# 認証セットアップ

## 概要

このプロジェクトでは、ユーザー認証に **Supabase Auth** を使用し、サインイン方法として **Google OAuth** を提供しています。

## Google サインインの設定

### 1. Google Cloud Console で OAuth 認証情報を作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. **APIs & Services** > **Credentials** に移動
4. **OAuth 同意画面** の設定を求められた場合は、先に完了させる:
   - ユーザータイプとして **External** を選択
   - 必須フィールド（アプリ名、サポートメール）を入力
   - スコープを追加: `email`, `profile`, `openid`

   > **注意:** ここで `email` と `openid` のみを設定した場合でも、Supabase Auth (GoTrue) は Google プロバイダーのデフォルトスコープとして `email` と `profile` をハードコードしています。クライアント側の `scopes` パラメータは追加的であり、デフォルトを置き換えることはできません。そのため、Google の同意画面には常に「名前とプロフィール写真」の権限が表示されます。参考: https://github.com/supabase/auth/blob/master/internal/api/provider/google.go
   - アプリは **Testing** モードで開始されます。ローカル開発用にテストユーザーとして自分の Google アカウントを追加してください

5. **Create Credentials** > **OAuth client ID** をクリックし、**開発用と本番用で2つの OAuth クライアントを作成**する
6. それぞれのアプリケーションの種類として **Web application** を選択し、以下の情報を設定

   **開発用 OAuth クライアント:**

   | フィールド                      | 値                                            |
   | ------------------------------ | --------------------------------------------- |
   | Authorized JavaScript origins  | `http://localhost:3000`                        |
   | Authorized redirect URIs       | `http://127.0.0.1:54321/auth/v1/callback`     |

   **本番用 OAuth クライアント:**

   | フィールド                      | 値                                                          |
   | ------------------------------ | ----------------------------------------------------------- |
   | Authorized JavaScript origins  | `https://your-domain.com`                                    |
   | Authorized redirect URIs       | `https://<reference-id>.supabase.co/auth/v1/callback`        |

   > **ヒント:** `<reference-id>` は Supabase Dashboard > **Project Settings** > **General** の **Project ID**（"Reference used in APIs and URLs."）に表示される短い英数字文字列です。Supabase URL のサブドメイン部分（例: `abcdefghijkl.supabase.co`）であり、UUID ではありません。

7. それぞれのクライアントを保存し、**Client ID** と **Client Secret** を控える（開発用・本番用それぞれ）

> **注意:** リダイレクト URI はアプリケーションではなく Supabase のコールバックエンドポイントを指します。Supabase が OAuth フローを処理し、認証後にアプリにリダイレクトします。

### 2. Supabase で Google Provider を有効化（本番環境）

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. **Authentication** > **Providers** に移動
4. **Google** を見つけて有効化
5. ステップ 1 で取得した**本番用**の **Client ID** と **Client Secret** を入力

### 3. Supabase の Redirect URLs を設定（本番環境）

1. Supabase Dashboard で **Authentication** > **URL Configuration** に移動
2. **Redirect URLs** に以下を追加:
   - `http://localhost:3000/**`（ローカル開発用）
   - `https://your-domain.com/**`（本番用）

## ローカル開発（Supabase CLI）

`supabase start` でローカル実行する場合、OAuth プロバイダーの設定は本番環境とは異なる仕組みで動作します:

- **プロバイダー設定** は `supabase/config.toml` で定義されます（Supabase Dashboard ではありません）。Google OAuth は `[auth.external.google] enabled = true` で有効化済みです。
- **認証情報** は `supabase/.env` から読み込まれます（環境変数や Dashboard の設定ではありません）。`config.toml` は `env()` 構文でこれらを参照します（例: `client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"`）。

### Google サインインのローカルセットアップ

1. **開発用 OAuth クライアントの認証情報を用意** — [ステップ 1](#1-google-cloud-console-で-oauth-認証情報を作成) で作成した**開発用** OAuth クライアントの Client ID と Client Secret を使用します

2. **Supabase 環境を設定**:

   ```bash
   cp supabase/.env.example supabase/.env
   ```

   `supabase/.env` を編集し、以下を設定:

   ```bash
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<your-google-client-id>
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<your-google-client-secret>
   ```

3. **Supabase を再起動** して新しい環境変数を反映させます:
   ```bash
   supabase stop && supabase start
   ```

### localhost と 127.0.0.1 の違い

`config.toml` の `site_url` は `http://localhost:3000` に設定されています（`http://127.0.0.1:3000` ではありません）。これは意図的な設定です。ブラウザは `localhost` と `127.0.0.1` を異なるオリジンとして扱います。Next.js 開発サーバーは `localhost:3000` で動作するため、OAuth 認証後に設定される Cookie がアプリから読み取れるように `site_url` を一致させる必要があります。

Supabase API URL（`http://127.0.0.1:54321`）が `127.0.0.1` を使用しているのは、Supabase CLI がそのアドレスにバインドするためです。Google Cloud Console のリダイレクト URI もこれに合わせて `127.0.0.1` を使用する必要があります。
