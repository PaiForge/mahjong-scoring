import { createScoreSettingsStore } from "@mahjong-scoring/features/settings/use-score-settings-store";

import { WEB_SETTINGS_STORE_OPTIONS } from "@/app/_hooks/settings-store-options";

/**
 * 待ち別点数計算の設定ストア（永続化あり）
 * 待ち別点数計算設定
 *
 * 設定項目は点数計算総合演習と同じ（役の回答・満貫の簡略化・符の入力・
 * 自動で次へ・親子・点数帯）。保存名を分け、片方の練習で変えた設定が
 * もう片方に及ばないようにする。
 */
export const useMachiScoreSettingsStore = createScoreSettingsStore(
  "mahjong-machi-score-settings",
  WEB_SETTINGS_STORE_OPTIONS,
);
