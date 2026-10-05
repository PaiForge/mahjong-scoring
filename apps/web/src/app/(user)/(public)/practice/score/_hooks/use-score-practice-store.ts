import { createScorePracticeStore } from "@mahjong-scoring/features/practice/score/use-score-practice-store";

import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";

/**
 * 点数計算総合演習のストア（web）
 * 点数練習ストア
 *
 * モジュールスコープに置き、盤面を離れても解答中の問題を保つ（料金ページを
 * 見て戻ったときに引き継ぐため）。
 */
export const useScorePracticeStore = createScorePracticeStore(() =>
  useRuleSettingsStore.getState(),
);
