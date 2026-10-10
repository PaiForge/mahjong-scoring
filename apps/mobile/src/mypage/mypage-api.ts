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
import {
  MOBILE_PROFILE_API_PATH,
  isMobileProfileErrorCode,
  parseMobileProfileResponse,
  type MobileProfileErrorCode,
  type MobileProfileResponse,
} from "@mahjong-scoring/features/profile/mobile-api";
import type { ProfileInput } from "@mahjong-scoring/features/profile/validation";
import type { PracticeBoard } from "@mahjong-scoring/features/practice-menu-types";

import {
  apiFailureOf,
  callMobileApi,
  errorOf,
  type ApiFailure,
} from "../auth/api-client";

/** マイページ・マイレコードの API の失敗 */
export type MypageApiFailure = ApiFailure | MobileMypageErrorCode;

/** 読み取りの結果。失敗なら理由 */
export type MypageApiResult<T> = T | { readonly error: MypageApiFailure };

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
  if (response.status === 409) {
    const error = await errorOf(response);
    return { error: isMobileMypageErrorCode(error) ? error : "unknown" };
  }
  if (!response.ok) return { error: await apiFailureOf(response) };
  const value = parse(await response.json().catch(() => undefined));
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

/**
 * プロフィール編集の材料を読む
 * プロフィール取得
 */
export function fetchProfile(
  userId: string,
): Promise<MypageApiResult<MobileProfileResponse>> {
  return read(userId, MOBILE_PROFILE_API_PATH, parseMobileProfileResponse);
}

/** プロフィールの保存の失敗 */
export type SaveProfileFailure = MypageApiFailure | MobileProfileErrorCode;

/**
 * プロフィール（表示名・自己紹介・SNS）を保存する
 * プロフィール保存
 *
 * 編集を始めたユーザーの名義でだけ送る（`asUser`）。422 は入力の誤りで、
 * 理由は web のフォームと同じ検証のもの。
 */
export async function saveProfile(
  userId: string,
  input: ProfileInput,
): Promise<
  { readonly success: true } | { readonly error: SaveProfileFailure }
> {
  const response = await callMobileApi(MOBILE_PROFILE_API_PATH, {
    method: "POST",
    body: input,
    asUser: userId,
  });
  if (typeof response === "string") return { error: response };
  if (response.status === 409 || response.status === 422) {
    const error = await errorOf(response);
    return {
      error:
        isMobileMypageErrorCode(error) || isMobileProfileErrorCode(error)
          ? error
          : "unknown",
    };
  }
  if (!response.ok) return { error: await apiFailureOf(response) };
  return { success: true };
}
