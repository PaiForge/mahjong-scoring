import {
  normalizeSiteUrl,
  PRODUCTION_SITE_URL,
} from "@mahjong-scoring/features/site-url";

/** 手元の web（`pnpm --filter web dev`）のポート */
const DEV_WEB_PORT = 3000;

/**
 * アプリが読む web の URL を決める
 * サイトURL解決
 *
 * 1. `EXPO_PUBLIC_SITE_URL` があればそれ
 * 2. 開発中（Metro から読んだバンドル）なら、Metro を動かしている Mac の
 *    web。実機からは localhost が端末自身を指すため、Metro のホスト
 *    （`hostUri` = `192.168.x.x:8081`）のアドレスにポートだけ差し替える。
 *    web 版など hostUri が無いときは localhost
 * 3. それ以外（ストアのビルド）は本番
 *
 * 開発中に本番を読ませると、本番に無い API（デプロイ前の変更）は 404 に
 * なり、手元のデータも見えない。
 */
export function resolveSiteUrl({
  envUrl,
  isDev,
  hostUri,
}: {
  readonly envUrl: string | undefined;
  readonly isDev: boolean;
  readonly hostUri: string | undefined;
}): string {
  if (envUrl) return normalizeSiteUrl(envUrl);
  if (!isDev) return PRODUCTION_SITE_URL;
  const host = hostUri?.replace(/:\d+$/, "") || "localhost";
  return normalizeSiteUrl(`http://${host}:${DEV_WEB_PORT}`);
}
