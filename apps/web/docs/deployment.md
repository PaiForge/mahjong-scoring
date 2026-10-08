# デプロイ

## Vercel

このアプリは [Vercel](https://vercel.com/) にデプロイされます。リポジトリは Turborepo モノレポのため、Vercel プロジェクトを以下のように設定してください:

| 設定項目         | 値         |
| ---------------- | ---------- |
| Framework Preset | Next.js    |
| Root Directory   | `apps/web` |

`apps/web/vercel.json` の `regions` で関数（Server Actions・動的ルート・Route Handlers）を東京（`hnd1`）に置いている。Supabase が `ap-northeast-1` にあり、関数と DB の往復はリクエストごとに何度も直列で起きるため（チャレンジの回答 1 回で BAN 判定 + トランザクションの約 5 往復）、関数を DB から離すとその回数ぶん太平洋往復が掛かる。未指定だと Vercel の既定の `iad1`（米国東部）になり、チャレンジで回答してから正誤が出るまでに 1 秒前後の遅れが出ていた（2026-10 に本番で `x-vercel-id: hnd1::iad1::…` を実測）。DB のリージョンを変えるときはここも一緒に変えること。

`apps/web/vercel.json` の `ignoreCommand` で、`claude/*` ブランチ（`.github/workflows/claude-issue-solve.yml` が bot 名義で開く PR の head）のビルドをスキップしている。bot の PR は人が Actions からマージするまでレビュー対象でしかなく、PR ごとに preview デプロイを作る意味がないため。

## Supabase の設定

### Supabase プロジェクトの作成

本番用の Supabase プロジェクトを事前に作成しておく必要があります。

1. [Supabase Dashboard](https://supabase.com/dashboard/new/<org-id>) から新規プロジェクトを作成する
2. 作成したプロジェクトを、次の手順（Vercel Marketplace Integration）で連携する

| 設定項目        | 値                     | 理由                                                                                                                                                                                                                          |
| --------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Region          | Northeast Asia (Tokyo) | ユーザーの大半が日本在住。Vercel のデプロイリージョン (hnd1) とも近接                                                                                                                                                         |
| Enable Data API | **オフ**               | データアクセスは Drizzle ORM で直接 PostgreSQL に接続しており、PostgREST（Data API）は使用しない。Supabase クライアントは認証（`supabase.auth.*`）のみに利用。不要な API エンドポイントを無効化することで攻撃対象面を減らせる |

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

新しいテーブル・列（退会の進み具合の `account_deletions`、Apple のトークンの `apple_refresh_tokens` など）も、このマイグレーションで本番に入ります。手で SQL を流す必要はありません。

## Supabase ダッシュボードで手で行う設定

本番の Supabase は `supabase/config.toml` を読みません。ローカルで設定を変えたら、本番のダッシュボードにも同じ変更を手で入れます。

### 認証メールのテンプレート

確認メールとパスワード再設定のメールは、リンクを web の `/auth/callback` に `token_hash` 付きで向けています（どの端末・ブラウザで開いても確認が済むように）。テンプレートを変えたら、本番のダッシュボードに貼り直します。**貼り直さないと、本番のメールのリンクは古い形のまま**です。

1. Authentication > Emails > Templates を開く
2. 次のテンプレートの Body を、ローカルのファイルの中身で置き換えて Save する

| テンプレート   | ローカルのファイル                     | Subject                               |
| -------------- | -------------------------------------- | ------------------------------------- |
| Confirm signup | `supabase/templates/confirmation.html` | `麻雀点数計算 - メールアドレスの確認` |
| Reset password | `supabase/templates/recovery.html`     | `麻雀点数計算 - パスワードのリセット` |

Subject は `supabase/config.toml` の `[auth.email.template.*]` と同じ値です。

### Apple ログイン

Authentication > Sign In / Providers > Apple を有効にし、Client IDs に `help.mahjong.score` を入れます。手順は [apps/mobile/README.md](../../mobile/README.md) の「Supabase の設定」を参照してください。

## 環境変数

| 変数名                                 | 説明                                                                                                                                                                                                                                                     | 必須                   | 備考                                                                                                                                           |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase プロジェクト URL（例: `https://<reference-id>.supabase.co`）                                                                                                                                                                                    | はい                   | Integration で自動設定                                                                                                                         |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 公開（publishable）キー                                                                                                                                                                                                                         | はい                   | Integration で自動設定                                                                                                                         |
| `SUPABASE_SERVICE_ROLE_KEY`            | Supabase サービスロールキー（Admin API アクセス用）。[管理画面のセットアップ](admin-panel-setup.md)を参照。                                                                                                                                              | はい                   | Integration で自動設定                                                                                                                         |
| `POSTGRES_URL`                         | PostgreSQL 接続 URL（プーリング経由）                                                                                                                                                                                                                    | はい                   | Integration で自動設定                                                                                                                         |
| `POSTGRES_URL_NON_POOLING`             | PostgreSQL 接続 URL（直接接続、マイグレーション用）                                                                                                                                                                                                      | はい                   | Integration で自動設定                                                                                                                         |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`        | Google Analytics 4 測定 ID（例: `G-XXXXXXXXXX`）。設定時のみ GA スクリプトが読み込まれます。                                                                                                                                                             | いいえ（本番環境のみ） | —                                                                                                                                              |
| `NEXT_PUBLIC_SITE_URL`                 | サイトの公開 URL。canonical・sitemap・robots・認証メールのリダイレクト先の組み立てに使われます。未設定・空・不正値の場合は本番 URL（`https://score.mahjong.help`、`packages/features/src/site-url.ts` の `PRODUCTION_SITE_URL`）にフォールバックします。 | いいえ                 | 本番は未設定でよい。プレビュー環境で認証メールをそのプレビューに向けたい場合のみ環境別に設定する（Supabase 側の Redirect URLs への登録も必要） |
| `RESEND_API_KEY`                       | Resend の API キー（お問い合わせフォームの送信用）。[お問い合わせフォームのセットアップ](contact-form-setup.md)を参照。                                                                                                                                  | いいえ                 | 未設定だと問い合わせの送信がエラーになる（フォームの表示はできる）                                                                             |
| `CONTACT_TO_EMAIL`                     | お問い合わせを受け取る運営のメールアドレス                                                                                                                                                                                                               | いいえ                 | 同上                                                                                                                                           |
| `CONTACT_FROM_EMAIL`                   | お問い合わせメールの送信元（Resend で認証済みドメインのアドレス。例: `contact@score.mahjong.help`）                                                                                                                                                      | いいえ                 | 未設定なら Resend のテスト用アドレスから送られる（アカウント所有者宛てにしか届かない）                                                         |
| `CRON_SECRET`                          | Vercel Cron の呼び出しを認証する秘密（`/api/cron/*` が `Authorization: Bearer <値>` を照合する）。Vercel が cron の呼び出しに自動で付けるので、十分に長いランダムな文字列を設定するだけでよい。                                                          | はい                   | 未設定だと cron の受け口は常に 401 になり、Pro の期限切れの通知と、途中で止まった退会の再開（`vercel.json` の `crons`）が動かない              |
| `APPLE_TEAM_ID`                        | Apple Developer のチーム ID（`YV82X4FFX3`）                                                                                                                                                                                                              | iOS アプリを出すなら   | 下の 3 つと揃って初めて有効。[apps/mobile/README.md](../../mobile/README.md) の「Apple でログイン」                                            |
| `APPLE_KEY_ID`                         | Sign in with Apple の鍵の ID                                                                                                                                                                                                                             | 同上                   | 未設定だと、Apple でログインした人の退会で Apple 側の連携を取り消せない（ログイン自体はできる）                                                |
| `APPLE_PRIVATE_KEY`                    | Sign in with Apple の鍵（`.p8` の中身）。`vercel env add APPLE_PRIVATE_KEY production < AuthKey_XXXX.p8` でファイルのまま渡せる                                                                                                                          | 同上                   | 同上                                                                                                                                           |
| `APPLE_TOKEN_ENCRYPTION_KEY`           | 保存する Apple のトークンを暗号化する鍵（`openssl rand -base64 32`）                                                                                                                                                                                     | 同上                   | 一度使い始めたら替えない（替えると保存済みのトークンが読めず、その人たちの取り消しが飛ばされる）                                               |
