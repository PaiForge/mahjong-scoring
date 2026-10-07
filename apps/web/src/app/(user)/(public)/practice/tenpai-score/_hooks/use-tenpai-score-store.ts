import { createTenpaiScoreStore } from "@mahjong-scoring/features/practice/tenpai-score/use-tenpai-score-store";

import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";

/**
 * 聴牌形の点数計算のストア（web）
 * 聴牌形の点数計算ストア
 *
 * モジュールスコープに置き、盤面を離れても解答中の問題を保つ（料金ページを
 * 見て戻ったときに引き継ぐため）。
 */
export const useTenpaiScoreStore = createTenpaiScoreStore(() =>
  useRuleSettingsStore.getState(),
);
