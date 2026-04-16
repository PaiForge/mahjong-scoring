/**
 * EXP 永続化
 * 経験値永続化
 *
 * @description
 * チャレンジ完了に伴う経験値付与の DB 操作。
 * トランザクション内で `exp_events` に冪等 INSERT し、
 * 新規挿入の場合のみ `user_exp` を加算する。
 *
 * @see {@link @mahjong-scoring/core} 計算ロジック（calculateExp, getLevel）
 * @see {@link ./save-challenge-result.ts} 呼び出し元のトランザクション
 */
import { calculateExp, getLevel, getLevelProgress } from '@mahjong-scoring/core';
import type { ExpInfo } from '@mahjong-scoring/core';
import { and, eq, sql } from 'drizzle-orm';

import { db } from './index';
import { expEvents, userExp } from './schema';

/** Drizzle の `db.transaction()` コールバック引数の型 */
type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface GrantChallengeExpParams {
  readonly userId: string;
  readonly challengeResultId: string;
  readonly menuType: string;
  readonly score: number;
  readonly incorrectAnswers: number;
  readonly timeTaken: number;
  readonly leaderboardKey: string;
}

/**
 * チャレンジ完了に対する EXP を計算して付与する
 * チャレンジ経験値付与
 *
 * 未登録の練習種別 (`MODULE_WEIGHT` に無い `menuType`) は `null` を返し、
 * EXP 付与を完全にスキップする（開発中の練習で誤って EXP を付与しないため）。
 *
 * 冪等性: `(source, source_id)` の partial unique index に依存し、
 * 同じ `challengeResultId` に対する二重付与を防ぐ。重複検知時は既存イベントの
 * `amount` と metadata から `ExpInfo` を再構築して返す。
 *
 * @param tx トランザクションクライアント
 * @param params ユーザー・チャレンジ結果・スコア情報
 * @returns 付与結果、または `null`（未登録 menuType で付与スキップ）
 */
export async function grantChallengeExp(
  tx: TransactionClient,
  params: GrantChallengeExpParams,
): Promise<ExpInfo | null> {
  const {
    userId,
    challengeResultId,
    menuType,
    score,
    incorrectAnswers,
    timeTaken,
    leaderboardKey,
  } = params;

  const expResult = calculateExp({ score, incorrectAnswers, menuType });
  if (expResult === null) {
    // 未登録の menuType: EXP 付与をスキップ（デフォルト重みは与えない）
    return null;
  }

  // 1. exp_events に仮 INSERT（冪等: (source, source_id) の partial unique index）
  //
  //    Postgres の ON CONFLICT 推論は partial unique index の predicate を
  //    完全一致で指定する必要があるため、schema.ts の `.where(source_id IS NOT NULL)`
  //    と同じ述語を `where` 句に渡す。これを省くと「no unique or exclusion constraint
  //    matching the ON CONFLICT specification」エラーで実行時に失敗する。
  //
  //    totalExpAfter は user_exp 加算後に UPDATE で埋める（levelUp 判定の再構築用）。
  const inserted = await tx
    .insert(expEvents)
    .values({
      userId,
      source: 'challenge_result',
      sourceId: challengeResultId,
      menuType,
      amount: expResult.totalExp,
      metadata: {
        score,
        incorrectAnswers,
        timeTaken,
        leaderboardKey,
        baseExp: expResult.baseExp,
        accuracyMultiplier: expResult.accuracyMultiplier,
      },
    })
    .onConflictDoNothing({
      target: [expEvents.source, expEvents.sourceId],
      where: sql`${expEvents.sourceId} IS NOT NULL`,
    })
    .returning({ id: expEvents.id, amount: expEvents.amount });

  if (inserted.length === 0) {
    // 重複（再送・リロード等）: 既存イベントを再取得し、metadata から ExpInfo を再構築する
    return await rebuildExpInfoFromExisting(tx, userId, challengeResultId);
  }

  const eventId = inserted[0].id;
  const earned = inserted[0].amount;

  // 2. user_exp を加算 UPSERT
  const [row] = await tx
    .insert(userExp)
    .values({ userId, totalExp: earned })
    .onConflictDoUpdate({
      target: userExp.userId,
      set: {
        totalExp: sql`${userExp.totalExp} + ${earned}`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ totalExp: userExp.totalExp });

  const totalExp = row.totalExp;

  // 3. 付与後の累計 EXP (`totalExpAfter`) を metadata に denormalize する。
  //    これは結果ページのリロード・ディープリンク時に、過去の付与イベント単体から
  //    `levelUp` を再構築できるようにするためのフィールド。
  //    代替案として `user_exp` の履歴を SUM() し直す方法があるが、O(N) クエリが
  //    必要になるため append-only ログのメタデータに書き込む方式を選択している。
  await tx
    .update(expEvents)
    .set({
      metadata: sql`jsonb_set(${expEvents.metadata}, '{totalExpAfter}', to_jsonb(${totalExp}::int))`,
    })
    .where(eq(expEvents.id, eventId));

  return buildExpInfo({ earned, totalExpAfter: totalExp });
}

interface ExistingEventRow {
  readonly amount: number;
  readonly metadata: Record<string, unknown> | null;
}

/**
 * `challengeResultId` に対応する既存の EXP イベントから
 * `ExpInfo` を再構築する（冪等再付与・ディープリンク時のフォールバック）。
 */
async function rebuildExpInfoFromExisting(
  tx: TransactionClient,
  userId: string,
  challengeResultId: string,
): Promise<ExpInfo> {
  const [existing] = await tx
    .select({ amount: expEvents.amount, metadata: expEvents.metadata })
    .from(expEvents)
    .where(
      and(
        eq(expEvents.source, 'challenge_result'),
        eq(expEvents.sourceId, challengeResultId),
        eq(expEvents.userId, userId),
      ),
    )
    .limit(1);

  return buildExpInfoFromRow(existing);
}

function buildExpInfoFromRow(row: ExistingEventRow | undefined): ExpInfo {
  if (!row) {
    return {
      earnedExp: 0,
      totalExp: 0,
      level: 0,
      levelUp: false,
      progressPercent: 0,
    };
  }
  const metadata = row.metadata ?? {};
  const rawTotalAfter = metadata['totalExpAfter'];
  const totalExpAfter = typeof rawTotalAfter === 'number' ? rawTotalAfter : row.amount;
  return buildExpInfo({ earned: row.amount, totalExpAfter });
}

function buildExpInfo(args: {
  readonly earned: number;
  readonly totalExpAfter: number;
}): ExpInfo {
  const { earned, totalExpAfter } = args;
  const levelAfter = getLevel(totalExpAfter);
  const levelBefore = getLevel(totalExpAfter - earned);
  const progress = getLevelProgress(totalExpAfter);
  return {
    earnedExp: earned,
    totalExp: totalExpAfter,
    level: levelAfter,
    levelUp: levelAfter > levelBefore,
    progressPercent: Math.round(progress.progress * 100),
  };
}

/**
 * 結果ページで `challengeResultId` から過去の EXP 付与情報を引く
 * 経験値情報取得
 *
 * サーバーコンポーネントのリロード・ディープリンクでも EXP カードを
 * 再描画できるようにするためのヘルパー。
 *
 * @param userId 認証済みユーザー ID
 * @param challengeResultId 対象のチャレンジ結果 ID
 * @returns 該当イベントがなければ undefined
 */
export async function getExpInfoByChallengeResultId(
  userId: string,
  challengeResultId: string,
): Promise<ExpInfo | undefined> {
  const [event] = await db
    .select({ amount: expEvents.amount, metadata: expEvents.metadata })
    .from(expEvents)
    .where(
      and(
        eq(expEvents.source, 'challenge_result'),
        eq(expEvents.sourceId, challengeResultId),
        eq(expEvents.userId, userId),
      ),
    )
    .limit(1);

  if (!event) return undefined;
  return buildExpInfoFromRow(event);
}
