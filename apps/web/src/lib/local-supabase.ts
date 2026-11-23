/**
 * 手元の Supabase（`apps/web` で `pnpm supabase start`）の待ち受け先
 * ローカルSupabase接続先
 *
 * 接続の環境変数が無いときに手元のスタックへ落ちるコードの既定値。
 * `.env.local` を `.env.example` のとおりに埋めていれば環境変数が勝ち、ここは読まれない。
 *
 * ポートを決めるのは `apps/web/supabase/config.toml`（`[api] port` / `[db] port`）で、
 * Supabase CLI はその値で待ち受ける。実行時のコードは TOML を読めないので、ここは写しで、
 * `local-supabase.test.ts` が `config.toml` と食い違ったら落とす。同じテストがモバイルの
 * 既定値（`apps/mobile/src/auth/supabase-config.ts` の `LOCAL_SUPABASE_API_PORT`）と
 * `apps/mobile/scripts/sim-release.sh` の `LOCAL_SUPABASE_URL` も検査する。
 *
 * このプロダクトは CLI の既定（543xx）ではなく 563xx を使う。同じ Mac で別のプロダクトの
 * Supabase も既定に近いポートで動かすため（理由・対応表・ブロックを変える手順は
 * `apps/web/README.md`「ローカルのポート」）。
 *
 * import を持たない。`drizzle.config.ts` と `scripts/*.ts`（tsx）が相対パスで読んでも
 * アプリのモジュールを引き込まないため。
 */

/** `config.toml` の `[api] port`: Supabase の HTTP API（Auth・Storage・REST） */
export const LOCAL_SUPABASE_API_PORT = 56321;

/** `config.toml` の `[db] port`: Postgres への直結（pooler を通らない） */
export const LOCAL_SUPABASE_DB_PORT = 56322;

/** 手元の Supabase の API のオリジン */
export const LOCAL_SUPABASE_API_URL = `http://127.0.0.1:${LOCAL_SUPABASE_API_PORT}`;

/**
 * 手元の Postgres の接続文字列
 *
 * Supabase CLI がローカルに固定で振るスーパーユーザーとパスワードで直結する。
 */
export const LOCAL_SUPABASE_DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${LOCAL_SUPABASE_DB_PORT}/postgres`;
