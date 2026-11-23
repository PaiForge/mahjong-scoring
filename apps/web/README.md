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
| `API_URL`                                   | `NEXT_PUBLIC_SUPABASE_URL`             | デフォルト値は `http://127.0.0.1:56321`            |
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

ブラウザで [http://mahjong.localhost:3200](http://mahjong.localhost:3200) を開いて動作を確認してください。

## ローカル開発

### 認証（Supabase Auth）

ログイン方法（メールアドレスとパスワード・Google・Apple）と、本番の Supabase Dashboard の設定と `supabase/config.toml` の対応、Google サインインをローカルでテストするための OAuth 認証情報の設定は [docs/authentication-setup.md](docs/authentication-setup.md) を参照してください。

### Apple ログイン（iOS アプリ用）

iOS アプリの Apple ログインは、ローカルの Supabase で設定済み（`supabase/config.toml` の `[auth.external.apple]`）。アプリが送る Apple の認可コードを交換・保存し、退会で取り消すには `.env.local` に `APPLE_TEAM_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY` / `APPLE_TOKEN_ENCRYPTION_KEY` が要る（未設定でもログインはでき、トークンの保存だけが飛ばされる）。値と作り方は [apps/mobile/README.md](../mobile/README.md) の「Apple でログイン」を参照してください。

### 実践練習の問題保存を止める

`PRACTICE_PROBLEM_ARCHIVE_DISABLED=1` で、Web・アプリ両方の問題保存 API を停止します。
停止中は認証・本文の検証・DB 保存を行わず 204 を返し、クライアントの再送を防ぎます。
未設定または `0` なら保存します。出題や解答は停止しません。

ローカルでは `apps/web/.env.local` に設定して開発サーバーを再起動するか、
`PRACTICE_PROBLEM_ARCHIVE_DISABLED=1 pnpm dev` で起動します。
本番ではサーバーの環境変数を変更し、その値で再デプロイしてください。
Turbo の `build.env` と `dev.passThroughEnv` にも登録しています。
保存の状況（種別・由来ごとの数、日ごとの新規保存数）と停止中かどうかは、
管理画面の「問題保存状況」（`/admin/practice-problems`）で確かめられます。

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

iOS アプリでは同じ Pro を App Store のアプリ内課金で売ります（購入は同じ `purchases` に `provider = 'apple'` で入る）。環境変数（`APPLE_IAP_PRODUCT_ID_PRO_PASS` / `APPLE_IAP_PRODUCT_ID_PRO_LIFETIME` / `APPLE_IAP_APP_APPLE_ID` / `APPLE_IAP_SANDBOX_USER_IDS`）、App Store Connect の設定、Sandbox の許可リストは [apps/mobile/README.md](../mobile/README.md) の「アプリ内課金（iOS）」を参照してください。未設定ならアプリでは販売せず、アプリの回数制限も掛かりません。

### サイト内通知と Cron

Pro プランの出来事（購入完了・期限切れ・運営からの付与・取り消し）は、ヘッダーのベルと `/mypage/notifications` でユーザー本人に知らせます。購入や付与の通知はその処理の中で書かれますが、**期限切れ**は時刻だけで起きるため、`vercel.json` の `crons` が 1 日 1 回 `/api/cron/notify-plan-expiry` を呼んで書きます。

受け口は `CRON_SECRET` の Bearer トークンだけで守られます（Vercel が cron の呼び出しに自動で付ける）。未設定なら常に 401 で、通知は届きません。ローカルで試すには `.env.local` に任意の値を置いて、同じヘッダを付けて叩きます:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3200/api/cron/notify-plan-expiry
```

何度叩いても同じ購入・付与には 1 通しか付きません。一覧とベルの見た目は `pnpm db:seed:dev` のシードユーザー（bob: 期限切れを含む 3 件 / carol / dave）でサインインすると確認できます。

退会も cron を使います。退会はその場で全工程（データの削除 → アバター画像の削除 → ログインの無効化 → Apple の連携の取り消し）を進めますが、外部サービスの一時障害で終わらなかった分を、`crons` が 1 日 1 回 `/api/cron/process-account-deletions` で再開します。進み具合は `account_deletions` テーブルに残ります。ローカルで再開を試すときも同じヘッダで叩きます:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3200/api/cron/process-account-deletions
```

### ローカルサービス

- **Supabase Studio**: http://127.0.0.1:56323
- **Mailpit（メールテスト用）**: http://127.0.0.1:56324
- **PostgreSQL**: `postgresql://postgres:postgres@127.0.0.1:56322/postgres`

### ローカルのポート

このプロダクトのローカル Supabase は、Supabase CLI の既定のポート（543xx）を使わず、専用の **563xx** で待ち受けます。同じ Mac で別のプロダクトの Supabase も動かしており、どちらも既定のままだとポートがぶつかって片方しか起動できないためです（もう一方は 553xx）。既定値の下 2 桁は保つので、ポートの役割は番号から読めます（`…21` は API、`…22` は Postgres）。

| 役割                   | `supabase/config.toml`          | このプロダクト | CLI の既定 |
| ---------------------- | ------------------------------- | -------------- | ---------- |
| API（Auth・REST 等）   | `[api] port`                    | 56321          | 54321      |
| Postgres（直結）       | `[db] port`                     | 56322          | 54322      |
| Shadow DB              | `[db] shadow_port`              | 56320          | 54320      |
| Supavisor pooler       | `[db.pooler] port`              | 56329          | 54329      |
| Studio                 | `[studio] port`                 | 56323          | 54323      |
| Mailpit                | `[local_smtp] port`             | 56324          | 54324      |
| Analytics              | `[analytics] port`              | 56327          | 54327      |
| Edge runtime inspector | `[edge_runtime] inspector_port` | 8283           | 8083       |

`project_id`（`mahjong-scoring-web`）もプロダクトごとに別にしてあります。同じだと Docker のコンテナ名がぶつかります。

待ち受けるポートを決めるのは `config.toml` で、`.env.local` はアプリの接続先を教えるだけです。ローカルのポートを持つ環境変数は次のとおりです。未設定ならコードの既定値（`src/lib/local-supabase.ts`）が手元のスタックを指します。

| 変数                                                                                                | ポート       | ローカルの値                                              |
| --------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                                                                          | `[api] port` | `http://127.0.0.1:56321`                                  |
| `POSTGRES_URL`（設定していれば `DATABASE_URL`・`POSTGRES_URL_NON_POOLING` も）                      | `[db] port`  | `postgresql://postgres:postgres@127.0.0.1:56322/postgres` |
| `CHALLENGE_TEST_DATABASE_URL` / `BILLING_TEST_DATABASE_URL`（結合テストを流すときだけシェルで渡す） | `[db] port`  | `postgresql://postgres:postgres@127.0.0.1:56322/postgres` |

モバイルアプリは何もしなくてよい（開発中は `apps/mobile/src/auth/supabase-config.ts` の `LOCAL_SUPABASE_API_PORT` から接続先を組む）。`EXPO_PUBLIC_SUPABASE_URL` を手で渡して Metro を起動している場合だけ、その値のポートを直します。

#### 既存のチェックアウトを 563xx に合わせる

ポートを移す前に作った `.env.local` は既定のポートを指したままです。`apps/web` で一度だけ:

1. スタックが動いていれば `pnpm supabase stop`
2. `.env.local` の上の表の変数を、ローカルの値に直す
3. ローカルで Google ログインを使うなら、Google Cloud Console の OAuth クライアントの「承認済みのリダイレクト URI」に `http://127.0.0.1:56321/auth/v1/callback` を足す（[docs/authentication-setup.md](docs/authentication-setup.md)）
4. `pnpm supabase start` の後、`pnpm supabase status` に出るポートが上の表と一致することを確かめる
5. DB が空で立ち上がったら `pnpm db:run-migrate` → `pnpm db:seed` → `pnpm db:seed:dev`
6. `next dev` を再起動して `.env.local` を読み直させる

#### ブロックをもう一度変えるとき

1. `supabase/config.toml` の 8 つのポートをすべて変える。1 つでも残すと、もう一方のプロダクトと同時に起動したときにそのポートで失敗する
2. `pnpm test` を流す。`src/lib/local-supabase.test.ts` が、`[api] port` / `[db] port` と食い違った写し（`src/lib/local-supabase.ts` の `LOCAL_SUPABASE_API_PORT` / `LOCAL_SUPABASE_DB_PORT`、`apps/mobile/src/auth/supabase-config.ts` の `LOCAL_SUPABASE_API_PORT`、`apps/mobile/scripts/sim-release.sh` の `LOCAL_SUPABASE_URL`）ごとに落ちるので、通るまで直す
3. この節の表と `.env.example` のローカルの値を直す（`.env.example` も同じテストが照合する）
4. コピー用にポートを書いた文書・スクリプトを直す。`git grep -nE "5632[0-9]"` で見つかる（`apps/web/{README,CLAUDE}.md`・`apps/web/docs/`・`apps/mobile/{README,CLAUDE}.md`・`apps/mobile/.maestro/`・`scripts/claude-cloud/{session-start,stack-up}.sh` 等）。`src/proxy.test.ts` の URL はテストの入力の任意の例なので直さなくてよい
5. 上の「既存のチェックアウトを 563xx に合わせる」をたどる

ポートで挙動を変えているコードはありません（DB の接続数の上限などをポート番号で判定していない）。

#### 開発サーバー（Next）: mahjong.localhost:3200

`pnpm dev` は Next の既定の 3000 ではなく **3200** で待ち受け、ブラウザでは **http://mahjong.localhost:3200** を開きます。もう一方のプロダクトは 3100（`chess.localhost:3100`）を使います。

ポートだけでなくホスト名も分けるのは cookie のためです。cookie はポートで分かれないので、`localhost:3100` と `localhost:3200` は同じ cookie を共有します。Supabase のログイン cookie の名前は Supabase の URL のホスト名の先頭から作られ（`sb-127-auth-token`）、両プロダクトで同じなので、片方でログインするともう片方のセッションを上書きします。`*.localhost` はブラウザ（Chrome・Safari・Firefox）が自分でループバックに解決するので、`/etc/hosts` も外部の DNS（`lvh.me` 等）も要りません。Next 16 の dev も `*.localhost` からの読み込みを既定で許すので、`allowedDevOrigins` も要りません。ホスト名だけではポートの奪い合いは避けられないので（同じポートで待ち受けられるのは 1 プロセスだけ）、ポートも分けています。

| 置き場所                                      | 値                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `apps/web/package.json` の `dev`              | `next dev --turbopack -p 3200`（ポートの正）                        |
| `supabase/config.toml` の `[auth] site_url`   | `http://mahjong.localhost:3200`（開くオリジンの正）                 |
| `[auth] additional_redirect_urls`             | `site_url` を含める                                                 |
| `.env.local` の `NEXT_PUBLIC_SITE_URL`        | `http://mahjong.localhost:3200`                                     |
| モバイル（`apps/mobile/src/lib/site-url.ts`） | `LOCAL_WEB_PORT = 3200`。ホストは Metro のホストか localhost のまま |
| `.claude/launch.json` の `web`                | `port: 3200`、`url: http://mahjong.localhost:3200`                  |
| `scripts/claude-cloud/config.sh` の `APP_URL` | `http://localhost:3200`（VM はこのプロダクトだけなので localhost）  |

`-H` は付けません。実機のアプリは Mac の LAN のアドレス（`192.168.x.x:3200`）で web に届くので、全てのインターフェースで待ち受ける必要があります。`stripe listen --forward-to` や cron を叩く `curl` は cookie を使わないので `localhost:3200` のままで構いません。

既存のチェックアウトを合わせるには、`.env.local` の `NEXT_PUBLIC_SITE_URL` を上の値に直し、`pnpm supabase stop` → `pnpm supabase start`（`site_url` を読み直させる）、`next dev` を再起動して http://mahjong.localhost:3200 を開きます。前のオリジン（`localhost:3000`）のログイン状態は引き継がれないので、ログインし直します。

ポートやホスト名をもう一度変えるときは、上の 2 つの正（`package.json` の `dev`・`config.toml` の `site_url`）を直して `pnpm test` を流します。`src/lib/local-web-server.test.ts` が、食い違った写し（表の残りの行と `apps/mobile/scripts/sim-release.sh` の `LOCAL_SITE_URL`）ごとに落ちます。コピー用に書いた文書は `git grep -nE "mahjong\.localhost|:3200"` で見つかります。テストの入力にある `localhost:3000` は任意の例なので直さなくて構いません。

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
