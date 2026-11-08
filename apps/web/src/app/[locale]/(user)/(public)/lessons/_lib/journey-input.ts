import "server-only";

import { getJourneyInputOf } from "@/lib/journey/progress";
import type { BuildJourneyInput } from "@mahjong-scoring/features/journey/journey";

/**
 * 本人の黒帯への道の進み具合（`buildJourney` の入力）を集める
 * 行程の入力取得
 *
 * 道場・ダッシュボードと同じ 3 つ（取得済みの級・レッスンの完了・挑戦した
 * 練習）。レッスンの記録（`completeLesson`）が、完了画面に返す続き
 * （次の一歩・級の進み具合）を求めるのに使う。
 *
 * @param userId 認証済みユーザーの id
 */
export async function fetchJourneyInput(
  userId: string,
): Promise<BuildJourneyInput> {
  return getJourneyInputOf(userId);
}
