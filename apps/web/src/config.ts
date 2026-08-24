/**
 * 本番サイトの URL（正典）
 * 本番サイトURL
 *
 * robots.txt / sitemap.xml / canonical / JSON-LD が指す先。
 * 環境変数の設定漏れで `localhost` が本番に露出するのを防ぐため、
 * フォールバック先を localhost ではなくここに固定する。
 */
const PRODUCTION_SITE_URL = "https://score.mahjong.help";

/** 末尾スラッシュを落とす（`${SITE_URL}/learn` が `//learn` にならないように） */
function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

/**
 * サイト URL（canonical・sitemap・認証コールバック等で使用）
 * サイトURL設定
 *
 * `NEXT_PUBLIC_SITE_URL` があればそれを優先する。プレビュー環境で自分自身の
 * URL を指したい場合は環境ごとにこの変数を設定すること。
 *
 * 未設定時は本番ビルドなら {@link PRODUCTION_SITE_URL}、それ以外は localhost。
 * `VERCEL_PROJECT_PRODUCTION_URL` は `NEXT_PUBLIC_` 接頭辞を持たず
 * クライアントバンドルでは解決できないため使わない（この定数は
 * MIN_PASSWORD_LENGTH と同居しており client からも import される）。
 */
export const SITE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === "production"
      ? PRODUCTION_SITE_URL
      : "http://localhost:3000"),
);

/**
 * パスワード最小文字数（Supabase config.toml の minimum_password_length と同期）
 * パスワード最小文字数
 */
export const MIN_PASSWORD_LENGTH = 6;
