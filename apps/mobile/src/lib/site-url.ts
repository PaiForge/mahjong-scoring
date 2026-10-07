/** 本番サイトの URL（web の `config.ts` の `PRODUCTION_SITE_URL` と同じ値） */
const PRODUCTION_SITE_URL = "https://score.mahjong.help";

/**
 * サイト URL を正規化する。空・不正値は本番 URL、末尾のスラッシュは落とす
 * サイトURL正規化
 *
 * web の `normalizeSiteUrl` と同じ扱い。設定漏れでアプリが壊れた URL を
 * 叩き続けるより、本番を読む方がよい。
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

/**
 * アプリが読む web の URL（広告配信 API 等）
 * サイトURL
 *
 * `EXPO_PUBLIC_SITE_URL` はバンドル時に埋め込まれる。手元の web を読ませる
 * ときは `EXPO_PUBLIC_SITE_URL=http://localhost:3000 pnpm start` のように
 * 与える（実機からは localhost ではなく Mac の LAN の IP を指す）。
 */
export const SITE_URL = normalizeSiteUrl(process.env.EXPO_PUBLIC_SITE_URL);
