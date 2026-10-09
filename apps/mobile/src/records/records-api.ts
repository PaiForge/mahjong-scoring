import {
  MOBILE_CHALLENGES_API_PATH,
  MOBILE_LESSON_COMPLETIONS_API_PATH,
  MOBILE_LESSON_COMPLETIONS_MAX,
  MOBILE_PROGRESS_API_PATH,
  isMobileChallengeErrorCode,
  mobileChallengeApiPath,
  parseMobileAnswerResponse,
  parseMobileChallengeEntry,
  parseMobileChallengeStatus,
  parseMobileCompleteLessonsResponse,
  parseMobileFinishResponse,
  parseMobileProgressResponse,
  parseMobileUnansweredResponse,
  type MobileAnswerChallengeResponse,
  type MobileBeginChallengeRequest,
  type MobileChallengeEntry,
  type MobileChallengeErrorCode,
  type MobileChallengeStatus,
  type MobileCompleteLessonsResponse,
  type MobileFinishChallengeResponse,
  type MobileUnansweredResponse,
} from "@mahjong-scoring/features/challenge/mobile-api";
import type { BuildJourneyInput } from "@mahjong-scoring/features/journey/journey";

import {
  apiFailureOf,
  callMobileApi,
  errorOf,
  type ApiFailure,
  type MobileApiInit,
} from "../auth/api-client";

/**
 * 記録の API の失敗
 *
 * `serverError` はサーバー側の一時的な失敗（500）で、同じ要求を送り直してよい。
 */
export type RecordsApiFailure =
  ApiFailure | MobileChallengeErrorCode | "serverError";

/** 記録の API の結果 */
export type RecordsApiResult<T> =
  { readonly value: T } | { readonly error: RecordsApiFailure };

/** 要求を送り、成功なら応答を検証して返す */
async function request<T>(
  path: string,
  init: MobileApiInit & { readonly asUser: string },
  parse: (body: unknown) => T | undefined,
): Promise<RecordsApiResult<T>> {
  const response = await callMobileApi(path, init);
  if (typeof response === "string") return { error: response };
  if (response.ok) {
    const value = parse(await response.json().catch(() => undefined));
    return value === undefined ? { error: "unknown" } : { value };
  }
  if (response.status >= 500 && response.status !== 503)
    return { error: "serverError" };
  const error = await errorOf(response.clone());
  return {
    error: isMobileChallengeErrorCode(error)
      ? error
      : await apiFailureOf(response),
  };
}

/**
 * 記録付きのチャレンジを始める（同じ ID の再送は同じチャレンジを返す）
 * チャレンジ開始
 */
export function beginRecordedChallenge(
  userId: string,
  body: MobileBeginChallengeRequest,
): Promise<RecordsApiResult<MobileChallengeEntry>> {
  return request(
    MOBILE_CHALLENGES_API_PATH,
    { method: "POST", body, asUser: userId },
    parseMobileChallengeEntry,
  );
}

/**
 * 回答を送る（同じ番号・同じ回答の再送は同じ応答を返す）
 * 回答送信
 */
export function answerRecordedChallenge(
  userId: string,
  attemptId: string,
  sequence: number,
  answer: unknown,
): Promise<RecordsApiResult<MobileAnswerChallengeResponse>> {
  return request(
    mobileChallengeApiPath(attemptId, "answers"),
    { method: "POST", body: { sequence, answer }, asUser: userId },
    parseMobileAnswerResponse,
  );
}

/**
 * 一時停止・再開をサーバーに伝える
 * 一時停止送信
 */
export function pauseRecordedChallenge(
  userId: string,
  attemptId: string,
  paused: boolean,
): Promise<RecordsApiResult<true>> {
  return request(
    mobileChallengeApiPath(attemptId, "pause"),
    { method: "POST", body: { paused }, asUser: userId },
    () => true as const,
  );
}

/**
 * チャレンジの今の状態を読む
 * チャレンジ状態取得
 */
export function readRecordedChallenge(
  userId: string,
  attemptId: string,
): Promise<RecordsApiResult<MobileChallengeStatus>> {
  return request(
    mobileChallengeApiPath(attemptId),
    { asUser: userId },
    parseMobileChallengeStatus,
  );
}

/**
 * 時間切れのときに出ていた問題を読む（期限前なら残り時間）
 * 時間切れ問題取得
 */
export function readUnansweredQuestion(
  userId: string,
  attemptId: string,
): Promise<RecordsApiResult<MobileUnansweredResponse>> {
  return request(
    mobileChallengeApiPath(attemptId, "unanswered"),
    { asUser: userId },
    parseMobileUnansweredResponse,
  );
}

/**
 * チャレンジを確定し、成績を記録する（確定済みへの再送は同じ結果）
 * チャレンジ確定
 */
export function finishRecordedChallenge(
  userId: string,
  attemptId: string,
): Promise<RecordsApiResult<MobileFinishChallengeResponse>> {
  return request(
    mobileChallengeApiPath(attemptId, "finish"),
    { method: "POST", asUser: userId },
    parseMobileFinishResponse,
  );
}

/**
 * 本人の進み具合（黒帯への道の材料）を読む
 * 進み具合取得
 */
export function fetchProgress(
  userId: string,
): Promise<RecordsApiResult<BuildJourneyInput>> {
  return request(
    MOBILE_PROGRESS_API_PATH,
    { asUser: userId },
    parseMobileProgressResponse,
  );
}

/**
 * レッスンの完了をまとめて記録する（上限を超える分は次の呼び出しに回す）
 * レッスン完了送信
 */
export function sendLessonCompletions(
  userId: string,
  slugs: readonly string[],
): Promise<RecordsApiResult<MobileCompleteLessonsResponse>> {
  return request(
    MOBILE_LESSON_COMPLETIONS_API_PATH,
    {
      method: "POST",
      body: { slugs: slugs.slice(0, MOBILE_LESSON_COMPLETIONS_MAX) },
      asUser: userId,
    },
    parseMobileCompleteLessonsResponse,
  );
}
