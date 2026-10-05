import { useMemo } from "react";
import {
  buildJourney,
  type Journey,
} from "@mahjong-scoring/features/journey/journey";

import { useCompletedLessonSlugs } from "../hooks/use-lesson-completion-store";

/**
 * モバイルの黒帯への道
 * モバイル行程
 *
 * web の道場と同じ `buildJourney` を、モバイルが持つ材料で呼ぶ。
 *
 * - 学ぶ: 端末に記録したレッスンの完了（`useCompletedLessonSlugs`）
 * - 練習する: 挑戦の記録を持たないので常に空（チャレンジは結果画面で
 *   成績を見せるだけで記録しない）
 * - 認定される: 段級位はアカウントに紐づくので常に空（全員が無級）
 */
export function useMobileJourney(): Journey {
  const completedLessonSlugs = useCompletedLessonSlugs();
  return useMemo(
    () =>
      buildJourney({
        completedLessonSlugs,
        attemptedPractices: [],
        achievedRankSlugs: [],
      }),
    [completedLessonSlugs],
  );
}
