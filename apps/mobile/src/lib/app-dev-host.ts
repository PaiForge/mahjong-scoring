import { NativeModules } from "react-native";
import Constants from "expo-constants";

import { resolveDevHostUri } from "./dev-host";

/**
 * 読み込んだバンドルの URL。読めなければ undefined
 *
 * React Native の `SourceCode` モジュールの定数。画面確認用の web 版には
 * このモジュールが無い。
 */
function readScriptUrl(): string | undefined {
  const sourceCode: unknown = NativeModules.SourceCode;
  if (typeof sourceCode !== "object" || sourceCode === null) return undefined;
  if (!("getConstants" in sourceCode)) return undefined;
  if (typeof sourceCode.getConstants !== "function") return undefined;
  const constants: unknown = sourceCode.getConstants();
  if (typeof constants !== "object" || constants === null) return undefined;
  if (!("scriptURL" in constants)) return undefined;
  return typeof constants.scriptURL === "string"
    ? constants.scriptURL
    : undefined;
}

/**
 * 開発中に Metro を動かしているホスト（`host:port`）。決め方は {@link resolveDevHostUri}
 * 開発ホスト
 *
 * 手元の Supabase と web の接続先を組むのに使う（`supabase-client.ts`・`app-site-url.ts`）。
 */
export const DEV_HOST_URI = resolveDevHostUri({
  hostUri: Constants.expoConfig?.hostUri,
  scriptUrl: readScriptUrl(),
});
