# @mahjong-scoring/web

麻雀の点数計算を学習する Next.js Web アプリケーション。

## クイックスタート

### 前提条件

- Node.js 24.x
- pnpm 10.x
- Docker（Supabase CLI に必要）

[Supabase CLI](https://supabase.com/docs/guides/local-development) はこのアプリの
devDependency として同梱されているため（`pnpm install` で入ります）、個別に
インストールする必要はありません。`supabase/config.toml` は CLI のバージョンと
結合しているので、グローバルインストール版ではなく、リポジトリルートまたは
`apps/web` から `pnpm supabase ...` で同梱版を実行してください。

### セットアップ

```bash
# 依存パッケージのインストール（モノレポのルートで実行）
pnpm install

# Supabase ローカル環境の起動（リポジトリルートまたは apps/web で実行。初回は Docker イメージのダウンロードが行われます）
pnpm supabase start
```

`pnpm supabase start` 完了後、`pnpm supabase status -o json` を実行して API キーを取得します。取得した値を `.env.local` にコピーしてください:

```bash
pnpm supabase status -o json
cp .env.example .env.local
```

| `pnpm supabase status -o json` のフィールド | `.env.local` の変数                    | 備考                                               |
| ------------------------------------------- | -------------------------------------- | -------------------------------------------------- |
| `PUBLISHABLE_KEY`                           | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ブラウザクライアントで使用する公開キー             |
| `API_URL`                                   | `NEXT_PUBLIC_SUPABASE_URL`             | デフォルト値は `http://127.0.0.1:54321`            |
| —                                           | `POSTGRES_URL`                         | ローカル開発ではデフォルト値が使われるため設定不要 |

> **ヒント:** これらの値は `pnpm supabase start` の出力にも表示されます（"Authentication Keys" の Publishable と "APIs" の Project URL）。

```bash
# データベースマイグレーションの実行
pnpm db:run-migrate
```

> **注意:** `drizzle-kit push` ではなく `pnpm db:run-migrate` を使用してください。`db:run-migrate` は Drizzle マイグレーションに加えて、Supabase 固有の SQL（RLS ポリシー、外部キー制約等）も適用します。

```bash
# 開発用シードユーザーの投入（任意。管理者と一般ユーザーを作成します）
pnpm db:seed:dev
```

> **注意:** `SUPABASE_SERVICE_ROLE_KEY` の設定が必要です。詳細は [docs/admin-panel-setup.md](docs/admin-panel-setup.md) を参照してください。

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

### お問い合わせフォーム（Resend）

お問い合わせフォーム（`/contact`）は [Resend](https://resend.com/) の API で運営のメールアドレスへメールを送ります。DB には保存しません。送信を実際に試すには `.env.local` に以下を設定してください（未設定でもフォーム自体は表示され、送信時にエラーになります）:

| 変数名               | 説明                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`     | Resend の API キー。権限は **Sending access** のみ、ドメインはこのサイトの送信元ドメインに限定したものを発行する                        |
| `CONTACT_TO_EMAIL`   | 問い合わせを受け取る運営のメールアドレス                                                                                                |
| `CONTACT_FROM_EMAIL` | 送信元アドレス。Resend で認証済みのドメインのもの（例: `contact@score.mahjong.help`）。未設定なら Resend のテスト用アドレスから送られる |

ドメイン認証と API キーの発行手順は [docs/contact-form-setup.md](docs/contact-form-setup.md) を参照してください。

### 有料プラン（Stripe）

有料プラン「Pro」（30 日パス + 買い切り）の決済は [Stripe](https://stripe.com/jp) の Checkout（一括払い）で行います。購入の記録は Webhook と Checkout 完了の着地の両方から冪等に入り、特典の判定は `src/lib/entitlements/has-benefit.ts` に集約しています。ローカルで購入の流れを試すには `.env.local` に以下を設定し、`stripe listen` で Webhook を転送してください（未設定でも無料枠の機能は動き、Stripe を使う処理を呼んだ時点で変数名を含むエラーになります）:

| 変数名                         | 説明                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `STRIPE_SECRET_KEY`            | Stripe のシークレットキー（`sk_test_` / `sk_live_`）。`NEXT_PUBLIC_` を付けない                  |
| `STRIPE_WEBHOOK_SECRET`        | Webhook の署名シークレット（`whsec_`）。ローカルは `stripe listen` の出力、本番は Dashboard の値 |
| `STRIPE_PRICE_ID_PRO_PASS`     | 30 日パスの Price ID（`price_`）。一括払いで作る                                                 |
| `STRIPE_PRICE_ID_PRO_LIFETIME` | 買い切りの Price ID（`price_`）。一括払いで作る                                                  |

購入が無いときに掛かる練習の回数制限を外して確認したいだけなら、Stripe を設定せず `pnpm db:seed:dev` のシードユーザー（bob: 有効なパス / carol: 買い切り）でサインインしてください。

API キーの取得、商品と価格の作成、Webhook の登録、本番移行の手順は [docs/stripe-setup.md](docs/stripe-setup.md) を参照してください。

### サイト内通知と Cron

Pro プランの出来事（購入完了・期限切れ・運営からの付与・取り消し）は、ヘッダーのベルと `/mypage/notifications` でユーザー本人に知らせます。購入や付与の通知はその処理の中で書かれますが、**期限切れ**は時刻だけで起きるため、`vercel.json` の `crons` が 1 日 1 回 `/api/cron/notify-plan-expiry` を呼んで書きます。

受け口は `CRON_SECRET` の Bearer トークンだけで守られます（Vercel が cron の呼び出しに自動で付ける）。未設定なら常に 401 で、通知は届きません。ローカルで試すには `.env.local` に任意の値を置いて、同じヘッダを付けて叩きます:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/notify-plan-expiry
```

何度叩いても同じ購入・付与には 1 通しか付きません。一覧とベルの見た目は `pnpm db:seed:dev` のシードユーザー（bob: 期限切れを含む 3 件 / carol / dave）でサインインすると確認できます。

### ローカルサービス

- **Supabase Studio**: http://127.0.0.1:54323
- **Mailpit（メールテスト用）**: http://127.0.0.1:54324
- **PostgreSQL**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Supabase を停止するには:

```bash
pnpm supabase stop
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
