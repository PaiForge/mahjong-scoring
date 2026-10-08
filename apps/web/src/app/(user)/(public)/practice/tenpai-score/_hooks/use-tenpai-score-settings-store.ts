import { createScoreSettingsStore } from "@mahjong-scoring/features/settings/use-score-settings-store";

import { WEB_SETTINGS_STORE_OPTIONS } from "@/app/_hooks/settings-store-options";

/**
 * 聴牌形の点数計算の設定ストア（永続化あり）
 * 聴牌形の点数計算設定
 *
 * 設定項目は和了形の点数計算と同じ（役の回答・5翻以上の翻数回答・符の入力・
 * 自動で次へ・親子・点数帯）。保存名を分け、片方の練習で変えた設定が
 * もう片方に及ばないようにする。
 */
export const useTenpaiScoreSettingsStore = createScoreSettingsStore(
  "mahjong-tenpai-score-settings",
  WEB_SETTINGS_STORE_OPTIONS,
);
