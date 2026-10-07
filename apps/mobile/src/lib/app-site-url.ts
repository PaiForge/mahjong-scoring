import Constants from "expo-constants";

import { resolveSiteUrl } from "./site-url";

/**
 * アプリが読む web の URL（広告配信 API 等）。決め方は {@link resolveSiteUrl}
 * サイトURL
 *
 * `EXPO_PUBLIC_SITE_URL` はバンドル時に埋め込まれる。開発中に手元以外の
 * web（Preview 等）を読ませたいときに与える。
 */
export const SITE_URL = resolveSiteUrl({
  envUrl: process.env.EXPO_PUBLIC_SITE_URL,
  isDev: __DEV__,
  hostUri: Constants.expoConfig?.hostUri,
});
