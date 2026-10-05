import { createMachiScoreStore } from "@mahjong-scoring/features/practice/machi-score/use-machi-score-store";

import { useRuleSettingsStore } from "../../../hooks/use-rule-settings-store";

/**
 * 待ち別点数計算のストア（モバイル）
 * 待ち別点数計算ストア
 *
 * 「待ち牌を選ぶ → マスに点数を当てはめる → 答え合わせ」の操作は web と
 * 共通（features の `createMachiScoreStore`）。ルール設定は端末ローカルの
 * 設定ストアから読む。
 */
export const useMachiScoreStore = createMachiScoreStore(() =>
  useRuleSettingsStore.getState(),
);
