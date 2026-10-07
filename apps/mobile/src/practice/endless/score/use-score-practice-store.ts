import { createScorePracticeStore } from "@mahjong-scoring/features/practice/score/use-score-practice-store";

import { useRuleSettingsStore } from "../../../hooks/use-rule-settings-store";

/**
 * 和了形の点数計算のストア（モバイル）
 * 点数練習ストア
 *
 * 出題・判定・成績の操作は web と共通（features の `createScorePracticeStore`）。
 * ルール設定は端末ローカルの設定ストアから読む。
 */
export const useScorePracticeStore = createScorePracticeStore(() =>
  useRuleSettingsStore.getState(),
);
