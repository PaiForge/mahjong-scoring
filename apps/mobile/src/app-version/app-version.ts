import Constants from "expo-constants";
import { Platform } from "react-native";
import type { MobileAppPlatform } from "@mahjong-scoring/features/app-version/mobile-api";

/**
 * このアプリの版（`app.json` の `version`。ストアに出す版）
 * アプリバージョン
 *
 * ビルド番号（EAS が上げる）ではなく、利用者がストアで見る版で比べる。
 * 読めなければ undefined（最低バージョンで止めない）。
 */
export const APP_VERSION: string | undefined = Constants.expoConfig?.version;

/**
 * このアプリの OS。画面確認用の web 版では undefined（最低バージョンを読まない）
 * アプリプラットフォーム
 */
export const APP_PLATFORM: MobileAppPlatform | undefined =
  Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : undefined;

/**
 * OS ごとのストアのアプリのページ
 *
 * iOS の ID は App Store Connect の数値の App ID（`eas.json` の `ascAppId`）。
 * この URL は 1.0 のバイナリにも焼き込まれ、後から直せないので、ストアが
 * 変えない形（ID・パッケージ名）だけで組む。
 */
const STORE_URLS: Readonly<Record<MobileAppPlatform, string>> = {
  ios: "https://apps.apple.com/app/id6820905974",
  android: "https://play.google.com/store/apps/details?id=help.mahjong.score",
};

/** このアプリのストアのページ。web 版では undefined */
export const STORE_URL: string | undefined =
  APP_PLATFORM === undefined ? undefined : STORE_URLS[APP_PLATFORM];
