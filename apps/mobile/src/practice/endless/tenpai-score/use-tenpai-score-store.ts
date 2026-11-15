import { createTenpaiScoreStore } from "@mahjong-scoring/features/practice/tenpai-score/use-tenpai-score-store";

import { useRuleSettingsStore } from "../../../hooks/use-rule-settings-store";
import { archiveTenpaiQuestion } from "../problem-archive";

/**
 * 聴牌形の点数計算のストア（モバイル）
 * 聴牌形の点数計算ストア
 *
 * 「待ち牌を選ぶ → マスに点数を当てはめる → 答え合わせ」の操作は web と
 * 共通（features の `createTenpaiScoreStore`）。ルール設定は端末ローカルの
 * 設定ストアから読む。生成できた問題は保存 API へ送る（送信は待たず、
 * 失敗しても練習を止めない。`../problem-archive.ts`）。
 */
export const useTenpaiScoreStore = createTenpaiScoreStore(
  () => useRuleSettingsStore.getState(),
  archiveTenpaiQuestion,
);
