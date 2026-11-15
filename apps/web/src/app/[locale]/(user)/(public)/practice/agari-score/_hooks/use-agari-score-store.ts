import { createAgariScoreStore } from "@mahjong-scoring/features/practice/score/use-agari-score-store";

import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";

import { archiveAgariQuestion } from "../../_lib/problem-archive";

/**
 * 和了形の点数計算のストア（web）
 * 点数練習ストア
 *
 * モジュールスコープに置き、盤面を離れても解答中の問題を保つ（料金ページを
 * 見て戻ったときに引き継ぐため）。生成できた問題は保存 API へ送る（送信は
 * 待たず、失敗しても練習を止めない。`_lib/problem-archive.ts`）。
 */
export const useAgariScoreStore = createAgariScoreStore(
  () => useRuleSettingsStore.getState(),
  archiveAgariQuestion,
);
