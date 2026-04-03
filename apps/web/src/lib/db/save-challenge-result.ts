import { sql } from 'drizzle-orm';

import { db } from './index';
import { challengeBestScores, challengeResults } from './schema';

export interface ChallengeResultInput {
  readonly userId: string;
  readonly menuType: string;
  readonly leaderboardKey: string;
  readonly score: number;
  readonly incorrectAnswers: number;
  readonly timeTaken: number;
}

/**
 * チャレンジ結果をDBに書き込む
 * チャレンジ結果保存
 *
 * 2つの操作を実行する:
 * 1. `challenge_results` に INSERT（追記専用ログ、週間/月間ランキング用）
 * 2. `challenge_best_scores` に UPSERT（全期間ベスト）
 *
 * UPSERT は新結果がタプル比較 (score DESC, incorrect_answers ASC, time_taken ASC)
 * で既存より良い場合のみ更新する。
 */
export async function saveChallengeResult(input: ChallengeResultInput): Promise<void> {
  const { userId, menuType, leaderboardKey, score, incorrectAnswers, timeTaken } = input;
  const now = new Date();

  await db.transaction(async (tx) => {
    // 1. Append to challenge_results (all results, for period-based rankings)
    await tx.insert(challengeResults).values({
      userId,
      menuType,
      leaderboardKey,
      score,
      incorrectAnswers,
      timeTaken,
    });

    // 2. UPSERT into challenge_best_scores (all-time best per user/menu/key)
    //    Only updates when the new result is strictly better:
    //    (higher score, then fewer incorrect answers, then faster time)
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
        setWhere: sql`(
          EXCLUDED.score,
          -EXCLUDED.incorrect_answers,
          -EXCLUDED.time_taken
        ) > (
          ${challengeBestScores.score},
          -${challengeBestScores.incorrectAnswers},
          -${challengeBestScores.timeTaken}
        )`,
      });
  });
}
