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

## チャレンジモード（ドリル共通仕様）

- 制限時間 60 秒、ミス 3 回で終了
- ページ遷移直後にカウントダウンオーバーレイ（3, 2, 1）→ タイマー開始
- 「準備はいいですか？」のような確認画面は出さない
- 共通フック: `apps/web/src/app/(public)/practice/_hooks/` に `use-timed-session.ts`, `use-game-timer.ts`, `use-countdown.ts`
- 円形タイマー: `apps/web/src/app/(public)/practice/_components/quiz-timer.tsx`

## ルート構成

```
/                           — LP（未ログイン）/ ダッシュボード（ログイン済み）
/practice                   — ドリル一覧
/practice/jantou-fu         — 雀頭符ドリル説明（learn へのリンク付き）
/practice/jantou-fu/play    — ドリル本体
/practice/jantou-fu/result  — 結果表示
/learn/jantou-fu            — 雀頭の符計算（教本ページ、SEO重視でSSR）
```

## Database Migration

- **Always use `pnpm db:run-migrate`** — This runs `scripts/migrate.ts`, which executes Drizzle migrations and then applies Supabase-specific SQL (RLS policies, FK constraints) in Supabase environments.
- **Do NOT use `drizzle-kit push`** — `push` bypasses migration tracking and directly syncs the schema. This causes the migration journal and actual DB state to diverge.
- **Schema changes workflow**: Edit `src/lib/db/schema.ts` → run `npx drizzle-kit generate --name=<migration_name>` → run `pnpm db:run-migrate`
- **Always specify `--name` when generating migrations** — Use snake_case (e.g., `create_profiles_table`, `add_avatar_to_profiles`)
- **Migration file structure**:
  - `drizzle/*.sql` + `drizzle/meta/` — Drizzle-managed migrations (auto-generated)
  - `drizzle/supabase/` — Supabase-specific SQL (RLS, FK, permissions). Applied by `migrate.ts` in Supabase environments.

## コミットルール

- ユーザーが明示的に指示した場合のみコミットする
