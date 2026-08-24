/**
 * 本番サイトの URL（正典）
 * 本番サイトURL
 *
 * robots.txt / sitemap.xml / canonical / JSON-LD / 認証コールバックが指す先。
 * 環境変数の設定漏れで `localhost` が本番に露出するのを防ぐため、
 * フォールバック先を localhost ではなくここに固定する（blindfold-chess と同方式）。
 */
const PRODUCTION_SITE_URL = "https://score.mahjong.help";

/**
 * サイト URL を正規化する。
 *
 * - `??` ではなく `||` — Vercel で「変数だけ作って値が空」だと空文字が来る。
 *   `??` は空文字を通してしまい、`new URL("")`（layout の metadataBase）が
 *   全ルートを 500 にする
 * - 末尾スラッシュを落とす — `${SITE_URL}/learn` が `//learn` にならないように
 * - URL として不正な値（scheme 抜けの `score.mahjong.help` 等）は本番 URL に
 *   フォールバックする — 誤設定でリンクが歪むのは許容するが、落とさない
 */
function normalizeSiteUrl(raw: string | undefined): string {
  const candidate = (raw || PRODUCTION_SITE_URL).replace(/\/+$/, "");
  try {
    new URL(candidate);
    return candidate;
  } catch {
    return PRODUCTION_SITE_URL;
  }
}

/**
 * サイト URL（canonical・sitemap・認証コールバック等で使用）
 * サイトURL設定
 *
 * 未設定・空・不正値なら {@link PRODUCTION_SITE_URL}。ローカル開発では
 * `.env.example` 由来の `.env.local` が `http://localhost:3000` を設定する。
 * プレビュー環境で自分自身の URL を指したいときは環境ごとに
 * `NEXT_PUBLIC_SITE_URL` を設定すること。
 */
export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

/**
 * パスワード最小文字数（Supabase config.toml の minimum_password_length と同期）
 * パスワード最小文字数
 */
export const MIN_PASSWORD_LENGTH = 6;
