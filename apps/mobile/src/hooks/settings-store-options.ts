import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  passThroughHydration,
  type SettingsStoreOptions,
} from "@mahjong-scoring/features/settings/settings-store-options";

/**
 * モバイルの設定ストアの保存先（AsyncStorage・端末ローカル）
 * モバイル設定ストアオプション
 *
 * サーバー描画が無いので、永続値はハイドレーションを待たずにそのまま使う。
 */
export const MOBILE_SETTINGS_STORE_OPTIONS: SettingsStoreOptions = {
  storage: () => AsyncStorage,
  useHydrated: passThroughHydration,
};
