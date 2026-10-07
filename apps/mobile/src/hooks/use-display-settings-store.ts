import { createDisplaySettingsStore } from "@mahjong-scoring/features/settings/use-display-settings-store";

import { MOBILE_SETTINGS_STORE_OPTIONS } from "./settings-store-options";

/** 表示設定ストア（モバイル・AsyncStorage に永続化） */
export const { useDisplaySettingsStore, useDoraDisplayMode, useFuHanOrder } =
  createDisplaySettingsStore(MOBILE_SETTINGS_STORE_OPTIONS);
