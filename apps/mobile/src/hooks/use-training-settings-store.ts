import { createTrainingSettingsStore } from "@mahjong-scoring/features/settings/use-training-settings-store";

import { MOBILE_SETTINGS_STORE_OPTIONS } from "./settings-store-options";

/** トレーニング設定ストア（モバイル・AsyncStorage に永続化） */
export const { useTrainingSettingsStore, useAutoAdvanceOnCorrect } =
  createTrainingSettingsStore(MOBILE_SETTINGS_STORE_OPTIONS);
