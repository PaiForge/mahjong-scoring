import { getRequestConfig } from "next-intl/server";
import { messages } from "@mahjong-scoring/messages/ja";

import { DEFAULT_LOCALE } from "./locales";

/**
 * next-intl のリクエスト設定
 *
 * 辞書は `@mahjong-scoring/messages`（モバイルと共有）が持つ。UI のロケールは
 * 日本語固定なので日本語の辞書をそのまま渡す。ロケールを増やすときは
 * messages パッケージに辞書を足し、ここでロケールごとに引き分ける。
 */
export default getRequestConfig(async () => ({
  locale: DEFAULT_LOCALE,
  messages,
}));
