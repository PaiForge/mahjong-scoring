import {
  MOBILE_DAILY_PROBLEM_ANSWER_API_PATH,
  MOBILE_DAILY_PROBLEM_API_PATH,
  isMobileDailyProblemErrorCode,
  parseMobileDailyProblemAnswerResponse,
  parseMobileDailyProblemResponse,
  type MobileDailyProblemAnswerRequest,
  type MobileDailyProblemAnswerResponse,
  type MobileDailyProblemErrorCode,
  type MobileDailyProblemResponse,
} from "@mahjong-scoring/features/daily-problem/mobile-api";

import type { ApiFailure } from "../auth/api-client";
import {
  domainFailureOf,
  readMobileApi,
  requestMobileApi,
  type MobileApiResult,
  type MobileApiValue,
} from "../auth/request-mobile-api";

/**
 * 本日の問題の API（アプリ側の呼び出し）
 * 本日の問題API
 *
 * 入口は 2 つで、どちらも Bearer 認証（ログイン中だけ呼ぶ）。
 *
 * - GET `/api/mobile/v1/daily-problem` — 今日（JST）の問題の盤面と自分の解答。
 *   今日は問題が無い日も成功（`problem: null`）
 * - POST `/api/mobile/v1/daily-problem/answer` — 自分の解答の正誤を記録する
 *
 * どちらも返すのは自分の解答だけで、他の利用者の情報（正解率・解答者数等）は
 * 返さない — アプリには他の利用者を見せる画面を持ち込まない。正解も返らない
 * （盤面を端末のルール設定で組み立て、その場で採点して正誤だけを送る）。
 * 応答は契約（features の `daily-problem/mobile-api.ts`）の parse を通し、
 * 形が違えば `unknown` にする。
 */

/**
 * 本日の問題の API の失敗
 *
 * `staleDay` は日をまたいだ・今日の問題が無い・停止中（409）。`serverError` は
 * サーバー側の一時的な失敗（500）。
 */
export type DailyProblemApiFailure =
  ApiFailure | MobileDailyProblemErrorCode | "serverError";

/** 失敗の応答を、本日の問題に固有の理由・サーバーの失敗・共通の理由に丸める */
function dailyProblemFailureOf(
  response: Response,
): Promise<DailyProblemApiFailure> {
  return domainFailureOf(response, isMobileDailyProblemErrorCode);
}

/**
 * 今日の問題と自分の解答を読む
 * 本日の問題取得
 *
 * `useFocusRead` にそのまま渡せる `T | { error }` の形で返す。読んでいる間に
 * 別のユーザーへ切り替わったら送らない（`asUser`）。
 */
export function fetchDailyProblem(
  userId: string,
): Promise<MobileApiValue<MobileDailyProblemResponse, DailyProblemApiFailure>> {
  return readMobileApi(
    MOBILE_DAILY_PROBLEM_API_PATH,
    { asUser: userId },
    parseMobileDailyProblemResponse,
    dailyProblemFailureOf,
  );
}

/**
 * 今日の問題の解答（正誤）を記録する
 * 本日の問題解答送信
 *
 * サーバーは最初の解答だけを残し、2 回目以降は記録を変えずに最初の解答を
 * 返す。`day` は読んだときの応答の `day` で、日をまたいでから送ると `staleDay`
 * で弾かれる（前日の問題を今日の解答として残さない）。
 *
 * @param userId - 送る名義。ログインが別のユーザーに替わっていれば送らない
 * @param day - 読んだ問題の日付（JST の `YYYY-MM-DD`）
 * @param isCorrect - 端末で採点した正誤
 */
export async function sendDailyProblemAnswer(
  userId: string,
  day: string,
  isCorrect: boolean,
): Promise<
  MobileApiResult<MobileDailyProblemAnswerResponse, DailyProblemApiFailure>
> {
  const body: MobileDailyProblemAnswerRequest = { day, isCorrect };
  const result = await requestMobileApi(
    MOBILE_DAILY_PROBLEM_ANSWER_API_PATH,
    { method: "POST", body, asUser: userId },
    parseMobileDailyProblemAnswerResponse,
    dailyProblemFailureOf,
  );
  if ("value" in result)
    for (const listener of answerListeners) listener(userId);
  return result;
}

const answerListeners = new Set<(userId: string) => void>();

/** 保存完了を購読し、送信待ちでホームへ戻った場合も解答済みに更新する。 */
export function subscribeDailyProblemAnswers(
  listener: (userId: string) => void,
): () => void {
  answerListeners.add(listener);
  return () => {
    answerListeners.delete(listener);
  };
}
