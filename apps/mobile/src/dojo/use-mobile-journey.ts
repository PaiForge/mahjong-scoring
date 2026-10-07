import { useMemo } from "react";
import {
  buildJourney,
  type Journey,
} from "@mahjong-scoring/features/journey/journey";

import { useCompletedLessonSlugs } from "../hooks/use-lesson-completion-store";
import { useAttemptedPractices } from "../hooks/use-practice-attempt-store";

/**
 * モバイルの黒帯への道
 * モバイル行程
 *
 * web の道場と同じ `buildJourney` を、モバイルが持つ材料で呼ぶ。
 *
 * - 学ぶ: 端末に記録したレッスンの完了（`useCompletedLessonSlugs`）
 * - 練習する: 端末に記録した「チャレンジを終えた」練習
 *   （`useAttemptedPractices`。成績は記録しない）
 * - 認定される: 段級位はアカウントに紐づくので常に空（全員が無級）
 */
export function useMobileJourney(): Journey {
  const completedLessonSlugs = useCompletedLessonSlugs();
  const attemptedPractices = useAttemptedPractices();
  return useMemo(
    () =>
      buildJourney({
        completedLessonSlugs,
        attemptedPractices,
        achievedRankSlugs: [],
      }),
    [completedLessonSlugs, attemptedPractices],
  );
}
