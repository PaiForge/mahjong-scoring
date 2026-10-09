import type { ExpInfo } from "@mahjong-scoring/core";
import { z } from "zod";

import type { BuildJourneyInput, PracticeAttempt } from "../journey/journey";
import { isPracticeMenuSlug } from "../practice-menu-types";
import { isRankSlug, type RankSlug } from "../ranks/registry";
import type { ChallengeQuestion, ChallengeSettings } from "./types";

/**
 * アプリ向けのチャレンジ・進み具合の API の契約（パス・要求・応答）
 *
 * 認証とエラーの理由（`unauthorized` 等）は `account/mobile-api.ts` と共通。
 * ここにはチャレンジとレッスンに固有のものだけを置く。
 */

const MOBILE_API_PREFIX = "/api/mobile/v1";

/**
 * チャレンジを始める API のパス（POST）
 * チャレンジ開始APIパス
 */
export const MOBILE_CHALLENGES_API_PATH = `${MOBILE_API_PREFIX}/challenges`;

/**
 * 1 回のチャレンジの API のパス。`action` を省くと状態の取得（GET）
 * チャレンジAPIパス
 */
export function mobileChallengeApiPath(
  attemptId: string,
  action?: "answers" | "pause" | "finish" | "unanswered",
): string {
  const base = `${MOBILE_CHALLENGES_API_PATH}/${encodeURIComponent(attemptId)}`;
  return action === undefined ? base : `${base}/${action}`;
}

/**
 * 本人の進み具合（黒帯への道の材料）を返す API のパス（GET）
 * 進み具合APIパス
 */
export const MOBILE_PROGRESS_API_PATH = `${MOBILE_API_PREFIX}/progress`;

/**
 * レッスンの完了をまとめて記録する API のパス（POST）
 * レッスン完了APIパス
 */
export const MOBILE_LESSON_COMPLETIONS_API_PATH = `${MOBILE_API_PREFIX}/lessons/complete`;

/** 1 回の要求で送れるレッスンの完了の上限（カリキュラムの章数より十分大きい） */
export const MOBILE_LESSON_COMPLETIONS_MAX = 50;

/**
 * チャレンジの API が返す、チャレンジ固有の失敗の理由
 *
 * - `invalidRequest` — 要求の形が違う（400）。送り直しても通らない
 * - `invalidChallenge` — 始められない・見つからない（422 / 404）。他人の ID・
 *   存在しない練習・バリアントなど
 * - `conflict` — 同じ ID・同じ回答番号で中身が違う、または今の状態では
 *   受け付けられない（409）。アプリは状態を取り直して合わせる
 * - `notFinished` — 確定しようとしたが、まだ終わっていない（409）
 */
export const MOBILE_CHALLENGE_ERROR_CODES = [
  "invalidRequest",
  "invalidChallenge",
  "conflict",
  "notFinished",
] as const;

/** チャレンジ固有の失敗の理由（{@link MOBILE_CHALLENGE_ERROR_CODES}） */
export type MobileChallengeErrorCode =
  (typeof MOBILE_CHALLENGE_ERROR_CODES)[number];

const challengeErrorCodeSet: ReadonlySet<string> = new Set(
  MOBILE_CHALLENGE_ERROR_CODES,
);

/** 値がチャレンジ固有の失敗の理由かを判定する型ガード */
export function isMobileChallengeErrorCode(
  value: unknown,
): value is MobileChallengeErrorCode {
  return typeof value === "string" && challengeErrorCodeSet.has(value);
}

/**
 * チャレンジ開始の要求
 *
 * `id` はアプリが決める UUID。応答を失ったら同じ ID・同じ中身で送り直すと、
 * 作り直さずに同じチャレンジが返る。
 */
export interface MobileBeginChallengeRequest {
  readonly id: string;
  readonly menuType: string;
  readonly variant: string;
  readonly settings: ChallengeSettings;
}

/**
 * 出ている問題（正解は伏せてある）と、その番号
 * チャレンジの入口
 */
export interface MobileChallengeEntry {
  readonly id: string;
  readonly sequence: number;
  readonly question: ChallengeQuestion;
}

/** 回答の要求。`sequence` は回答した問題の番号 */
export interface MobileAnswerChallengeRequest {
  readonly sequence: number;
  readonly answer: unknown;
}

/**
 * 回答の応答
 *
 * - 採点した: 正誤・回答した問題（正解込み）・次の問題とその番号・採点時点の
 *   サーバーの経過時間（画面の時計をこれに合わせ直す）
 * - `expired` — 届いた時点で制限時間を過ぎていた
 */
export type MobileAnswerChallengeResponse =
  | {
      readonly correct: boolean;
      readonly answered: ChallengeQuestion;
      readonly question: ChallengeQuestion;
      readonly sequence: number;
      readonly elapsedMs: number;
    }
  | { readonly expired: true };

/** 一時停止・再開の要求 */
export interface MobilePauseChallengeRequest {
  readonly paused: boolean;
}

/**
 * チャレンジの今の状態（復帰用）
 * チャレンジ状態
 *
 * 時計はサーバーの今の値。アプリは手元の時計を捨ててこれに合わせる。
 */
export interface MobileChallengeStatus extends MobileChallengeEntry {
  readonly menuType: string;
  readonly variant: string;
  readonly settings: ChallengeSettings;
  readonly score: number;
  readonly incorrectAnswers: number;
  readonly elapsedMs: number;
  readonly remainingMs: number;
  readonly paused: boolean;
  /** 確定済みか */
  readonly finished: boolean;
}

/**
 * 時間切れのときに出ていた問題の応答
 *
 * 期限前なら残り時間だけを返す（サーバーの時計と画面の時計の差。待ってから
 * もう一度読む）。
 */
export type MobileUnansweredResponse =
  { readonly question: ChallengeQuestion } | { readonly remainingMs: number };

/**
 * 確定の応答。記録した成績の ID と、その成績で付いた経験値
 *
 * 確定済みのチャレンジへの再送にも、記録し直さずに同じ ID と同じ経験値を
 * 返す。`exp` は経験値の対象にならない練習と、経験値を読めなかったときに
 * 無い（成績の記録は済んでいる）。
 */
export interface MobileFinishChallengeResponse {
  readonly challengeResultId: string;
  readonly exp?: ExpInfo;
}

/**
 * 本人の進み具合（`buildJourney` の入力を JSON に載る形にしたもの）
 * 進み具合応答
 */
export interface MobileProgressResponse {
  readonly completedLessonSlugs: readonly string[];
  readonly attemptedPractices: readonly PracticeAttempt[];
  readonly achievedRankSlugs: readonly RankSlug[];
}

/** レッスン完了の記録の要求 */
export interface MobileCompleteLessonsRequest {
  readonly slugs: readonly string[];
}

/**
 * レッスン完了の記録の応答
 *
 * `completed` は記録した（記録済みも含む）slug、`rejected` はカリキュラムに
 * 無く捨てた slug。アプリはどちらも未送信から外す。
 */
export interface MobileCompleteLessonsResponse {
  readonly completed: readonly string[];
  readonly rejected: readonly string[];
}

// 応答の検証。問題の中身は盤面ごとに形が違い、サーバーが同じ練習の問題だけを
// 返すことを前提に盤面へ渡す（`asHostedQuestion`）。ここではオブジェクトで
// あることだけを見る
const questionSchema = z.custom<ChallengeQuestion>(
  (value) => typeof value === "object" && value !== null,
);

const entrySchema = z.object({
  id: z.string(),
  sequence: z.number(),
  question: questionSchema,
});

/**
 * チャレンジの入口（開始の応答）を検証する。形が違えば undefined
 * チャレンジ入口検証
 */
export function parseMobileChallengeEntry(
  body: unknown,
): MobileChallengeEntry | undefined {
  const parsed = entrySchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}

const answerSchema = z.union([
  z.object({ expired: z.literal(true) }),
  z.object({
    correct: z.boolean(),
    answered: questionSchema,
    question: questionSchema,
    sequence: z.number(),
    elapsedMs: z.number(),
  }),
]);

/**
 * 回答の応答を検証する。形が違えば undefined
 * 回答応答検証
 */
export function parseMobileAnswerResponse(
  body: unknown,
): MobileAnswerChallengeResponse | undefined {
  const parsed = answerSchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}

const statusSchema = entrySchema.extend({
  menuType: z.string(),
  variant: z.string(),
  settings: z.object({ renfonpaiAs4Fu: z.boolean() }),
  score: z.number(),
  incorrectAnswers: z.number(),
  elapsedMs: z.number(),
  remainingMs: z.number(),
  paused: z.boolean(),
  finished: z.boolean(),
});

/**
 * チャレンジの状態を検証する。形が違えば undefined
 * チャレンジ状態検証
 */
export function parseMobileChallengeStatus(
  body: unknown,
): MobileChallengeStatus | undefined {
  const parsed = statusSchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}

const unansweredSchema = z.union([
  z.object({ question: questionSchema }),
  z.object({ remainingMs: z.number() }),
]);

/**
 * 時間切れの問題の応答を検証する。形が違えば undefined
 * 時間切れ問題応答検証
 */
export function parseMobileUnansweredResponse(
  body: unknown,
): MobileUnansweredResponse | undefined {
  const parsed = unansweredSchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}

const expInfoSchema = z.object({
  earnedExp: z.number(),
  totalExp: z.number(),
  level: z.number(),
  levelUp: z.boolean(),
  progressPercent: z.number(),
});

const finishSchema = z.object({
  challengeResultId: z.string(),
  exp: expInfoSchema.optional(),
});

/**
 * 確定の応答を検証する。形が違えば undefined
 * 確定応答検証
 */
export function parseMobileFinishResponse(
  body: unknown,
): MobileFinishChallengeResponse | undefined {
  const parsed = finishSchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}

const progressSchema = z.object({
  completedLessonSlugs: z.array(z.string()),
  attemptedPractices: z.array(
    z.object({ slug: z.string(), variant: z.string() }),
  ),
  achievedRankSlugs: z.array(z.string()),
});

/**
 * 進み具合の応答を検証し、`buildJourney` の入力にする。形が違えば undefined
 * 進み具合応答検証
 *
 * アプリが知らない練習・段級位は落とす（サーバーがアプリより新しい版で
 * 増えたものを返したとき）。バリアントは落とさない — web と同じく、今の
 * レジストリに無い土俵も「挑戦はした」として数える（`PracticeAttempt` の
 * TSDoc）。レッスンは `buildJourney` が今の章だけを数える。
 */
export function parseMobileProgressResponse(
  body: unknown,
): BuildJourneyInput | undefined {
  const parsed = progressSchema.safeParse(body);
  if (!parsed.success) return undefined;
  return {
    completedLessonSlugs: new Set(parsed.data.completedLessonSlugs),
    attemptedPractices: parsed.data.attemptedPractices.flatMap(
      ({ slug, variant }) =>
        isPracticeMenuSlug(slug) ? [{ slug, variant }] : [],
    ),
    achievedRankSlugs: parsed.data.achievedRankSlugs.filter(isRankSlug),
  };
}

const completeLessonsSchema = z.object({
  completed: z.array(z.string()),
  rejected: z.array(z.string()),
});

/**
 * レッスン完了の記録の応答を検証する。形が違えば undefined
 * レッスン完了応答検証
 */
export function parseMobileCompleteLessonsResponse(
  body: unknown,
): MobileCompleteLessonsResponse | undefined {
  const parsed = completeLessonsSchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}
