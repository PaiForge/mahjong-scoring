import { createScoreSettingsStore } from "@mahjong-scoring/features/settings/use-score-settings-store";

import { WEB_SETTINGS_STORE_OPTIONS } from "@/app/_hooks/settings-store-options";

/**
 * 和了形の点数計算の設定ストア（web・localStorage に永続化）
 * 点数練習設定
 */
export const useScoreSettingsStore = createScoreSettingsStore(
  "mahjong-practice-settings",
  WEB_SETTINGS_STORE_OPTIONS,
);
