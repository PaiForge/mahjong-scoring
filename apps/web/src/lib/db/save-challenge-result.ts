import { sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { expHeatmapCacheTag } from "./get-exp-heatmap-data";
import { db } from "./index";
import { excludedRanksBetter } from "./ranking-order";
import { grantChallengeExp } from "./save-exp";
import { challengeBestScores, challengeResults } from "./schema";

export interface ChallengeResultInput {
  readonly userId: string;
  readonly menuType: string;
  readonly leaderboardKey: string;
  readonly score: number;
  readonly incorrectAnswers: number;
  readonly timeTaken: number;
}

export interface SaveChallengeResultReturn {
  /** 挿入された `challenge_results.id`。結果ページでの EXP 再取得に使用。 */
  readonly challengeResultId: string;
}

/**
 * チャレンジ結果を DB に書き込む
 * チャレンジ結果保存
 *
 * 以下の処理を 1 つのトランザクション内で行う:
 * 1. `challenge_results` に INSERT（追記専用ログ、週間/月間ランキング用）
 * 2. `challenge_best_scores` に UPSERT（全期間ベスト）
 * 3. `exp_events` + `user_exp` に EXP 付与（{@link grantChallengeExp}）
 *
 * UPSERT は新結果が既存より上位の場合のみ更新する。上位かどうかの判定は
 * ランキングと同じ順序規則（{@link excludedRanksBetter}）から導出する。
 *
 * @returns 挿入された `challenge_results.id`
 */
export async function saveChallengeResult(
  input: ChallengeResultInput,
): Promise<SaveChallengeResultReturn> {
  const {
    userId,
    menuType,
    leaderboardKey,
    score,
    incorrectAnswers,
    timeTaken,
  } = input;
  const now = new Date();

  const result = await db.transaction(async (tx) => {
    // 1. Append to challenge_results (all results, for period-based rankings)
    const [inserted] = await tx
      .insert(challengeResults)
      .values({
        userId,
        menuType,
        leaderboardKey,
        score,
        incorrectAnswers,
        timeTaken,
      })
      .returning({ id: challengeResults.id });

    // 2. UPSERT into challenge_best_scores (all-time best per user/menu/key)
    //    Only updates when the new result ranks strictly higher.
    await tx
      .insert(challengeBestScores)
      .values({
        userId,
        menuType,
        leaderboardKey,
        score,
        incorrectAnswers,
        timeTaken,
        achievedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          challengeBestScores.userId,
          challengeBestScores.menuType,
          challengeBestScores.leaderboardKey,
        ],
        set: {
          score: sql`EXCLUDED.score`,
          incorrectAnswers: sql`EXCLUDED.incorrect_answers`,
          timeTaken: sql`EXCLUDED.time_taken`,
          achievedAt: sql`EXCLUDED.achieved_at`,
          updatedAt: sql`now()`,
        },
        setWhere: excludedRanksBetter(challengeBestScores),
      });

    // 3. Grant EXP based on this challenge result
    const expInfo = await grantChallengeExp(tx, {
      userId,
      challengeResultId: inserted.id,
      menuType,
      score,
      incorrectAnswers,
      timeTaken,
      leaderboardKey,
    });

    return {
      challengeResultId: inserted.id,
      expGranted: expInfo !== undefined,
    };
  });

  // EXP が付与された場合のみ、ヒートマップのキャッシュタグを無効化する。
  // 未登録 menuType（開発中練習）の場合は付与自体がスキップされるためキャッシュ無効化も不要。
  if (result.expGranted) {
    revalidateTag(expHeatmapCacheTag(userId), "default");
  }

  return { challengeResultId: result.challengeResultId };
}
