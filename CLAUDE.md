# mahjong-scoring

麻雀の点数計算を学習するアプリ。

## 関連リポジトリ

- **旧リポ**: `/Users/k0kishima/work/PaiForge/mahjong-score-drill` — 以前の実装。コードの移植元として参照する。
- **参考プロジェクト**: `/Users/k0kishima/work/checkmate-works/blindfold-chess` — チェスアプリ。技術スタックをこのプロジェクトと同一にする。

## コーディング規約

`docs/` submodule（[PaiForge/docs](https://github.com/PaiForge/docs)）で一元管理。新しいセッション開始時は以下を読み込むこと:

- `docs/coding-standards.md`
- `docs/extended-mspz.md`

## App Router コロケーション規約

`src/app/` 配下では、ルート規約ファイル（`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` 等）以外のディレクトリには `_` プレフィックスを付けること。

- `_components/` — コンポーネント
- `_hooks/` — カスタムフック
- `_lib/` — ユーティリティ

これにより、App Router のルート解決対象から除外され、ルートセグメントと明確に区別できる。

## Next.js Proxy（旧 Middleware）

- Next.js 16 では `middleware.ts` は `proxy.ts` に置き換えられた。**`middleware.ts` は使用禁止**
- セッションリフレッシュ等の処理は `apps/web/src/proxy.ts` に記述すること
- `middleware.ts` と `proxy.ts` が同時に存在するとビルドエラーになる

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

## 共通UIコンポーネント（`apps/web/src/app/_components/`）

- `PageTitle` — h1。全ページで使用
- `SectionTitle` — h2。緑のアクセントバー付き
- `ContentContainer` — ページコンテンツの max-w-3xl ラッパー。全ページで統一して使用し CLS を防ぐ
- `Sidebar` / `MobileHeader` / `MobileTabBar` — ナビゲーションシェル

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
/                           — LP（未ログイン）/ ダッシュボード（ログイン済み）
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

| パターン | 構成 | 該当 |
|---------|------|------|
| チャレンジ型 | 説明(page.tsx) → play → result | jantou-fu, mentsu-fu, machi-fu, tehai-fu, yaku, han-count |
| 無限訓練型 | play のみ（result なし） | score |

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
