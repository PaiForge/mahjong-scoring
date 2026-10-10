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
  MOBILE_PROFILE_AVATAR_API_PATH,
  MOBILE_PROFILE_AVATAR_DELETE_API_PATH,
  isMobileAvatarErrorCode,
  isMobileProfileErrorCode,
  parseMobileAvatarResponse,
  parseMobileProfileResponse,
  type MobileAvatarErrorCode,
  type MobileAvatarResponse,
  type MobileProfileErrorCode,
  type MobileProfileResponse,
} from "@mahjong-scoring/features/profile/mobile-api";
import type { ProfileInput } from "@mahjong-scoring/features/profile/validation";
import { File } from "expo-file-system";
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

/** アバター画像の保存・削除の失敗 */
export type AvatarApiFailure = MypageApiFailure | MobileAvatarErrorCode;

/**
 * アバター画像を上げる
 * アバターアップロード
 *
 * @param jpegUri - 端末上の JPEG のファイル（`pickAvatarImage` が作ったもの）
 */
export async function uploadAvatar(
  userId: string,
  jpegUri: string,
): Promise<MobileAvatarResponse | { readonly error: AvatarApiFailure }> {
  const body = new FormData();
  // React Native の FormData の { uri, name, type } は使えない。global の
  // fetch は Expo の実装（expo/fetch）に置き換わっていて、その FormData は
  // Blob（か bytes() を持つもの）しか送れず、uri の部品は送る前に例外になる
  // （2026-10 に Release ビルドで実測）。expo-file-system の File は Blob を
  // 実装し、名前と拡張子から決まる形式（image/jpeg）を部品のヘッダに載せる
  body.append("file", new File(jpegUri));
  const response = await callMobileApi(MOBILE_PROFILE_AVATAR_API_PATH, {
    method: "POST",
    body,
    asUser: userId,
  });
  if (typeof response === "string") return { error: response };
  if (response.status === 409 || response.status === 422) {
    const error = await errorOf(response);
    return {
      error:
        isMobileMypageErrorCode(error) || isMobileAvatarErrorCode(error)
          ? error
          : "unknown",
    };
  }
  if (!response.ok) return { error: await apiFailureOf(response) };
  const value = parseMobileAvatarResponse(
    await response.json().catch(() => undefined),
  );
  return value ?? { error: "unknown" };
}

/**
 * アバター画像を消す
 * アバター削除
 */
export async function deleteAvatar(
  userId: string,
): Promise<{ readonly success: true } | { readonly error: AvatarApiFailure }> {
  const response = await callMobileApi(MOBILE_PROFILE_AVATAR_DELETE_API_PATH, {
    method: "POST",
    asUser: userId,
  });
  if (typeof response === "string") return { error: response };
  if (response.status === 409) {
    const error = await errorOf(response);
    return { error: isMobileMypageErrorCode(error) ? error : "unknown" };
  }
  if (!response.ok) return { error: await apiFailureOf(response) };
  return { success: true };
}
