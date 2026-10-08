/**
 * 本番サイトの URL（正典）
 * 本番サイトURL
 *
 * web の robots.txt / sitemap.xml / canonical / JSON-LD / 認証コールバックと、
 * アプリが読む web の API が指す先。環境変数の設定漏れで `localhost` が本番に
 * 露出するのを防ぐため、フォールバック先を localhost ではなくここに固定する
 * （blindfold-chess と同方式）。
 */
export const PRODUCTION_SITE_URL = "https://score.mahjong.help";

/**
 * サイト URL を正規化する
 * サイトURL正規化
 *
 * - `??` ではなく `||` — Vercel で「変数だけ作って値が空」だと空文字が来る。
 *   `??` は空文字を通してしまい、`new URL("")`（web の layout の metadataBase）が
 *   全ルートを 500 にする
 * - 末尾スラッシュを落とす — `${SITE_URL}/lessons` が `//lessons` にならないように
 * - URL として不正な値（scheme 抜けの `score.mahjong.help` 等）は本番 URL に
 *   フォールバックする — 誤設定でリンクが歪むのは許容するが、落とさない。
 *   アプリも、壊れた URL を叩き続けるより本番を読む方がよい
 *
 * このモジュールは純粋。
 */
export function normalizeSiteUrl(raw: string | undefined): string {
  const candidate = (raw || PRODUCTION_SITE_URL).replace(/\/+$/, "");
  try {
    new URL(candidate);
    return candidate;
  } catch {
    return PRODUCTION_SITE_URL;
  }
}
