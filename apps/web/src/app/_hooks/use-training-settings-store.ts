import { createTrainingSettingsStore } from "@mahjong-scoring/features/settings/use-training-settings-store";

import { WEB_SETTINGS_STORE_OPTIONS } from "./settings-store-options";

/**
 * トレーニング設定ストア（web・localStorage に永続化）
 * トレーニング設定ストア
 *
 * 項目・既定値・保存名と派生フック（`useAutoAdvanceOnCorrect`）は features の
 * `createTrainingSettingsStore` が持つ。
 */
export const { useTrainingSettingsStore, useAutoAdvanceOnCorrect } =
  createTrainingSettingsStore(WEB_SETTINGS_STORE_OPTIONS);
