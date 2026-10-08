import "server-only";
import { isDeepStrictEqual } from "node:util";
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
import { lockAccountForWrite } from "../users/account-write-lock";
import type {
  ChallengeOutcome,
  ChallengeSettings,
  ChallengeState,
} from "@mahjong-scoring/features/challenge/types";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";
import {
  generateChallengeQuestion,
  gradeChallengeAnswer,
  publicChallengeQuestion,
} from "./questions";
import {
  answeredChallenge,
  canAnswerChallenge,
  canPauseChallenge,
  challengeElapsed,
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
/** 開始・復帰の応答で見せる挑戦の入口。出題は正解を伏せる。 */
function attemptEntry(id: string, state: ChallengeState) {
  return {
    id,
    sequence: state.sequence,
    question: publicChallengeQuestion(state.question, state.menuType),
  };
}
/**
 * 認証済み本人の挑戦を開始する。出題と条件をDBに固定する。
 *
 * @param requestedId - 呼び出し側が決めた挑戦 ID（UUID）。渡すと開始が
 *   冪等になる: 同じ ID の再送には、作り直さずに既存の挑戦を返す。応答が
 *   通信で失われたアプリが、挑戦を 2 つ作らずに同じ挑戦へ戻るため。
 *   他人の行と ID がぶつかった（推測で送られた）ときは開始しない。
 *   省略すると DB が ID を決める（web はこちら）
 * @param clock - 時計。受験資格を確かめ出題を作った後に読むので、時刻ではなく
 *   関数で受ける
 */
export async function beginAttempt(
  userId: string,
  menuType: unknown,
  variant: unknown,
  settings: unknown,
  requestedId?: unknown,
  clock: () => number = Date.now,
) {
  const parsed = settingsSchema.safeParse(settings);
  if (
    !isPracticeMenuType(menuType) ||
    typeof variant !== "string" ||
    !isPracticeVariant(menuType, variant) ||
    !parsed.success ||
    (requestedId !== undefined && !uuid.safeParse(requestedId).success)
  )
    return undefined;
  const id = typeof requestedId === "string" ? requestedId : undefined;
  if (id !== undefined) {
    const existing = await readOwnAttempt(userId, id);
    if (existing)
      return resumableEntry(existing, menuType, variant, parsed.data);
  }
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
    clock(),
  );
  // 退会を受け付けた後には挑戦を作らない（受付と競合しても、ロックで直列になる）
  const row = await db.transaction(async (tx) => {
    if (!(await lockAccountForWrite(tx, userId))) return "deleting" as const;
    const [inserted] = await tx
      .insert(challengeAttempts)
      .values({ ...(id === undefined ? {} : { id }), userId, state })
      .onConflictDoNothing()
      .returning({ id: challengeAttempts.id });
    return inserted;
  });
  if (row === "deleting") return undefined;
  if (row) return attemptEntry(row.id, state);
  // 同じ ID の並行した開始に先を越された。勝った側の挑戦を返す
  const raced = id === undefined ? undefined : await readOwnAttempt(userId, id);
  return raced
    ? resumableEntry(raced, menuType, variant, parsed.data)
    : undefined;
}
/** 本人の挑戦行を読む（ロックしない）。他人の id では見つからない扱いになる。 */
async function readOwnAttempt(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(challengeAttempts)
    .where(
      and(eq(challengeAttempts.id, id), eq(challengeAttempts.userId, userId)),
    );
  return row;
}
/**
 * 開始の再送で既存の挑戦を返せるなら、その入口を返す。
 *
 * 同じ ID で別の練習・バリアント・ルール設定を送った要求は再送ではなく
 * 競合なので返さない。設定まで比べるのは、違う設定で始めたつもりの
 * 端末に、サーバーが固定した別の設定の挑戦を渡すと、端末の表示と
 * サーバーの採点の条件が食い違うため。確定済みの挑戦にも返さない。
 */
function resumableEntry(
  row: typeof challengeAttempts.$inferSelect,
  menuType: string,
  variant: string,
  settings: ChallengeSettings,
) {
  if (
    row.consumed ||
    row.state.menuType !== menuType ||
    row.state.variant !== variant ||
    !isDeepStrictEqual(row.state.settings, settings)
  )
    return undefined;
  return attemptEntry(row.id, row.state);
}
/**
 * 本人の行をロックし、一度だけ回答を受け付ける。正解開示と次問発行は受付後。
 *
 * 直前の問題への再送は、採点し直さずに受け付けたときと同じ応答を返す。
 * 応答が通信で失われると、クライアントは次の問題を知らないまま同じ番号で
 * 送り直すしかないため。同じ番号に別の回答が来たら拒否する（答えを
 * 見てからの差し替えになる）。
 *
 * サーバー時計の起点（`respondedAt`）は UPDATE の直前に取る。起点を行に
 * 書くので、UPDATE と COMMIT の時間は起点より後に掛かり、固定の猶予
 * （`RESPONSE_GRACE_MS`）の中から消費される（実測値はそちらの TSDoc）。
 *
 * @param receivedAt - 回答のリクエストを受け取った時刻。認証や行ロックの前に
 *   取ったものを渡す。ここから応答を組むまでの処理時間は競技時間に数えない
 *   （{@link answeredChallenge}）
 * @param clock - 時計。応答の起点（`respondedAt`）を UPDATE の直前に読むので、
 *   時刻ではなく関数で受ける
 */
export async function answerAttempt(
  userId: string,
  id: unknown,
  sequence: unknown,
  answer: unknown,
  receivedAt: number = Date.now(),
  clock: () => number = Date.now,
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
    const now = receivedAt;
    if (!row) return undefined;
    const last = row.state.lastAnswer;
    if (last && last.sequence === sequence)
      return isDeepStrictEqual(last.answer, toJsonValue(answer))
        ? {
            correct: last.correct,
            answered: last.answered,
            question: publicChallengeQuestion(
              row.state.question,
              row.state.menuType,
            ),
            sequence: row.state.sequence,
            elapsedMs: last.elapsedMs,
          }
        : undefined;
    if (row.consumed) return undefined;
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
    const answered = answeredChallenge(
      row.state,
      correct,
      next,
      receivedAt,
      clock(),
    );
    const state: ChallengeState = {
      ...answered,
      lastAnswer: {
        sequence,
        answer: toJsonValue(answer),
        correct,
        answered: row.state.question,
        elapsedMs: answered.elapsedMs,
      },
    };
    await tx
      .update(challengeAttempts)
      .set({ state })
      .where(eq(challengeAttempts.id, id));
    return {
      correct,
      answered: row.state.question,
      question: publicChallengeQuestion(next, state.menuType),
      sequence: state.sequence,
      // 採点時点の経過時間。画面の時計をこれに合わせ直す（猶予の間は止まっている）
      elapsedMs: state.elapsedMs,
    };
  });
}
/**
 * 一時停止・再開もサーバー時計に記録する。
 *
 * @param clock - 時計。行を読んだ（ロックした）後に読むので、時刻ではなく
 *   関数で受ける。テストが制限時間の境界を指定するために差し替える
 */
export async function pauseAttempt(
  userId: string,
  id: unknown,
  paused: unknown,
  clock: () => number = Date.now,
): Promise<boolean> {
  if (
    typeof id !== "string" ||
    !uuid.safeParse(id).success ||
    typeof paused !== "boolean"
  )
    return false;
  return db.transaction(async (tx) => {
    const row = await lockOwnAttempt(tx, userId, id);
    const now = clock();
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
/**
 * 結果を確定する。クライアントの点数・種別・時間は一切受け取らない。
 *
 * 確定済みの挑戦への再送には、記録し直さずに確定したときの結果を返す。
 * 成功の応答が通信で失われたクライアントが、結果を取り直せるようにするため。
 *
 * @param clock - 時計。行を読んだ（ロックした）後に読むので、時刻ではなく
 *   関数で受ける。テストが制限時間の境界を指定するために差し替える
 */
export async function finishAttempt(
  userId: string,
  id: unknown,
  exam: boolean,
  clock: () => number = Date.now,
) {
  if (typeof id !== "string" || !uuid.safeParse(id).success) return undefined;
  return db.transaction(async (tx) => {
    // 成績・EXP・段級位を書く。退会を受け付けた後には書かない
    if (!(await lockAccountForWrite(tx, userId))) return undefined;
    const row = await lockOwnAttempt(tx, userId, id);
    const now = clock();
    if (!row || isExamMenuType(row.state.menuType) !== exam) return undefined;
    if (row.consumed)
      return row.state.outcome ? outcomeResult(row.state.outcome) : undefined;
    const state = row.state;
    const timeTaken = finishedChallengeTime(state, now);
    if (timeTaken === undefined) return undefined;
    const outcome = await recordOutcome(userId, state, timeTaken, tx, now);
    await tx
      .update(challengeAttempts)
      .set({ consumed: true, state: { ...state, outcome } })
      .where(eq(challengeAttempts.id, id));
    return outcomeResult(outcome);
  });
}

/** 確定した挑戦を記録し、その結果を返す（記録は呼び出し元のトランザクションで行う）。 */
async function recordOutcome(
  userId: string,
  state: ChallengeState,
  timeTaken: number,
  tx: TransactionClient,
  now: number,
): Promise<ChallengeOutcome> {
  if (isExamMenuType(state.menuType))
    return {
      kind: "graded",
      grantedRanks: await gradeExamRun(
        userId,
        { menuType: state.menuType, score: state.score },
        tx,
      ),
    };
  if (state.sequence === 0) return { kind: "unrecorded" };
  const { challengeResultId } = await saveChallengeResult(
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
  return { kind: "recorded", challengeResultId };
}

/** 確定結果を `finishAttempt` の戻り値の形にする。何も記録しなかったら undefined。 */
function outcomeResult(
  outcome: ChallengeOutcome,
):
  | { readonly grantedRanks: readonly RankSlug[] }
  | { readonly challengeResultId: string }
  | undefined {
  switch (outcome.kind) {
    case "graded":
      return { grantedRanks: outcome.grantedRanks };
    case "recorded":
      return { challengeResultId: outcome.challengeResultId };
    case "unrecorded":
      return undefined;
  }
}

/**
 * 本人の挑戦の今の状態。通信が切れた・アプリが落ちたクライアントが、
 * 手元の状態を捨ててサーバーに合わせ直すために読む。
 *
 * 今の問題は正解を伏せて返す。確定済みなら確定の結果も返す（結果画面へ進める）。
 * 時計はサーバーの値だけを返し、クライアントの申告で巻き戻さない。
 *
 * @param clock - 時計。行を読んだ（ロックした）後に読むので、時刻ではなく
 *   関数で受ける。テストが制限時間の境界を指定するために差し替える
 */
export async function readAttemptStatus(
  userId: string,
  id: unknown,
  clock: () => number = Date.now,
) {
  if (typeof id !== "string" || !uuid.safeParse(id).success) return undefined;
  const row = await readOwnAttempt(userId, id);
  if (!row) return undefined;
  const { state } = row;
  const now = clock();
  return {
    ...attemptEntry(row.id, state),
    menuType: state.menuType,
    variant: state.variant,
    // 採点の条件。復帰した端末は手元の設定ではなくこれで表示し直す
    settings: state.settings,
    score: state.score,
    incorrectAnswers: state.incorrectAnswers,
    elapsedMs: challengeElapsed(state, now),
    remainingMs: challengeRemainingMs(state, now),
    paused: state.paused,
    finished: row.consumed,
    outcome: row.consumed
      ? outcomeResult(state.outcome ?? { kind: "unrecorded" })
      : undefined,
  };
}

/**
 * 回答を JSON に直した形
 *
 * 回答は jsonb に入って戻ってくる。値が undefined のキーは JSON に載らず
 * jsonb で消えるので、比べる前に両方をこの形に揃える。
 */
function toJsonValue(value: unknown): unknown {
  return value === undefined ? null : JSON.parse(JSON.stringify(value));
}

/**
 * 時間切れ後に未回答問題を開示する。期限までは残り時間だけを返す。
 *
 * @param clock - 時計。行を読んだ（ロックした）後に読むので、時刻ではなく
 *   関数で受ける。テストが制限時間の境界を指定するために差し替える
 */
export async function revealExpiredAttempt(
  userId: string,
  id: unknown,
  clock: () => number = Date.now,
) {
  if (typeof id !== "string" || !uuid.safeParse(id).success) return undefined;
  const row = await readOwnAttempt(userId, id);
  if (!row || row.consumed || row.state.paused) return undefined;
  const remainingMs = challengeRemainingMs(row.state, clock());
  return remainingMs > 0 ? { remainingMs } : { question: row.state.question };
}
