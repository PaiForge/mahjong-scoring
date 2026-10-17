import {
  MOBILE_MYPAGE_API_PATH,
  isMobileMypageErrorCode,
  parseMobileMypageResponse,
  type MobileMypageErrorCode,
  type MobileMypageResponse,
} from "@mahjong-scoring/features/mypage/mobile-api";
import {
  mobileRecordResultsApiUrl,
  mobileRecordsApiUrl,
  parseMobileRecordResultsResponse,
  parseMobileRecordsResponse,
  type MobileRecordResultsResponse,
  type MobileRecordsResponse,
} from "@mahjong-scoring/features/my-record/mobile-api";
import type { DatePeriod } from "@mahjong-scoring/features/my-record/types";
import type { PracticeBoard } from "@mahjong-scoring/features/practice-menu-types";

import {
  apiFailureOf,
  callMobileApi,
  errorOf,
  type ApiFailure,
} from "../auth/api-client";
import { readJson } from "../auth/read-json";

/** マイページ・マイレコードの API の失敗 */
export type MypageApiFailure = ApiFailure | MobileMypageErrorCode;

/** 読み取りの結果。失敗なら理由 */
export type MypageApiResult<T> = T | { readonly error: MypageApiFailure };

/**
 * 応答の 409 を `usernameRequired` に、それ以外の失敗を認証の理由に丸める
 * マイページ API 失敗理由
 *
 * マイページと、同じくユーザー名を決めた人のものである通知が使う（失敗の理由が
 * 同じ集合なので、`useMypageRead` がどちらの結果もそのまま扱える）。
 */
export async function mypageFailureOf(
  response: Response,
): Promise<MypageApiFailure> {
  if (response.status === 409) {
    const error = await errorOf(response);
    return isMobileMypageErrorCode(error) ? error : "unknown";
  }
  return apiFailureOf(response);
}

/**
 * GET を送り、成功なら応答を検証して返す
 *
 * 読んでいる間に別のユーザーへ切り替わったら送らない（`asUser`）。
 * 409 はユーザー名を決めていない（`usernameRequired`）。
 */
async function read<T extends object>(
  userId: string,
  path: string,
  parse: (body: unknown) => T | undefined,
): Promise<MypageApiResult<T>> {
  const response = await callMobileApi(path, { asUser: userId });
  if (typeof response === "string") return { error: response };
  if (!response.ok) return { error: await mypageFailureOf(response) };
  const value = parse(await readJson(response));
  return value ?? { error: "unknown" };
}

/**
 * マイページのトップの材料を読む
 * マイページ取得
 */
export function fetchMypage(
  userId: string,
): Promise<MypageApiResult<MobileMypageResponse>> {
  return read(userId, MOBILE_MYPAGE_API_PATH, parseMobileMypageResponse);
}

/**
 * マイレコードのダッシュボードの材料を読む
 * マイレコード取得
 *
 * @param board - 見たい土俵。省くと記録を持つ先頭の土俵
 */
export function fetchRecords(
  userId: string,
  board: PracticeBoard | undefined,
  period: DatePeriod,
): Promise<MypageApiResult<MobileRecordsResponse>> {
  return read(
    userId,
    mobileRecordsApiUrl(board, period),
    parseMobileRecordsResponse,
  );
}

/**
 * マイレコードの全履歴の 1 ページを読む
 * 全履歴取得
 */
export function fetchRecordResults(
  userId: string,
  page: number,
): Promise<MypageApiResult<MobileRecordResultsResponse>> {
  return read(
    userId,
    mobileRecordResultsApiUrl(undefined, page),
    parseMobileRecordResultsResponse,
  );
}
