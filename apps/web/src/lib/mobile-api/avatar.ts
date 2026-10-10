import "server-only";

import type { NextResponse } from "next/server";

import type {
  MobileAvatarErrorCode,
  MobileAvatarResponse,
} from "@mahjong-scoring/features/profile/mobile-api";

import { readUploadedImageFile } from "../images/read-uploaded-image";
import { removeAvatarForUser, saveAvatarForUser } from "../users/avatar";

import { authorizeMobileRequest } from "./auth";
import { usernameRequired } from "./mypage";
import { mobileJson, mobileServerError } from "./response";

/**
 * アバター画像を上げる（アプリ向け）
 * アバターアップロードAPI（アプリ向け）
 *
 * web の /api/profile/avatar と同じ検証（`readUploadedImageFile`）と本体
 * （`saveAvatarForUser`）を通し、回数制限の枠も web と共有する。受け付けない
 * 画像は 422 で理由を返す。multipart として読めない・`file` が無いのは
 * 要求の形の誤りなので 400 `invalidRequest`（他のアプリ向け API と同じ）。
 * ユーザー名を決める前は 409 `usernameRequired`（書く行がまだ無い）。
 */
export async function handleUploadAvatar(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "uploadAvatar");
  if (!auth.ok) return auth.response;
  if (!auth.profile) return usernameRequired();

  const image = await readUploadedImageFile(request);
  if (!image.ok) {
    return image.error === "invalidForm" || image.error === "noFile"
      ? mobileJson({ error: "invalidRequest" }, { status: 400 })
      : rejectImage(image.error);
  }

  const result = await saveAvatarForUser(
    auth.user.id,
    image.buffer,
    "POST /api/mobile/v1/profile/avatar",
  );
  if (!("error" in result))
    return mobileJson<MobileAvatarResponse>({ avatarUrl: result.avatarUrl });
  switch (result.error) {
    case "invalidImage":
      return rejectImage("invalidImage");
    // 認証を通った後に退会が受け付けられた（入口で弾いたときと同じ答え）
    case "unauthorized":
      return mobileJson({ error: "deleted" }, { status: 403 });
    case "uploadFailed":
      return mobileJson({ error: "serverError" }, { status: 500 });
    default: {
      const exhaustive: never = result.error;
      return exhaustive;
    }
  }
}

/**
 * アバター画像を消す（アプリ向け）
 * アバター削除API（アプリ向け）
 *
 * web の DELETE /api/profile/avatar と同じ本体（`removeAvatarForUser`）。
 */
export async function handleDeleteAvatar(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "deleteAvatar");
  if (!auth.ok) return auth.response;
  if (!auth.profile) return usernameRequired();
  try {
    await removeAvatarForUser(auth.user.id);
    return mobileJson({ success: true });
  } catch (error) {
    return mobileServerError(
      "POST /api/mobile/v1/profile/avatar/delete",
      "削除に失敗",
      error,
    );
  }
}

function rejectImage(error: MobileAvatarErrorCode): NextResponse {
  return mobileJson<{ error: MobileAvatarErrorCode }>(
    { error },
    { status: 422 },
  );
}
