# mahjong-scoring

麻雀の点数計算を学習するアプリ。

## 関連リポジトリ

- **旧リポ**: `/Users/k0kishima/work/PaiForge/mahjong-score-drill` — 以前の実装。コードの移植元として参照する。
- **参考プロジェクト**: `/Users/k0kishima/work/checkmate-works/blindfold-chess` — チェスアプリ。技術スタックをこのプロジェクトと同一にする。

## コーディング規約

`docs/` submodule（[PaiForge/docs](https://github.com/PaiForge/docs)）で一元管理。新しいセッション開始時は以下を読み込むこと:

- `docs/coding-standards.md`
- `docs/extended-mspz.md`

## SPEC ファイルは足場であり成果物ではない

リポジトリルートの `SPEC*.md` は機能を作るための思考の足場で、記録ではない。
`.gitignore` 済みのため**作者のマシンにしか存在しない**。

- **コード・コメント・TSDoc から `SPEC*.md` を参照しない。** 他の読者には最初から
  壊れたリンクであり、参照した時点でそのコメントは自己完結性を失う。説明はコメント
  自身が全文を持つこと。長くなるなら、それが制約する宣言の TSDoc に置く —
  リポジトリ内で、コードと一緒にバージョン管理される場所に
- **機能を完成させるブランチで SPEC を削除する。** その際、コードから再導出できない
  内容（採らなかった選択肢とその理由、外部プラットフォームの挙動）は該当コードの
  TSDoc へ移し、未実装フェーズは単独で読める形で issue に移す
- 手順書・成果物リスト・進捗チェックボックス・ファイルパス一覧はそのまま捨てる。
  コードとテストと git 履歴が真実のソースであり、パス一覧は静かに腐る

## App Router コロケーション規約

`src/app/` 配下では、ルート規約ファイル（`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` 等）以外のディレクトリには `_` プレフィックスを付けること。

- `_components/` — コンポーネント
- `_hooks/` — カスタムフック
- `_lib/` — ユーティリティ

これにより、App Router のルート解決対象から除外され、ルートセグメントと明確に区別できる。

## `"use client"` 使用基準

- `"use client"` は本当にクライアント側の機能（hooks, event handlers, browser API）が必要な場合のみ付与する
- `useTranslations()` だけのために `"use client"` を付けない。サーバーコンポーネントでは `getTranslations()` from `next-intl/server` を使用する
- 新規コンポーネント作成時にサーバーコンポーネントとして実装できないか必ず検討する

## Next.js Proxy（旧 Middleware）

- Next.js 16 では `middleware.ts` は `proxy.ts` に置き換えられた。**`middleware.ts` は使用禁止**
- セッションリフレッシュ等の処理は `apps/web/src/proxy.ts` に記述すること
- `middleware.ts` と `proxy.ts` が同時に存在するとビルドエラーになる

## TypeScript 7 と typescript-eslint の共存

アプリ（`apps/web`, `packages/core`）は TypeScript 7 を使う。ただし typescript-eslint は TS7 を実行時に拒否するため、`packages/eslint-config` の devDependencies で `typescript` を `npm:@typescript/typescript6` にエイリアスし、typescript-eslint が解決する `typescript` だけを 6 系に固定している。

- **この固定を外さないこと。** 外すと peer が TS7 に解決され `pnpm lint` が起動しなくなる
- typescript-eslint が TS7 を peer で受け入れたら不要（typescript-eslint#10940）
- エディタは「Use Workspace Version」が使えない（TS7 は `tsserver` を同梱しない）。TS7 用拡張を使うこと

## プロジェクト構成

```
apps/web/          — Next.js 16 (Turbopack, App Router, Tailwind CSS v4)
packages/core/     — 共通ドメインロジック（問題生成等）。@pai-forge/riichi-mahjong 依存
packages/eslint-config/ — 共通 ESLint 設定（PaiForge コーディング規約準拠）
```

## i18n

- `next-intl` をルーティングなしで使用（locale は `ja` 固定、将来英語対応予定）
- 辞書ファイル: `apps/web/src/messages/ja.json`
- サーバーコンポーネント: `getTranslations()` / クライアントコンポーネント: `useTranslations()`
- UIコンポーネントに日本語をベタ書きしない

## 共通UIコンポーネント

置き場所は 2 つに分かれる。ディレクトリで「管理画面が使うか」を表現している。

| ディレクトリ                           | 中身                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/app/_components/`        | ユーザー向け画面と管理画面（`/admin`）で共有するもの。`SkeletonBar` / `PageTitleSkeleton` / `ModalShell` / `GlobalToaster` / `_lib/link-classes` のみ |
| `apps/web/src/app/(user)/_components/` | ブランド UI（太枠・ハードシャドウ・押し込み演出の世界）。上記以外はすべてここ                                                                         |

新しい共通コンポーネントは原則 `(user)/_components/` に置く。`app/_components/`
へ足すのは管理画面からも使うときだけ。`app/_components/` 側から
`(user)/_components/` を import しない（依存の向きを一方向に保つ）。

例外は 2 つだけ:

- ルートの `app/not-found.tsx` / `app/error.tsx` — `(user)` 配下ではないがユーザーに見える画面なので、ブランド UI を使う
- 管理画面の `PaginationNav` — 元々ユーザー向けと同じ見た目なので `(user)/_components/` のものを共有する

### 主なコンポーネント

- `PageTitle` — h1。全ページで使用
- `SectionTitle` — h2。濃い緑の pill に白抜き
- `ContentContainer` — ページコンテンツの max-w-3xl ラッパー。全ページで統一して使用し CLS を防ぐ
- `Sidebar` / `MobileHeader` / `MobileTabBar` — ナビゲーションシェル
- `DataTable` / `DataTableHeaderCell` — データテーブルの外枠と見出しセル。表を作るときは直接 `<table>` を書かない
- `LinkRow` / `LinkRowList` — 読む・見るためのリンク 1 行とその枠。太枠 + ハードシャドウ + 押し込みは「押して始める面」（練習・試験・登録）の記号なので、ページを読みに行くだけ / 一覧を見に行くだけの導線はカードにせずこれを使う
- `SkeletonBar` — 読み込み中のプレースホルダ矩形。`animate-pulse` と背景色を直接書かない。角丸は `radius`（md / lg / xl / full）で指定し、`className` に `rounded*` を書かない
- `PageTitleSkeleton` — 見出しのプレースホルダ帯。`PageTitle` / `AdminPageTitle` の子として置く
- `SectionTitleSkeleton` — 見出しのプレースホルダ pill。矩形で代用せずこれを使う（`SectionTitle` 自身を描画するため実物と高さ・形が一致する）
- `icons/OutlineIcon` — 線画アイコンの svg 外殻。新しい線画アイコンはこれを使う
- `HighlightPanel` — 地の文から浮かせて読ませる琥珀色の囲み（教本のコラム・計算手順・注意書き）。`border-amber-500 bg-amber-50/60` の一式をページ側で直接書かない
- `SettingsCard` / `SettingToggleRow` — 設定ページの項目カードとトグル行。設定項目を足すときに `<input type="checkbox">` とスイッチの markup を書き起こさない

### 影

影は「押せる」の記号。`shadow-*` を持つのは次の 2 つだけ。

- 押せる面 — ボタン（`buttonClasses()` が `press-*` と一緒に付ける）、カード全体が
  リンクになっているもの、トグルのつまみ
- 最外の白カード（`ContentContainer` の `sm:shadow-lg`）— 地の斜線から浮かせる 1 枚

押せないもの（表示だけのカード・表・見出し pill・モーダルパネル・トースト・
アイコンの丸）には付けない。区切りは太枠（`border-3` / `border-4 border-ink`）が
持つ。マイページのカードが既定の姿。

管理画面（`data-skin="plain"`）は別のビジュアル言語のため対象外。

### ボタン（`apps/web/src/app/(user)/_components/`）

- `Button` — `<button>` のボタン。`LinkButton` — `next/link` のボタン
- 見た目は `_lib/button-classes.ts` の `buttonClasses()` に集約。`border-3 border-ink bg-primary-500 ...` のような一式をページ側で直接書かない
- `variant`（primary / secondary / neutral / danger / warning / dangerOutline）、`size`（sm / md / lg / xl）、`fullWidth`、`disabled` で指定する。`className` は余白などレイアウト調整用で、色・枠・影を上書きしない
- 無効時は `disabled` を渡す。呼び出し側で `<span aria-disabled>` を書き分けない（`LinkButton` が span を描画する）
- 外部リンクの `<a>` など上記に乗らない要素には `buttonClasses()` を直接使う
- 「押せる面」（カード全体がリンクになっているもの。`LinkRow` 等）はボタンではないため対象外
- 管理画面（`/admin`）は別のビジュアル言語のため対象外。`(user)/_components/` に置いているのはその意思表示でもある

### テキストリンク（`apps/web/src/app/_components/_lib/link-classes.ts`）

管理画面でも使うため `app/_components/` 側に置いている。

テキストリンクは `TEXT_LINK_CLASSES`（グレー + 常時下線）の 1 種類だけ。
本文中のリンクもページ間の移動もこれを `className` に貼る。緑（primary）は
ボタン＝「押して始める面」の色として取ってあるためリンクには使わない
（緑なら始まる / グレーの下線なら移動する）。強調したい導線が出てきたら、
リンクの色ではなくボタンで示す。
`text-primary-* hover:underline` のようなリンクの class をページ側で直接書かない。
リンク風の `<button>` にも同じ定数を使う。行全体がクリック対象になるもの
（`LinkRow` 等）は行の中のタイトルに `ROW_LINK_TITLE_CLASSES` を使う
（hover が行に追随する版）。下線は常時引く — hover でしか出ない
アフォーダンスはタッチ端末では一切見えない。

## ローディング境界（loading.tsx）

`src/app/loading-boundaries.test.ts` が「すべての page.tsx は祖先に loading.tsx を
ちょうど 1 つ持つ」ことを検査する。Next の挙動に由来する制約で、どちらに違反しても
スケルトンが機能しない（2026-08 に本番ビルドで実測）。

- **入れ子にしない** — `<Link>` のプリフェッチは最も外側の境界までしか取らないため、
  内側の個別スケルトンは速いサーバでは一度も出ず、遅いサーバでは本文直前に一瞬出るだけになる
- **leaf に置く** — React は遷移中、マウント済みの Suspense のフォールバックを出さない。
  祖先の共通 loading.tsx は同じセグメント内の遷移（`/learn` → `/learn/x` 等）で効かず、
  サーバ応答までクリックが無反応になる
- 複数の子ルートを 1 枚で受けるときは `practice/_components/practice-loading.tsx` のように
  `usePathname()` で振り分ける。index ページだけ固有にしたいときは page.tsx と loading.tsx を
  route group に退避する（`mypage/(home)`, `practice/(index)`, `admin/(dashboard)`）
- **祖先に loading.tsx があると `notFound()` は 404 を返さない** — Suspense の
  フォールバックを流し始めた時点でヘッダが確定するため、ページ本体でも
  `generateMetadata` でも `notFound()` はソフト 404（200）になる（2026-08 に
  本番ビルドで実測）。slug を事前に列挙できるルートは
  `generateStaticParams` + `export const dynamicParams = false` で弾くこと。
  未知の slug がページを描画する前にルーティングで落ちるため、本物の 404 に
  なる（`/reference/glossary/[slug]` 参照）。列挙できない DB 由来のルート
  （`/announcements/[slug]`, `/u/[username]`）は 200 のまま残るが、Next が
  not-found の描画に `<meta name="robots" content="noindex">` を自動で入れる
  ため索引はされない。ページ側で noindex を足す必要はない
- ドロップダウン等のメニュー内 `<Link>` は閉じている間も mount したままにする（`invisible` + `inert`）。
  開くまで unmount しているとプリフェッチが開いてから始まり、すぐ押すとサーバ応答まで無反応になる。
  Next 16 の Segment Cache では動的ルートの prefetch に 2 往復（`/_tree` → loading 境界）かかる。
  `router.prefetch()` で先読みする案は Link 自身のプリフェッチと干渉して逆に遅くなったので使わない
  （`auth-nav-item.tsx` 参照）

## ボタンの下の補助リンクの余白（`apps/web/src/app/_components/_lib/spacing.ts`）

ボタンの下に「移動するだけ」のテキストリンクを添える構造（結果画面の
「練習一覧に戻る」、登録 CTA の「ログイン」、設定ゲートの「ログイン」、
プロフィール編集の「スキップ」）の間隔は `SUB_LINK_GAP`（`gap-4` = 16px）に
統一する。押し間違いを防ぐ縦のタップ間隔として `PracticeFooterActions` が
定めている `gap-3`（12px）より一段広く、「ボタンの一部ではない」ことを
距離で示す値。

- **必ず gap で当てる。** リンク側に `pt-*` / `mt-*` を足して差を作らない —
  親の `space-y-*` との合算になり、実際の余白がその場所の親によって変わる
- ボタンが複数並ぶときは、ボタン群を `gap-3` の内側コンテナに包み、その外側に
  `SUB_LINK_GAP` を当てる（`result-view.tsx` が既定の姿）
- 結果画面の登録 CTA の高さはこの余白に連動する。値を変えたら
  `ResultBlockSection` の `min-h` を実測し直すこと

## 角丸

素の `rounded` は Tailwind の非推奨トークン `--radius`（0.25rem 固定）を参照しており、
`globals.css` で取り直した `--radius-*` の影響を受けない。丸みを揃えたい箇所では
`rounded-md` 以降のサイズ付きユーティリティを使うこと。

## 行間

本文の行間は `globals.css` の `@theme` で `--leading-relaxed` を取り直して一元管理する。
長文の段落には `leading-relaxed` を付けるだけでよく、ページ個別に `leading-*` の
数値を上書きしない。全体の行間を変えたいときは `--leading-relaxed` を触ること。

## 牌画像（@pai-forge/mahjong-react-ui）

- `Hai` コンポーネントで牌を表示（base64埋め込み画像）
- React Native 対応パッケージのため `apps/web/src/shims/react-native.ts` で web 用 shim を提供
- ライブラリの `styles.css` は Tailwind v4 と競合するためインポート禁止。牌サイズクラスは `globals.css` に抽出済み
- `Hai` を使うコンポーネントは `"use client"` が必要

## チャレンジモード（練習共通仕様）

- 制限時間 60 秒、ミス 3 回で終了
- ページ遷移直後にカウントダウンオーバーレイ（3, 2, 1）→ タイマー開始
- 「準備はいいですか？」のような確認画面は出さない
- 共通フック: `apps/web/src/app/(public)/practice/_hooks/` に `use-timed-session.ts`, `use-game-timer.ts`, `use-countdown.ts`
- 円形タイマー: `apps/web/src/app/(public)/practice/_components/quiz-timer.tsx`

## ルート構成

```
/                           — LP（静的・cookie を読まない）。ログイン済みは proxy が /dashboard へ rewrite
/dashboard                  — ダッシュボード（ログイン済みトップの実体。URL は「/」のまま表示される）
/sign-in                    — ログイン（Google OAuth + メール）
/sign-up                    — アカウント登録（Google OAuth + メール）
/sign-up/verify-email       — メール確認待ち（確認メール再送機能付き）
/forgot-password            — パスワードリセットリンク送信
/reset-password             — 新パスワード設定（リセットメールのリンクから遷移）
/practice                   — 練習一覧
/practice/jantou-fu         — 雀頭符練習説明（learn へのリンク付き）
/practice/jantou-fu/play    — 練習本体
/practice/jantou-fu/result  — 結果表示
/learn/jantou-fu            — 雀頭の符計算（教本ページ、SEO重視でSSR）
```

### 練習ページ構成パターン

練習種別により2つのパターンが存在する:

| パターン     | 構成                           | 該当                                                              |
| ------------ | ------------------------------ | ----------------------------------------------------------------- |
| チャレンジ型 | 説明(page.tsx) → play → result | jantou-fu, mentsu-fu, machi-fu, mentsu-jantou-fu, yaku, han-count |
| 無限訓練型   | play のみ（result なし）       | score                                                             |

- `score-calculation`, `score-table` はチャレンジ型だが説明ページ（page.tsx）は未作成
- `score` は終了条件がなく無限ループする訓練機能のため、result ページを持たない

## 認証（Email + Google OAuth）

### 環境変数

- `NEXT_PUBLIC_SITE_URL` — 認証コールバック URL の生成に使用。本番環境では本番 URL を設定すること

### 本番環境の Supabase Dashboard 設定（必須）

メール認証を本番環境で動作させるには、以下の設定が必要:

1. **Authentication > Providers > Email**: Email provider を有効化
2. **Authentication > Settings**:
   - "Confirm email" を有効化
   - "Secure password change" を有効化
   - "Double confirm email changes" を有効化
   - Minimum password length: `6`
   - Password requirements: `letters_digits`
3. **Authentication > URL Configuration**:
   - Site URL を本番 URL に設定
   - Redirect URLs に本番 URL を追加

これらの設定は `apps/web/supabase/config.toml` のローカル設定と同期させること。

### アーキテクチャ

- IP ベースのインメモリレートリミット（`src/lib/rate-limit-ip.ts`）+ Supabase サーバーサイドレートリミットの二重防御
- アカウント列挙防止: サインインは汎用エラー、パスワードリセットは常に成功を返す
- パスワードバリデーション: Zod スキーマ（`src/lib/validations/password.ts`）で client/server 両方で検証

### 管理者ロールの割り当て

管理画面（`/admin`）は `requireAdmin()`（`src/app/admin/_lib/auth.ts`）で `user_roles` テーブルの `role = 'admin'` を検証する。ロールを付与する UI は無い。

ローカルでは開発用シードを使う:

```bash
pnpm --filter web db:seed:dev
```

管理者（`admin@example.local`）と一般ユーザー3人（`alice@`（無級）/ `bob@`（5級）/ `carol@`（最上位の段級位）、いずれも `example.local`）を投入する。パスワードはいずれも `devpass1`、メール確認済みなのでそのままサインインできる。冪等なので何度実行してもよい。DB と Supabase の両方がローカルホストでなければ実行を拒否する。実装は `apps/web/scripts/dev-seed.ts`。

段級位を持つユーザーには `user_ranks` と前提章の読了（次に取る級の前提章を含む）が入る。道場の「現在の段級位 / 次の段級位」とダッシュボードの昇級試験カードを、ログインするだけで確認できる。

これに加えて、ランキングの母集団を作るためだけの `seed_player01`〜`seed_player20`（`player01@example.local` …）を投入する。上位3位のメダル・ページ送り・1 ページに収まらない自分の順位を出す「あなた」の行は、人数が足りないと画面に出ないため。全シードユーザーに全練習種別のチャレンジ成績（当月と前月の 2 件ずつ）が入り、総合・月間の両方のランキングが埋まる。成績の値はユーザー名から決まる擬似乱数なので、何度実行しても順位は変わらない。昇級試験の成績は「その級を保持していれば合格ライン以上・未保持なら未満」に制約され、宣言された段級位と矛盾しない。ただしシードユーザーの既存の成績・段級位・章の読了は宣言された状態へ消して入れ直すため、シードユーザーとして遊んだ記録は残らない。EXP は付与しないので、EXP の画面を見たいときは実際に練習を 1 回走らせること。

既存のアカウントを管理者にしたい場合は DB に直接 INSERT する:

1. 対象ユーザーをメールアドレスで通常登録する（`auth.users` に行ができる）
2. 以下の SQL で admin ロールを付与する（ローカル Supabase の Postgres は `127.0.0.1:54322`）:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = '<email>'
ON CONFLICT ON CONSTRAINT uq_user_role DO NOTHING;
"
```

`psql` が無い場合は Supabase Studio（`http://127.0.0.1:54323`）の Table Editor か `pnpm --filter web db:studio`（Drizzle Studio）で `user_roles` に行を追加してもよい。

## Supabase ローカル環境

Supabase CLI は `apps/web` の devDependency として同梱している（`supabase/config.toml` が
CLI のバージョンと結合しているため）。グローバルインストール版ではなく、必ず `apps/web` から
`pnpm supabase ...` で同梱版を実行すること。

```bash
cd apps/web
pnpm supabase start          # 起動（初回は Docker イメージのダウンロード）
pnpm supabase status -o json # API キーの取得
pnpm supabase stop           # 停止
```

- Supabase Studio: http://127.0.0.1:54323
- Mailpit（メールテスト用）: http://127.0.0.1:54324
- PostgreSQL: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

### `config.config has invalid keys` が出たら

`pnpm supabase` は同梱版が未インストールだと黙ってグローバル版（Homebrew 等）に
フォールバックする。古いグローバル版が新しい `config.toml` のキーを知らないため、
`failed to parse config: 'config.config' has invalid keys: <キー名>` になる。
`config.toml` を書き換えるのではなく `pnpm install` を実行し、
`pnpm supabase --version` が `apps/web/package.json` の devDependency と
一致することを確認すること。

## Database Migration

- **Always use `pnpm db:run-migrate`** — This runs `scripts/migrate.ts`, which executes Drizzle migrations and then applies Supabase-specific SQL (RLS policies, FK constraints) in Supabase environments.
- **Do NOT use `drizzle-kit push`** — `push` bypasses migration tracking and directly syncs the schema. This causes the migration journal and actual DB state to diverge.
- **Schema changes workflow**: Edit `src/lib/db/schema.ts` → run `npx drizzle-kit generate --name=<migration_name>` → run `pnpm db:run-migrate`
- **Always specify `--name` when generating migrations** — Use snake_case (e.g., `create_profiles_table`, `add_avatar_to_profiles`)
- **Migration file structure**:
  - `drizzle/*.sql` + `drizzle/meta/` — Drizzle-managed migrations (auto-generated)
  - `drizzle/supabase/` — Supabase-specific SQL (RLS, FK, permissions). Applied by `migrate.ts` in Supabase environments.

## Feature Documentation

機能固有のドキュメントは各機能の `page.tsx` に TSDoc コメントとして記述する。グローバルファイル（この CLAUDE.md 等）の肥大化を避けるため。

### 規約

- **Feature Name** — 1行目に機能名を記載する（例: `練習一覧`）。セッション中のキーワード grep 用
- `@description` — 機能の目的・概要
- `@flow` — ユーザーの操作フロー・画面遷移

コードから自明な情報（ルート、意味のある名前のクエリパラメータなど）は記述しない。

## コミットルール

- ユーザーが明示的に指示した場合のみコミットする
