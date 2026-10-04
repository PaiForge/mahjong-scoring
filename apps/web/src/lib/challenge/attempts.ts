import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, challengeAttempts, type TransactionClient } from "../db";
import {
  isPracticeMenuType,
  isPracticeVariant,
  isExamMenuType,
} from "@mahjong-scoring/features/practice-menu-types";
import { getUserRankSlugs } from "../db/rank-queries";
import { evaluateExamEligibility } from "@mahjong-scoring/features/ranks/exam-eligibility";
import { gradeExamRun } from "../db/rank-evaluation";
import { saveChallengeResult } from "../db/save-challenge-result";
import {
  generateChallengeQuestion,
  gradeChallengeAnswer,
  publicChallengeQuestion,
} from "./questions";
import {
  answeredChallenge,
  canAnswerChallenge,
  canPauseChallenge,
  challengeRemainingMs,
  finishedChallengeTime,
  isChallengeTimeUp,
  pausedChallenge,
  startedChallenge,
} from "./transitions";

const uuid = z.string().uuid();
const settingsSchema = z.object({ renfonpaiAs4Fu: z.boolean() });
/** 本人の挑戦行を更新用にロックして読む。他人の id では見つからない扱いになる。 */
async function lockOwnAttempt(
  tx: TransactionClient,
  userId: string,
  id: string,
) {
  const [row] = await tx
    .select()
    .from(challengeAttempts)
    .where(
      and(eq(challengeAttempts.id, id), eq(challengeAttempts.userId, userId)),
    )
    .for("update");
  return row;
}
/** 認証済み本人の挑戦を開始する。出題と条件をDBに固定する。 */
export async function beginAttempt(
  userId: string,
  menuType: unknown,
  variant: unknown,
  settings: unknown,
) {
  const parsed = settingsSchema.safeParse(settings);
  if (
    !isPracticeMenuType(menuType) ||
    typeof variant !== "string" ||
    !isPracticeVariant(menuType, variant) ||
    !parsed.success
  )
    return undefined;
  if (
    isExamMenuType(menuType) &&
    evaluateExamEligibility(menuType, await getUserRankSlugs(userId))?.kind ===
      "locked"
  )
    return undefined;
  const question = generateChallengeQuestion(menuType, variant, parsed.data);
  if (!question) return undefined;
  const state = startedChallenge(
    { menuType, variant, settings: parsed.data, question },
    Date.now(),
  );
  const [row] = await db
    .insert(challengeAttempts)
    .values({ userId, state })
    .returning({ id: challengeAttempts.id });
  return {
    id: row.id,
    sequence: 0,
    question: publicChallengeQuestion(question, menuType),
  };
}
/** 本人の行をロックし、一度だけ回答を受け付ける。正解開示と次問発行は受付後。 */
export async function answerAttempt(
  userId: string,
  id: unknown,
  sequence: unknown,
  answer: unknown,
) {
  if (
    !uuid.safeParse(id).success ||
    typeof id !== "string" ||
    !Number.isInteger(sequence) ||
    typeof sequence !== "number"
  )
    return undefined;
  return db.transaction(async (tx) => {
    const row = await lockOwnAttempt(tx, userId, id);
    const now = Date.now();
    if (!row || row.consumed) return undefined;
    if (isChallengeTimeUp(row.state, now)) return { expired: true as const };
    if (!canAnswerChallenge(row.state, sequence, now)) return undefined;
    const correct = gradeChallengeAnswer(
      row.state.menuType,
      row.state.question,
      answer,
    );
    const next = generateChallengeQuestion(
      row.state.menuType,
      row.state.variant,
      row.state.settings,
    );
    if (!next) return undefined;
    const state = answeredChallenge(row.state, correct, next, now);
    await tx
      .update(challengeAttempts)
      .set({ state })
      .where(eq(challengeAttempts.id, id));
    return {
      correct,
      answered: row.state.question,
      question: publicChallengeQuestion(next, state.menuType),
      sequence: state.sequence,
    };
  });
}
/** 一時停止・再開もサーバー時計に記録する。 */
export async function pauseAttempt(
  userId: string,
  id: unknown,
  paused: unknown,
): Promise<boolean> {
  if (
    typeof id !== "string" ||
    !uuid.safeParse(id).success ||
    typeof paused !== "boolean"
  )
    return false;
  return db.transaction(async (tx) => {
    const row = await lockOwnAttempt(tx, userId, id);
    const now = Date.now();
    if (!row || row.consumed || !canPauseChallenge(row.state, now))
      return false;
    if (row.state.paused === paused) return true;
    await tx
      .update(challengeAttempts)
      .set({ state: pausedChallenge(row.state, paused, now) })
      .where(eq(challengeAttempts.id, id));
    return true;
  });
}
/** 結果を確定する。クライアントの点数・種別・時間は一切受け取らない。 */
export async function finishAttempt(
  userId: string,
  id: unknown,
  exam: boolean,
) {
  if (typeof id !== "string" || !uuid.safeParse(id).success) return undefined;
  return db.transaction(async (tx) => {
    const row = await lockOwnAttempt(tx, userId, id);
    const now = Date.now();
    if (!row || row.consumed || isExamMenuType(row.state.menuType) !== exam)
      return undefined;
    const state = row.state;
    const timeTaken = finishedChallengeTime(state, now);
    if (timeTaken === undefined) return undefined;
    await tx
      .update(challengeAttempts)
      .set({ consumed: true })
      .where(eq(challengeAttempts.id, id));
    if (exam)
      return {
        grantedRanks: await gradeExamRun(
          userId,
          { menuType: state.menuType, score: state.score },
          tx,
        ),
      };
    if (state.sequence === 0) return undefined;
    return saveChallengeResult(
      {
        userId,
        menuType: state.menuType,
        leaderboardKey: state.variant,
        score: state.score,
        incorrectAnswers: state.incorrectAnswers,
        timeTaken,
      },
      tx,
      new Date(now),
    );
  });
}

/** 時間切れ後に未回答問題を開示する。期限までは残り時間だけを返す。 */
export async function revealExpiredAttempt(userId: string, id: unknown) {
  if (typeof id !== "string" || !uuid.safeParse(id).success) return undefined;
  const [row] = await db
    .select()
    .from(challengeAttempts)
    .where(
      and(eq(challengeAttempts.id, id), eq(challengeAttempts.userId, userId)),
    );
  if (!row || row.consumed || row.state.paused) return undefined;
  const remainingMs = challengeRemainingMs(row.state, Date.now());
  return remainingMs > 0 ? { remainingMs } : { question: row.state.question };
}
