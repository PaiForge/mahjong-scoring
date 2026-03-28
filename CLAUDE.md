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
