import { createAgariScoreStore } from "@mahjong-scoring/features/practice/score/use-agari-score-store";

import { useRuleSettingsStore } from "../../../hooks/use-rule-settings-store";
import { archiveAgariQuestion } from "../problem-archive";

/**
 * 和了形の点数計算のストア（モバイル）
 * 点数練習ストア
 *
 * 出題・判定・成績の操作は web と共通（features の `createAgariScoreStore`）。
 * ルール設定は端末ローカルの設定ストアから読む。生成できた問題は保存 API
 * へ送る（送信は待たず、失敗しても練習を止めない。`../problem-archive.ts`）。
 */
export const useAgariScoreStore = createAgariScoreStore(
  () => useRuleSettingsStore.getState(),
  archiveAgariQuestion,
);
