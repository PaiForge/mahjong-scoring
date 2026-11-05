# packages/eslint-config — 共通 ESLint 設定

## TypeScript 7 と typescript-eslint の共存

アプリ（`apps/web`, `packages/core` 等）は TypeScript 7 を使う。ただし typescript-eslint は TS7 を
実行時に拒否するため、この package の devDependencies で `typescript` を `npm:@typescript/typescript6`
にエイリアスし、typescript-eslint が解決する `typescript` だけを 6 系に固定している。

- **この固定を外さないこと。** 外すと peer が TS7 に解決され `pnpm lint` が起動しなくなる
- typescript-eslint が TS7 を peer で受け入れたら不要（typescript-eslint#10940）
- エディタは「Use Workspace Version」が使えない（TS7 は `tsserver` を同梱しない）。TS7 用拡張を使う

リポジトリ固有の制限（features の `use-*.ts` 境界・理牌の比較関数・Hermes に無い組み込み・
管理画面の import 境界）はルートの `eslint.config.mjs` にあり、各規則のコメントが理由を持つ。
