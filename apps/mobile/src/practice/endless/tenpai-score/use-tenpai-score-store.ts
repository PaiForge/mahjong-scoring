import { createTenpaiScoreStore } from "@mahjong-scoring/features/practice/tenpai-score/use-tenpai-score-store";

import { useRuleSettingsStore } from "../../../hooks/use-rule-settings-store";

/**
 * 聴牌形の点数計算のストア（モバイル）
 * 聴牌形の点数計算ストア
 *
 * 「待ち牌を選ぶ → マスに点数を当てはめる → 答え合わせ」の操作は web と
 * 共通（features の `createTenpaiScoreStore`）。ルール設定は端末ローカルの
 * 設定ストアから読む。
 */
export const useTenpaiScoreStore = createTenpaiScoreStore(() =>
  useRuleSettingsStore.getState(),
);
