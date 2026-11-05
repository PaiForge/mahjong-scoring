# apps/web — Next.js アプリの基盤

画面の規約（共通 UI・色・ローディング境界）は `src/app/CLAUDE.md`。ここには DB・認証・
Supabase・デプロイ・スクリプトの規約を置く。コーディング規約（TSDoc・命名・Result 型）は
https://raw.githubusercontent.com/PaiForge/docs/0b464878e4e24b6b8c154d90f96e1657e212ddaa/coding-standards.md
（ドメインロジックや TSDoc を書くときに読む。ESLint が多くを強制する）。

## Next.js Proxy（旧 Middleware）

- Next.js 16 では `middleware.ts` は `proxy.ts` に置き換えられた。**`middleware.ts` は使用禁止**
- セッションリフレッシュ等の処理は `src/proxy.ts` に記述する
- `middleware.ts` と `proxy.ts` が同時に存在するとビルドエラーになる

## Database Migration

- **Always use `pnpm db:run-migrate`** — `scripts/migrate.ts` が Drizzle のマイグレーションを流し、
  Supabase 環境では Supabase 固有の SQL（RLS・FK）も適用する
- **本番の初期データは `pnpm db:seed`**（`scripts/seed.ts`）— prebuild がマイグレーションの後に走らせる。
  宣言した行のうち DB に無いものだけを入れ（id 単位の insert-only）、既存の行は管理画面の編集ごと DB が正。
  いまはネイティブ広告（ASIN で本を指す。トラッキング ID は管理画面で設定するまで無く、それまで画面に出ない）だけ
- **Do NOT use `drizzle-kit push`** — マイグレーションの journal と DB の状態が食い違う
- **スキーマ変更の手順**: `src/lib/db/schema.ts` を編集 → `npx drizzle-kit generate --name=<migration_name>`
  → `pnpm db:run-migrate`。`--name` は必ず付ける（snake_case。例: `create_profiles_table`）
- ファイル構成: `drizzle/*.sql` + `drizzle/meta/` は Drizzle の生成物。`drizzle/supabase/` は
  Supabase 固有の SQL（RLS・FK・権限）で `migrate.ts` が Supabase 環境で適用する
- `drizzle/meta/` のスナップショットは snake_case の列名の grep を埋める（`created_at` の 97% が
  ここ）ため、`apps/web/.ignore` で Grep の対象から外している。見たいときは `rg --no-ignore` か
  ファイルを直接開く

## 認証（Email + Google OAuth）

- `NEXT_PUBLIC_SITE_URL` — 認証コールバック URL の生成に使用。本番環境では本番 URL を設定する
- IP ベースのインメモリレートリミット（`src/lib/rate-limit-ip.ts`）+ Supabase サーバーサイド
  レートリミットの二重防御
- アカウント列挙防止: サインインは汎用エラー、パスワードリセットは常に成功を返す
- パスワードバリデーション: Zod スキーマ（`packages/features/src/account/password.ts`）で
  client/server・web/モバイルの両方で検証

### 本番環境の Supabase Dashboard 設定（必須）

メール認証を本番環境で動作させるには、以下の設定が必要。`supabase/config.toml` のローカル設定と同期させる。

1. **Authentication > Providers > Email**: Email provider を有効化
2. **Authentication > Settings**: "Confirm email" / "Secure password change" / "Double confirm email changes"
   を有効化。Minimum password length: `6`。Password requirements: `letters_digits`
3. **Authentication > URL Configuration**: Site URL を本番 URL に、Redirect URLs に本番 URL を追加

### 管理者ロールと開発用シード

管理画面（`/admin`）は `requireAdmin()`（`src/app/admin/_lib/auth.ts`）で `user_roles` テーブルの
`role = 'admin'` を検証する。ロールを付与する UI は無い。ローカルでは開発用シードを使う:

```bash
pnpm --filter web db:seed:dev
```

管理者（`admin@example.local`）と一般ユーザー 9 人（`alice@`（無級）/ `bob@`（5級）/ `erin@`（4級）/
`frank@`（3級）/ `grace@`（2級）/ `heidi@`（1級）/ `carol@`（最上位の段級位）/ `dave@`（無級・Pro を
手動付与）/ `ivan@`（ユーザー名未設定 = 登録の途中）、いずれも `example.local`）を投入する。
パスワードはいずれも `devpass1`、メール確認済み。冪等。DB と Supabase の両方がローカルホストで
なければ実行を拒否する。実装は `scripts/dev-seed.ts` で、各ユーザーに何が入るか（段級位・レッスン完了・
購入・特典の付与・通知）と、その状態で何を確かめられるかは同ファイルの TSDoc が正。

要点だけ: 段級位を持つユーザーには `user_ranks` と前提のレッスンの完了が入り、道場・ダッシュボードの
「次にやること」をログインするだけで確かめられる。無級の alice はチャレンジ成績が入っているため
`isFresh` ではない（登録したての状態は本物のアカウントで見る）。ランキングの母集団として
`seed_player01`〜`20` に全練習種別の成績（当月と前月）が入る。シードユーザーの成績・段級位・完了は
宣言された状態へ消して入れ直す。EXP は付与しない。`stripe_customers` には入れない（偽の顧客 ID で
Checkout が失敗する）。ネイティブ広告（`scripts/dev-seed/ad-creatives.ts`。架空のトラッキング ID
`localdev-web-22` / `localdev-app-22`）と `dev-` の slug のお知らせ（`scripts/dev-seed/announcements.ts`）
も入る。

既存のアカウントを管理者にするには、通常登録してから DB に INSERT する
（ローカル Supabase の Postgres は `127.0.0.1:54322`）:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = '<email>'
ON CONFLICT ON CONSTRAINT uq_user_role DO NOTHING;
"
```

`psql` が無い場合は Supabase Studio（`http://127.0.0.1:54323`）か `pnpm --filter web db:studio` で
`user_roles` に行を追加してもよい。

## Supabase ローカル環境

Supabase CLI は `apps/web` の devDependency として同梱している（`supabase/config.toml` が
CLI のバージョンと結合しているため）。グローバル版ではなく、必ず `apps/web` から `pnpm supabase ...` で
同梱版を実行する。

```bash
pnpm supabase start          # 起動（初回は Docker イメージのダウンロード）
pnpm supabase status -o json # API キーの取得
pnpm supabase stop           # 停止
```

- Supabase Studio: http://127.0.0.1:54323 / Mailpit: http://127.0.0.1:54324 /
  PostgreSQL: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- `failed to parse config: 'config.config' has invalid keys: <キー名>` が出たら、同梱版が未インストールで
  古いグローバル版にフォールバックしている。`config.toml` を書き換えず `pnpm install` を実行し、
  `pnpm supabase --version` が `package.json` の devDependency と一致することを確かめる

## Preview デプロイの DB は Supabase Branching から来る

`next build` は Postgres に繋がらないと完走しない（`src/app/sitemap.ts` が `announcements` を
SELECT する）。Preview を本番 DB に向ける選択は無い — `prebuild`（`scripts/prebuild-db.ts`）が
接続文字列を見て Drizzle の migrate を走らせるので、feature ブランチのマイグレーションが
本番に流れる。代わりに PR ごとに Supabase の **preview branch**（空の DB を持つ隔離インスタンス）
を使う。PR を開くと Supabase がブランチを作り、その接続情報を Vercel に **PR の git ブランチ
限定の Preview 変数**（本番連携と同じ 16 キー: `POSTGRES_*` / `SUPABASE_*` /
`NEXT_PUBLIC_SUPABASE_*`）として書き込み、再デプロイを起動する。空の DB は Vercel ビルドの
`prebuild` → `migrate.ts` が `supabase_auth_admin` ロールを検出して Drizzle のマイグレーションと
`drizzle/supabase/*.sql` を適用することでブートストラップされる。`supabase/migrations/` は
使っていないので Supabase 側の migrate / seed は何もしない。

PR のマージまたはクローズでブランチは削除され、従量課金（Micro 約 $0.32/日。Pro の
Compute Credits の対象外）も止まる。PR を何週間も開けたままにしない。

`claude/*` の PR（クラウドセッション・issue パイプライン）にも他と同じく Preview が立つ。
Supabase の連携はブランチ名で絞れず PR ごとに必ずブランチを作るので、`vercel.json` の
`ignoreCommand` で `claude/*` のビルドだけ止めると「DB に課金だけして Preview は立たない」
状態になる。そのため `vercel.json` に `ignoreCommand` を置かない（regions / crons は別）。

依存するダッシュボード設定（Supabase プロジェクト → Settings → Integrations）。どれも
失敗時の症状が「DB 未接続」と同じに見える:

- **GitHub integration の「Supabase changes only」: OFF。** ON だと `apps/web/supabase/` に
  変更の無い PR は無視され（bot が "no changes detected" とコメント）、スキーマが
  `apps/web/drizzle/` にあるこのリポジトリではどの PR も条件を満たさない。症状は
  `connect ECONNREFUSED 127.0.0.1:54322`（`scripts/_lib/database-url.ts` のローカル既定値へ
  フォールバック）
- **Vercel integration の「Preview」同期トグル: OFF。** 本番の接続文字列と service role key を
  Preview 全体にコピーする設定。ブランチ限定の同期はトグル OFF のまま PR open 時に行われる
- **Working directory: `apps/web`**（`supabase/` の親）。**Automatic branching: ON。
  Deploy to production: OFF** — 本番スキーマは本番ビルドの `prebuild` が適用する

設定を直した後に既存 PR へ再適用するには PR を close → reopen する。

preview branch の既知の穴: `config.toml` の `site_url = "http://localhost:3000"` のため Preview URL
では認証のリダイレクトが戻らず、本番ダッシュボードだけで設定した項目（OAuth の secret 等）は
複製されない。ビルドには影響しない。手順の正本は dotagents のスキル
`vercel-preview-supabase-branching`。

## 手元でブラウザの挙動を実測するとき

レイアウト・ハイドレーション・Server Action の失敗は、scratchpad に puppeteer-core を入れて
システム Chrome で開く（汎用の手順は dotagents のスキル `browser-measurement`）。このリポジトリで踏むもの:

- dev は `http://localhost:3000` で開く（`127.0.0.1` だと Next 16 の dev が `/_next/static/chunks/*.js` に
  403 を返し、curl では 200 なのに JS が一切動かないページになる）
- dev の右上の「LOCAL」リボンがアカウントメニューのボタンに重なるので `page.click()` ではなく要素の
  `click()` を呼ぶ
- 点数系の盤面は子ツモで `select` が 2 つあり `page.select("select")` は先頭しか触らない
- 採点待ちの灰色を撮るには alice で `/practice/yaku-han/play` を開き、正解は伏せられているので
  不正解が出るまで数問押す
- dev seed のユーザーで保存まで走らせたら `lesson_completions` 等の残骸を psql で消して元に戻す
