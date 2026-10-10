import "server-only";

import type { NextResponse } from "next/server";
import { z } from "zod";

import type {
  MobileProfileErrorCode,
  MobileProfileResponse,
} from "@mahjong-scoring/features/profile/mobile-api";
import { PROFILE_LIMITS } from "@mahjong-scoring/features/profile/validation";

import { getProfileForEdit } from "../db/queries";
import { updateProfileForUser } from "../users/update-profile";

import { authorizeMobileRequest } from "./auth";
import { usernameRequired } from "./mypage";
import { parseMobileBody } from "./request";
import { mobileJson, mobileServerError } from "./response";

/**
 * 要求の 1 項目の長さの上限。本当の上限は検証側（`PROFILE_LIMITS`）が持ち、
 * 超えた入力は 422 で理由を返したいので、ここでは最も長い欄（自己紹介）の
 * 倍まで通して型と桁だけを見る。
 */
const FIELD_MAX_LENGTH = PROFILE_LIMITS.bio * 2;

/**
 * 本文の上限。{@link bodySchema} を通る本文がすべて収まる大きさにする
 * （本文の上限で、要求の形より先に何かを弾かない）。
 *
 * 1 項目は最長 1000（UTF-16 の単位）で、JSON の文字列では 1 単位が最悪
 * 6 バイト（制御文字の `\uXXXX`）になる。5 項目で 30000 バイト、キーと
 * 括弧を足しても 32 KiB に収まる。
 */
const BODY_MAX_BYTES = 32 * 1024;

const field = z.string().max(FIELD_MAX_LENGTH);
const bodySchema = z.object({
  displayName: field,
  bio: field,
  xUsername: field,
  instagramUsername: field,
  youtubeHandle: field,
});

/**
 * プロフィール編集の材料を返す（アプリ向け）
 * プロフィール取得API（アプリ向け）
 *
 * web のプロフィール編集の初期値と同じく、未設定の欄は空文字で返す。
 * ユーザー名を決める前は 409 `usernameRequired`。
 */
export async function handleReadProfile(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readMobileMypage");
  if (!auth.ok) return auth.response;
  if (!auth.profile) return usernameRequired();
  try {
    const profile = await getProfileForEdit(auth.user.id);
    if (!profile) return usernameRequired();
    return mobileJson<MobileProfileResponse>({
      username: auth.profile.username,
      displayName: profile.displayName ?? "",
      bio: profile.bio ?? "",
      xUsername: profile.xUsername ?? "",
      instagramUsername: profile.instagramUsername ?? "",
      youtubeHandle: profile.youtubeHandle ?? "",
      avatarUrl: profile.avatarUrl ?? undefined,
    });
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/profile",
      "読み取りに失敗",
      error,
    );
  }
}

/**
 * プロフィール（表示名・自己紹介・SNS）を更新する（アプリ向け）
 * プロフィール更新API（アプリ向け）
 *
 * web のプロフィール編集と同じ本体（`updateProfileForUser`）を呼び、
 * 回数制限の枠も web と共有する。入力の誤りは 422 で理由を返す。
 * ユーザー名を決める前は 409 `usernameRequired`（書く行がまだ無い）。
 */
export async function handleUpdateProfile(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "updateProfile");
  if (!auth.ok) return auth.response;
  if (!auth.profile) return usernameRequired();
  const body = await parseMobileBody(request, bodySchema, BODY_MAX_BYTES);
  if (!body.ok) return body.response;

  const result = await updateProfileForUser(auth.user.id, body.data);
  if (!("error" in result)) return mobileJson({ success: true });
  switch (result.error) {
    // 認証を通った後に退会が受け付けられた（入口で弾いたときと同じ答え）
    case "unauthorized":
      return mobileJson({ error: "deleted" }, { status: 403 });
    // 記録は本体（updateProfileForUser）が済ませている
    case "updateFailed":
      return mobileJson({ error: "serverError" }, { status: 500 });
    default:
      return mobileJson<{ error: MobileProfileErrorCode }>(
        { error: result.error },
        { status: 422 },
      );
  }
}
