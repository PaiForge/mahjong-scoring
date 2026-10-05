import { createMachiScoreStore } from "@mahjong-scoring/features/practice/machi-score/use-machi-score-store";

import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";

/**
 * 待ち別点数計算のストア（web）
 * 待ち別点数計算ストア
 *
 * モジュールスコープに置き、盤面を離れても解答中の問題を保つ（料金ページを
 * 見て戻ったときに引き継ぐため）。
 */
export const useMachiScoreStore = createMachiScoreStore(() =>
  useRuleSettingsStore.getState(),
);
