/**
 * ローカル開発用シードのチャレンジ成績
 * シード成績
 *
 * ランキング（`/leaderboard`）と練習ページの総合ランキングは、成績が 1 件も
 * 無いと「まだスコアが記録されていません」しか出ない。上位3位のメダル・
 * ページ送り・自分の順位行を目で確かめられるよう、シードユーザー全員に
 * 全練習種別の成績を投入する。
 *
 * @design 値はユーザー名から決まる（乱数を回さない）
 *
 * 実行のたびに順位が入れ替わると「さっき見た画面」と比べられない。
 * ユーザー名と練習種別から決まる擬似乱数で組み立て、同じシードユーザーには
 * 何度実行しても同じ成績が付くようにしている。
 *
 * @design 月内と前月の 2 件を必ず作る
 *
 * ランキングは総合（`challenge_best_scores`）と月間（当月の
 * `challenge_results`）の 2 面がある。全件を過去 n 日にばらまくと、
 * 月初に実行したときに月間ランキングがほぼ空になる。期間の境目を跨いで
 * 1 件ずつ置き、どちらの面も必ず埋まるようにする。
 *
 * @design ベストは challenge_results から導出する
 *
 * `challenge_best_scores` は `challenge_results` から `DISTINCT ON` で
 * 再構築できるキャッシュなので、シードでも 2 件のうちどちらが上かを
 * TypeScript 側で判定せず、ランキングと同じ順序規則（`rankingOrderSql`）で
 * DB に選ばせる。順位の決め方を変えたときにシードだけ取り残されない。
 *
 * EXP（`exp_events` / `user_exp`）は付与しない。`saveChallengeResult` を
 * 通せば付くが、そちらは `createdAt` を現在時刻で固定するため、このシードが
 * 作りたい期間の散らばりが失われる。EXP の画面を見たいときは実際に
 * 練習を 1 回走らせること。
 *
 * @design 土俵（練習種別 × バリアント）ごとに成績を入れる
 *
 * バリアントを持つ練習（役の翻数・点数表早引き）は設定ごとに別のランキング・
 * 別のベストを持つ。どの土俵も空にならないよう、レジストリの `variants` を
 * すべて回して 1 土俵ずつ 2 件入れる。
 *
 * @design 昇級試験には成績を入れない
 *
 * 試験の走行は本番でも記録されない（合否だけを判定し、成果は `user_ranks`
 * が表す）。ランキング・マイレコードも試験を扱わないので、行を作っても
 * どこにも出ない。
 */
import { mulberry32 } from "@mahjong-scoring/core";
import type { RandomSource } from "@mahjong-scoring/core";
import { inArray, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type { PracticeMenuType } from "../../src/lib/db/practice-menu-types";
import {
  PRACTICE_MENU_TYPES,
  isExamMenuType,
  practiceMenuByType,
} from "../../src/lib/db/practice-menu-types";
import { rankingOrderSql } from "../../src/lib/db/ranking-order";
import { challengeBestScores, challengeResults } from "../../src/lib/db/schema";

/** 前月側の成績を月初から何日さかのぼった範囲に置くか */
const PREVIOUS_PERIOD_SPAN_DAYS = 20;

/** 成績を投入する対象（`auth.users.id` と、擬似乱数の種にする識別子） */
export interface ScoredSeedUser {
  readonly userId: string;
  readonly username: string;
}

/**
 * シードユーザーのチャレンジ成績を入れ直す
 * シード成績投入
 *
 * シードユーザーの既存行を消してから入れ直す。値が決定的なので実行結果は
 * 何度走らせても同じになるが、シードユーザーとして実際に遊んだ記録は
 * 消える（消えて困る記録は自分のアカウントで作ること）。
 *
 * @returns 投入した `challenge_results` の行数
 */
export async function reseedChallengeResults(
  db: PostgresJsDatabase,
  users: readonly ScoredSeedUser[],
): Promise<number> {
  const userIds = users.map((user) => user.userId);
  if (userIds.length === 0) return 0;

  // ベストは results から導出するため、先に消すのは参照する側から。
  await db
    .delete(challengeBestScores)
    .where(inArray(challengeBestScores.userId, userIds));
  await db
    .delete(challengeResults)
    .where(inArray(challengeResults.userId, userIds));

  // 試験の走行は記録しない（ファイル冒頭参照）
  const recordedMenuTypes = PRACTICE_MENU_TYPES.filter(
    (menuType) => !isExamMenuType(menuType),
  );
  const rows = users.flatMap((user) =>
    recordedMenuTypes.flatMap((menuType) =>
      practiceMenuByType(menuType).variants.flatMap((variant) =>
        resultsFor(user, menuType, variant, new Date()),
      ),
    ),
  );

  await db.insert(challengeResults).values(rows);
  await rebuildBestScores(db, userIds);

  return rows.length;
}

/**
 * 1 人 × 1 土俵ぶんの成績（前月・当月の 2 件）を組み立てる
 * 成績組み立て
 */
function resultsFor(
  user: ScoredSeedUser,
  menuType: PracticeMenuType,
  variant: string,
  now: Date,
): (typeof challengeResults.$inferInsert)[] {
  const menu = practiceMenuByType(menuType);
  const monthStart = startOfMonthUtc(now);
  const board = `${menuType}:${variant}`;

  return [
    { period: "previous", createdAt: dateBefore(monthStart, user, board) },
    {
      period: "current",
      createdAt: dateBetween(monthStart, now, user, board),
    },
  ].map(({ period, createdAt }) => {
    const random = pseudoRandom(`${user.username}:${board}:${period}`);

    // ミスは練習ごとの上限まで。
    const incorrectAnswers = randomInt(random(), 0, menu.mistakeLimit);
    // 上限までミスするとその場で終了するため、時間切れより短い記録になる。
    const timeTaken =
      incorrectAnswers >= menu.mistakeLimit
        ? randomInt(random(), Math.floor(menu.timeLimit / 3), menu.timeLimit)
        : menu.timeLimit;

    return {
      userId: user.userId,
      menuType,
      leaderboardKey: variant,
      score: randomInt(random(), SCORE_RANGE.min, SCORE_RANGE.max),
      incorrectAnswers,
      timeTaken,
      createdAt,
    };
  });
}

/** シード成績のスコア範囲 */
const SCORE_RANGE = { min: 5, max: 34 } as const;

/**
 * `challenge_results` から全期間ベストを組み直す
 * ベストスコア再構築
 *
 * ランキングと同じ順序規則で並べた先頭を採る。順序の定義は
 * `ranking-order.ts` の 1 箇所だけなので、シードが独自の「良い成績」の
 * 定義を持たない。
 */
async function rebuildBestScores(
  db: PostgresJsDatabase,
  userIds: readonly string[],
): Promise<void> {
  const ids = sql.join(
    userIds.map((id) => sql`${id}`),
    sql`, `,
  );

  await db.execute(sql`
    INSERT INTO challenge_best_scores
      (user_id, menu_type, leaderboard_key, score, incorrect_answers, time_taken, achieved_at, updated_at)
    SELECT DISTINCT ON (user_id, menu_type, leaderboard_key)
      user_id, menu_type, leaderboard_key, score, incorrect_answers, time_taken, created_at, now()
    FROM challenge_results
    WHERE user_id IN (${ids})
    ORDER BY user_id, menu_type, leaderboard_key, ${rankingOrderSql("challenge_results")}
  `);
}

// ---------------------------------------------------------------------------
// 日時
// ---------------------------------------------------------------------------

/** 当月の開始日時（UTC）。月間ランキングの境目と同じ切り方 */
function startOfMonthUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** 月初より前（＝月間ランキングに入らない側）の日時 */
function dateBefore(
  monthStart: Date,
  user: ScoredSeedUser,
  board: string,
): Date {
  const random = pseudoRandom(`${user.username}:${board}:before`);
  const daysBack = randomInt(random(), 1, PREVIOUS_PERIOD_SPAN_DAYS);
  return new Date(monthStart.getTime() - daysBack * 24 * 60 * 60 * 1000);
}

/** 月初から現在までの日時（＝月間ランキングに入る側） */
function dateBetween(
  monthStart: Date,
  now: Date,
  user: ScoredSeedUser,
  board: string,
): Date {
  const random = pseudoRandom(`${user.username}:${board}:within-month`);
  const span = now.getTime() - monthStart.getTime();
  return new Date(monthStart.getTime() + Math.floor(random() * span));
}

// ---------------------------------------------------------------------------
// 決定的な擬似乱数
// ---------------------------------------------------------------------------

/** 文字列から 32bit の種を作る（FNV-1a） */
function hashSeed(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** 文字列の種から決まる 0 以上 1 未満の値を返す関数を作る */
function pseudoRandom(seed: string): RandomSource {
  return mulberry32(hashSeed(seed));
}

/** 0〜1 の値を min〜max（両端を含む）の整数へ写す */
function randomInt(value: number, min: number, max: number): number {
  return min + Math.floor(value * (max - min + 1));
}
