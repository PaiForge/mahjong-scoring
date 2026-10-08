import "server-only";

import type { NextResponse } from "next/server";
import { z } from "zod";

import type {
  MobileAnswerChallengeResponse,
  MobileChallengeEntry,
  MobileChallengeErrorCode,
  MobileChallengeStatus,
  MobileFinishChallengeResponse,
  MobileUnansweredResponse,
} from "@mahjong-scoring/features/challenge/mobile-api";
import {
  isExamMenuType,
  isPracticeMenuType,
} from "@mahjong-scoring/features/practice-menu-types";

import {
  answerAttempt,
  beginAttempt,
  finishAttempt,
  pauseAttempt,
  readAttemptStatus,
  revealExpiredAttempt,
} from "../challenge/attempts";
import { logExternalError } from "../log-error";

import { authorizeMobileRequest } from "./auth";
import { readMobileJson } from "./request";
import { mobileJson } from "./response";

/** 回答の本文の上限。回答は選んだ符・翻・点数や役の一覧で、数百バイトに収まる */
const ANSWER_BODY_MAX_BYTES = 8 * 1024;
/** 回答以外の本文の上限 */
const SMALL_BODY_MAX_BYTES = 1024;

const beginSchema = z.object({
  id: z.string().uuid(),
  menuType: z.string(),
  variant: z.string(),
  settings: z.object({ renfonpaiAs4Fu: z.boolean() }),
});
const answerSchema = z.object({
  sequence: z.number().int().nonnegative(),
  answer: z.unknown(),
});
const pauseSchema = z.object({ paused: z.boolean() });
const attemptIdSchema = z.string().uuid();

/** チャレンジ固有の失敗の応答 */
function challengeError(
  error: MobileChallengeErrorCode,
  status: number,
): NextResponse {
  return mobileJson({ error }, { status });
}

/**
 * 処理が受け付けなかった理由を、行があるかどうかで分ける
 *
 * `attempts.ts` の各処理は受け付けなかった理由を返さない（web は理由を
 * 問わず「接続エラー」にする）。アプリは「自分のチャレンジが無い（作り直す）」
 * と「あるが今の状態では受け付けない（状態を取り直して合わせる）」を
 * 区別したいので、ここで行を読み直して分ける。
 */
async function rejectionOf(
  userId: string,
  attemptId: string,
  whenExists: MobileChallengeErrorCode,
): Promise<NextResponse> {
  const status = await readAttemptStatus(userId, attemptId);
  return status
    ? challengeError(whenExists, 409)
    : challengeError("invalidChallenge", 404);
}

/** DB 等の失敗。同じ要求を送り直してよい */
function serverError(where: string, error: unknown): NextResponse {
  logExternalError(where, "処理に失敗", error);
  return mobileJson({ error: "serverError" }, { status: 500 });
}

/**
 * 記録付きのチャレンジを始める（アプリ向け）
 * チャレンジ開始API（アプリ向け）
 *
 * ID はアプリが決める。同じ ID・同じ中身の再送には作り直さずに同じ
 * チャレンジを返し、中身が違えば 409 `conflict`。昇級試験はアプリに
 * 本番の画面が無いので受け付けない（422）。
 */
export async function handleBeginChallenge(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "beginChallenge");
  if (!auth.ok) return auth.response;
  const body = beginSchema.safeParse(
    await readMobileJson(request, SMALL_BODY_MAX_BYTES),
  );
  if (!body.success) return challengeError("invalidRequest", 400);
  const { id, menuType, variant, settings } = body.data;
  if (!isPracticeMenuType(menuType) || isExamMenuType(menuType))
    return challengeError("invalidChallenge", 422);
  try {
    const attempt = await beginAttempt(
      auth.user.id,
      menuType,
      variant,
      settings,
      id,
    );
    if (attempt) return mobileJson<MobileChallengeEntry>(attempt);
    // 同じ ID の行があるのに返らなかった = 違う中身・確定済み
    return (await readAttemptStatus(auth.user.id, id))
      ? challengeError("conflict", 409)
      : challengeError("invalidChallenge", 422);
  } catch (error) {
    return serverError("POST /api/mobile/v1/challenges", error);
  }
}

/**
 * 回答を受け付ける（アプリ向け）
 * 回答API（アプリ向け）
 *
 * 受け取った時刻は認証より前に取る。認証と採点に掛かる時間を競技時間に
 * 数えないため（web の `answerChallenge` と同じ）。直前の問題への同じ
 * 回答の再送には、採点し直さずに同じ応答を返す。
 */
export async function handleAnswerChallenge(
  request: Request,
  attemptId: string,
): Promise<NextResponse> {
  const receivedAt = Date.now();
  const auth = await authorizeMobileRequest(request, "answerChallenge");
  if (!auth.ok) return auth.response;
  const body = answerSchema.safeParse(
    await readMobileJson(request, ANSWER_BODY_MAX_BYTES),
  );
  if (!body.success || !attemptIdSchema.safeParse(attemptId).success)
    return challengeError("invalidRequest", 400);
  try {
    const result = await answerAttempt(
      auth.user.id,
      attemptId,
      body.data.sequence,
      body.data.answer,
      receivedAt,
    );
    if (result) return mobileJson<MobileAnswerChallengeResponse>(result);
    return await rejectionOf(auth.user.id, attemptId, "conflict");
  } catch (error) {
    return serverError("POST /api/mobile/v1/challenges/[id]/answers", error);
  }
}

/**
 * 一時停止・再開をサーバーの時計に記録する（アプリ向け）
 * 一時停止API（アプリ向け）
 *
 * 届かなくてもアプリの画面は止める。届かなかった間もサーバーの時計は進み、
 * 再開時に状態を取り直して合わせる。
 */
export async function handlePauseChallenge(
  request: Request,
  attemptId: string,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readChallenge");
  if (!auth.ok) return auth.response;
  const body = pauseSchema.safeParse(
    await readMobileJson(request, SMALL_BODY_MAX_BYTES),
  );
  if (!body.success || !attemptIdSchema.safeParse(attemptId).success)
    return challengeError("invalidRequest", 400);
  try {
    if (await pauseAttempt(auth.user.id, attemptId, body.data.paused))
      return mobileJson({ success: true });
    return await rejectionOf(auth.user.id, attemptId, "conflict");
  } catch (error) {
    return serverError("POST /api/mobile/v1/challenges/[id]/pause", error);
  }
}

/**
 * チャレンジの今の状態を返す（アプリ向け）
 * チャレンジ状態API（アプリ向け）
 *
 * 通信が切れた・裏から戻った・アプリが落ちたアプリが、手元の状態を捨てて
 * サーバーに合わせ直すために読む。今の問題の正解は返さない。
 */
export async function handleReadChallenge(
  request: Request,
  attemptId: string,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readChallenge");
  if (!auth.ok) return auth.response;
  if (!attemptIdSchema.safeParse(attemptId).success)
    return challengeError("invalidRequest", 400);
  try {
    const status = await readAttemptStatus(auth.user.id, attemptId);
    if (!status) return challengeError("invalidChallenge", 404);
    return mobileJson<MobileChallengeStatus>({
      id: status.id,
      sequence: status.sequence,
      question: status.question,
      menuType: status.menuType,
      variant: status.variant,
      settings: status.settings,
      score: status.score,
      incorrectAnswers: status.incorrectAnswers,
      elapsedMs: status.elapsedMs,
      remainingMs: status.remainingMs,
      paused: status.paused,
      finished: status.finished,
    });
  } catch (error) {
    return serverError("GET /api/mobile/v1/challenges/[id]", error);
  }
}

/**
 * 時間切れのときに出ていた問題を返す（アプリ向け）
 * 時間切れ問題API（アプリ向け）
 *
 * 期限前は残り時間だけを返す（早く終わらせて問題を見る経路を作らない）。
 */
export async function handleReadUnanswered(
  request: Request,
  attemptId: string,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readChallenge");
  if (!auth.ok) return auth.response;
  if (!attemptIdSchema.safeParse(attemptId).success)
    return challengeError("invalidRequest", 400);
  try {
    const result = await revealExpiredAttempt(auth.user.id, attemptId);
    if (result) return mobileJson<MobileUnansweredResponse>(result);
    return await rejectionOf(auth.user.id, attemptId, "conflict");
  } catch (error) {
    return serverError("GET /api/mobile/v1/challenges/[id]/unanswered", error);
  }
}

/**
 * チャレンジを確定し、成績を記録する（アプリ向け）
 * チャレンジ確定API（アプリ向け）
 *
 * 成績はサーバーの状態からだけ作る（web の `savePracticeResult` と同じ）。
 * 確定済みへの再送には同じ ID を返す。まだ終わっていなければ 409
 * `notFinished`、1 問も答えずに終わった（記録が無い）なら 422。
 */
export async function handleFinishChallenge(
  request: Request,
  attemptId: string,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "finishChallenge");
  if (!auth.ok) return auth.response;
  if (!attemptIdSchema.safeParse(attemptId).success)
    return challengeError("invalidRequest", 400);
  try {
    const result = await finishAttempt(auth.user.id, attemptId, false);
    if (result && "challengeResultId" in result)
      return mobileJson<MobileFinishChallengeResponse>({
        challengeResultId: result.challengeResultId,
      });
    const status = await readAttemptStatus(auth.user.id, attemptId);
    if (!status) return challengeError("invalidChallenge", 404);
    return status.finished
      ? challengeError("invalidChallenge", 422)
      : challengeError("notFinished", 409);
  } catch (error) {
    return serverError("POST /api/mobile/v1/challenges/[id]/finish", error);
  }
}
