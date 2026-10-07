import { createScoreSettingsStore } from "@mahjong-scoring/features/settings/use-score-settings-store";

import { MOBILE_SETTINGS_STORE_OPTIONS } from "./settings-store-options";

/**
 * 和了形の点数計算の設定ストア（モバイル・AsyncStorage に永続化）
 * 点数練習設定
 *
 * 保存名は web と同じ（端末が別なので衝突はしない。揃えておくと同じ設定の
 * 保存名を 2 つ覚えずに済む）。
 */
export const useScoreSettingsStore = createScoreSettingsStore(
  "mahjong-practice-settings",
  MOBILE_SETTINGS_STORE_OPTIONS,
);

/**
 * 聴牌形の点数計算の設定ストア（モバイル・AsyncStorage に永続化）
 * 聴牌形の点数計算設定
 *
 * 設定項目は和了形の点数計算と同じ。保存名を分け、片方の練習で変えた設定が
 * もう片方に及ばないようにする（web と同じ）。
 */
export const useMachiScoreSettingsStore = createScoreSettingsStore(
  "mahjong-machi-score-settings",
  MOBILE_SETTINGS_STORE_OPTIONS,
);

/** 点数計算系の練習の設定ストア（和了形の点数計算・聴牌形の点数計算のどちらか） */
export type ScoreSettingsStoreHook = typeof useScoreSettingsStore;
