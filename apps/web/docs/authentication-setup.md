# 認証セットアップ

## 概要

ユーザー認証は **Supabase Auth** で、1 つのアカウントに次のログイン方法を複数つなげられます。

| ログイン方法               | web | iOS アプリ | 備考                                                                                              |
| -------------------------- | --- | ---------- | ------------------------------------------------------------------------------------------------- |
| メールアドレスとパスワード | ○   | ○          | パスワードの設定・変更は再設定メール（`/reset-password`）で行う                                   |
| Google                     | ○   | —          | 同じプロバイダを複数つなげられる（仕事用と個人用など）。同じ Google アカウントは 1 ユーザーにだけ |
| Apple                      | —   | ○          | 入口は iOS アプリだけ。web は連携済みの Apple を一覧に出して外せるだけ                            |

追加・削除・メールアドレスの変更は web のアカウントページ（`/mypage/account`）で行います。
仕組みと判断（同じプロバイダを複数許す理由、外すときのガード、パスワードを画面で
受け取らない理由）は `apps/web/src/app/[locale]/(user)/(protected)/(confirmed)/mypage/account/(home)/page.tsx`
の TSDoc と `packages/features/src/account/login-methods.ts` に書いてあります。

同じメールアドレスの Google / Apple でログインしたときの自動連携は Supabase Auth が
常に行い、切る設定はありません（下の「Allow manual linking」とは別の仕組みです）。

本番の Supabase は `supabase/config.toml` を読みません。**ローカルは `config.toml`、本番は
Supabase Dashboard** で、同じ値を手で揃えます。`config.toml` を変えたら、この文書と
Dashboard の両方を更新してください。

## Supabase Dashboard の設定（本番）

`config.toml` のキーと Dashboard の置き場所の対応です。Dashboard の見出しは書いた時点
（2026-11）のもので、画面が変わったら `config.toml` のキーの説明を手がかりに探してください。

### Authentication > Sign In / Providers

| 項目（Dashboard）          | 値     | `config.toml`                      | 用途                                                                                                               |
| -------------------------- | ------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Allow new users to sign up | ON     | `[auth] enable_signup`             | 新規登録                                                                                                           |
| Allow manual linking       | **ON** | `[auth] enable_manual_linking`     | アカウントページの「Google アカウントを追加」「外す」（`linkIdentity` / `unlinkIdentity`）。OFF だと両方が失敗する |
| Allow anonymous sign-ins   | OFF    | `[auth] enable_anonymous_sign_ins` | 使わない                                                                                                           |

同じページの **Auth Providers** で各プロバイダを設定します。

**Email**

| 項目（Dashboard）       | 値                 | `config.toml`                         | 用途                                                                                                              |
| ----------------------- | ------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Enable Email provider   | ON                 | `[auth.email] enable_signup`          | メールアドレスとパスワードでの登録・ログイン                                                                      |
| Confirm email           | ON                 | `[auth.email] enable_confirmations`   | 登録時にメールアドレスを確認してからログインさせる                                                                |
| Secure email change     | ON                 | `[auth.email] double_confirm_changes` | メールアドレスの変更を、変更前・変更後の両方のアドレスで確認する（古い画面では "Double confirm email changes"）   |
| Secure password change  | ON                 | `[auth.email] secure_password_change` | 24 時間より古いセッションからのパスワード変更に再認証を求める。アプリは再設定メールで変えるので画面に再認証は無い |
| Minimum password length | `6`                | `[auth] minimum_password_length`      | `packages/features/src/account/password.ts` の `MIN_PASSWORD_LENGTH` と同じ値                                     |
| Password Requirements   | Letters and digits | `[auth] password_requirements`        | 同上（`letters_digits`）                                                                                          |

**Google** — [Google サインインの設定](#google-サインインの設定) を参照。

**Apple** — iOS アプリ用。[apps/mobile/README.md](../../mobile/README.md) の「Apple でログイン（iOS）」を参照。

### Authentication > URL Configuration

| 項目          | 値                                                               | `config.toml`                     |
| ------------- | ---------------------------------------------------------------- | --------------------------------- |
| Site URL      | 本番の URL（`https://your-domain.com`）                          | `[auth] site_url`                 |
| Redirect URLs | `https://your-domain.com/**`、`http://localhost:3000/**`（開発） | `[auth] additional_redirect_urls` |

認証メールのリンクは `{{ .SiteURL }}/auth/callback?...` なので、Site URL が違うとメールの
リンクが別のサイトへ飛びます。

### Authentication > Emails > Templates

認証メール 3 通（登録の確認・パスワードの再設定・メールアドレス変更の確認）の本文は
`supabase/templates/*.html` を貼ります。手順と件名は
[resend-smtp-setup.md](resend-smtp-setup.md) の「3. Email Templates」を参照してください。
本番で独自ドメインから送るには、同じ文書の Resend の設定が先に要ります。

### Authentication > Rate Limits

ローカルの `[auth.rate_limit]` に相当します。メール送信の枠（`email_sent`）はアプリ側の
IP ごとの枠（`apps/web/src/lib/rate-limit-ip.ts`）と二重に掛かります。

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

   | フィールド                    | 値                                        |
   | ----------------------------- | ----------------------------------------- |
   | Authorized JavaScript origins | `http://localhost:3000`                   |
   | Authorized redirect URIs      | `http://127.0.0.1:54321/auth/v1/callback` |

   **本番用 OAuth クライアント:**

   | フィールド                    | 値                                                    |
   | ----------------------------- | ----------------------------------------------------- |
   | Authorized JavaScript origins | `https://your-domain.com`                             |
   | Authorized redirect URIs      | `https://<reference-id>.supabase.co/auth/v1/callback` |

   > **ヒント:** `<reference-id>` は Supabase Dashboard > **Project Settings** > **General** の **Project ID**（"Reference used in APIs and URLs."）に表示される短い英数字文字列です。Supabase URL のサブドメイン部分（例: `abcdefghijkl.supabase.co`）であり、UUID ではありません。

7. それぞれのクライアントを保存し、**Client ID** と **Client Secret** を控える（開発用・本番用それぞれ）

> **注意:** リダイレクト URI はアプリケーションではなく Supabase のコールバックエンドポイントを指します。Supabase が OAuth フローを処理し、認証後にアプリにリダイレクトします。

### 2. Supabase で Google Provider を有効化（本番環境）

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. **Authentication** > **Sign In / Providers** に移動
4. **Google** を見つけて有効化
5. ステップ 1 で取得した**本番用**の **Client ID** と **Client Secret** を入力

### 3. Supabase の Redirect URLs を設定（本番環境）

上の [URL Configuration](#authentication--url-configuration) のとおり。

### 4. 連携の追加を確かめる

Google の往復はローカルでは Google の認証情報が要るため、本番（または Preview）で
確かめます。ログイン済みのアカウントで `/mypage/account` を開き:

1. 「Google アカウントを追加」→ Google で別のアカウントを選ぶ → 一覧に 2 行目が出る
2. どちらかの「外す」→ 確認 → 行が消える
3. 既に連携している Google を選ぶと「すでにこのアカウントか別のアカウントに連携されています」

## メールアドレスの変更とパスワードの設定

どちらも確認メールで完了します（画面でパスワードを受け取りません）。本番で動かすには
[resend-smtp-setup.md](resend-smtp-setup.md) の設定が要ります。

- **メールアドレスの変更**: 変更前・変更後の両方のアドレスに確認メールが届き、両方の
  リンク（`/auth/callback?type=email_change`）を開くと確定する。リンクは変更を始めた
  端末でなくても開ける（`token_hash` 方式。PKCE の `?code=` ではない）
- **パスワードの設定・変更**: ログイン中のアドレスに再設定メールを送り、`/reset-password`
  で決める。Google / Apple だけで登録した人はこれでメールアドレスとパスワードでも
  ログインできるようになる

### Apple の「メールを非公開」のアドレス

Apple でログインして「メールを非公開」を選んだ人のアドレスは `@privaterelay.appleid.com` の
中継アドレスです。中継アドレスへのメールは、**送信元のドメインを Apple の Private Email
Relay に登録していないと届きません**。登録していない間、その人にはアカウントページの
「変更する」「パスワードを設定」が無効になり、理由が出ます。

登録の手順は [apps/mobile/README.md](../../mobile/README.md) の「Private Email Relay」を
参照してください（Apple Developer の設定で、送信元は Resend で認証したドメインの
アドレスになります）。

## ローカル開発（Supabase CLI）

`pnpm supabase start` でローカル実行する場合、設定は本番環境とは異なる仕組みで動作します:

- **認証の設定**は `supabase/config.toml` で定義されます（Supabase Dashboard ではありません）。
  上の表の `config.toml` の列が対応するキーです。変えたら `pnpm supabase stop && pnpm supabase start`
  で反映します（DB は残ります）
- **Google の認証情報**は `supabase/.env` から読み込まれます。`config.toml` は `env()` 構文で
  これらを参照します（例: `client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"`）。
  未設定だと Google 側が `client_id` を拒み、ログインも連携の追加も Google の画面で止まります
- **メール**は [Mailpit](http://127.0.0.1:54324) に届きます。メールアドレスの変更の 2 通も
  ここで開けます（リンクは `site_url` の `localhost:3000` を指す）

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
   pnpm supabase stop && pnpm supabase start
   ```

### localhost と 127.0.0.1 の違い

`config.toml` の `site_url` は `http://localhost:3000` に設定されています（`http://127.0.0.1:3000` ではありません）。これは意図的な設定です。ブラウザは `localhost` と `127.0.0.1` を異なるオリジンとして扱います。Next.js 開発サーバーは `localhost:3000` で動作するため、OAuth 認証後に設定される Cookie がアプリから読み取れるように `site_url` を一致させる必要があります。

Supabase API URL（`http://127.0.0.1:54321`）が `127.0.0.1` を使用しているのは、Supabase CLI がそのアドレスにバインドするためです。Google Cloud Console のリダイレクト URI もこれに合わせて `127.0.0.1` を使用する必要があります。
