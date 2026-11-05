# scripts/claude-cloud — Claude Code クラウドセッションの足場

claude.ai/code・Claude モバイルアプリの Code タブ・`claude --cloud` から始めるセッションは、
Anthropic 管理の VM（Ubuntu 24.04、Node 20/21/22 のみ、Docker あり）に新規 clone された
状態で始まる。`.env.local` も DB も無い。ここのスクリプトで、VM でもローカルと同じ作業ができる。
スクリプトは dotagents のスキル `claude-cloud-session-bootstrap` から配備した汎用のもので、
**リポジトリ固有の値は `config.sh` だけ**。汎用スクリプトを直したいときはスキル側を直して
`bootstrap.py --update` で配り直す。

- `.claude/settings.json` の SessionStart hook が `session-start.sh` を実行する。
  `CLAUDE_CODE_REMOTE=true`（VM だけ）でなければ即終了するので、ローカルと GitHub Actions には
  影響しない。VM では Node 24 を PATH の先頭に置き（`CLAUDE_ENV_FILE` 経由で以降のコマンドにも効く）、
  依存を揃え、できること・できないことのサマリ（下の 2 スクリプトの使い方を含む）を Claude に渡す
- `setup-environment.sh` は claude.ai 側の環境の **Setup script** に貼るもの。Node 24 + pnpm を
  VM のスナップショットに入れておき、毎セッションの再インストールを避ける。リポジトリ非依存なので、
  他のリポジトリと同じ環境を共有できる。貼っていなくても hook がフォールバックで入れる（毎回数十秒遅くなるだけ）
- `bash scripts/claude-cloud/stack-up.sh` — Docker で Supabase を起動（`-x edge-runtime,...`。
  VM は rlimit を引き上げられず、CLI が edge-runtime にだけ付ける `--ulimit` で `supabase start`
  全体が落ちるため）、`.env.local` を `supabase status` から生成、`db:run-migrate` →
  `db:seed` → `db:seed:dev`、`next dev` を起動する。冪等。VM 以外では `.env.local` を壊さないよう
  実行を拒否する
- `bash scripts/claude-cloud/screenshot.sh /practice --login alice` — `/opt/pw-browsers` の
  Chromium（Chrome for Testing のダウンロードは VM から 403）でデスクトップ幅とスマホ幅を撮る。
  Claude が PNG を Read で開くとチャットに画像が出る。UI を変えたら両方の幅を見せる
- 品質ゲート（`pnpm lint` / `pnpm typecheck` / `pnpm test`）と上の 2 スクリプトは
  `permissions.allow` で事前許可してあり、スマホからの操作が権限プロンプトで止まらない
- VM でできないこと: 本番のシークレット（Google OAuth、Resend、GA）が要る確認。
  それは Remote Control か手元で行う
- PR ごとの Preview デプロイと Supabase Branching は `apps/web/CLAUDE.md`
