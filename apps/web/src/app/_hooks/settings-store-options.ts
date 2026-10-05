import type { SettingsStoreOptions } from "@mahjong-scoring/features/settings/settings-store-options";

import { useHydrated } from "./use-hydrated";

/**
 * web の端末ローカル設定ストアの生成オプション
 * web 設定ストアオプション
 *
 * 保存先は localStorage。永続値はストア生成時に同期で載るため、サーバーの
 * HTML（常に既定値）と初回クライアント描画がずれないよう、派生フックは
 * {@link useHydrated} でハイドレーション完了まで既定値を返す。
 */
export const WEB_SETTINGS_STORE_OPTIONS: SettingsStoreOptions = {
  storage: () => localStorage,
  useHydrated,
};
