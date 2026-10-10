import { authorizeApiRequest } from "@/lib/api-auth";
import { jsonPrivate } from "@/lib/api-response";
import { readUploadedImage } from "@/lib/images/read-uploaded-image";
import { removeAvatarForUser, saveAvatarForUser } from "@/lib/users/avatar";

/**
 * アバター画像のアップロード（POST）・削除（DELETE）エンドポイント。
 *
 * 本体（正規化・保存・参照の差し替え）はアプリ向け API と共有する
 * `lib/users/avatar.ts`。ここは認証と受け付ける画像の検証、応答の形だけを持つ。
 *
 * アバターアップロードAPI
 */

/** 保存の失敗ごとの HTTP ステータス */
const SAVE_ERROR_STATUS = {
  invalidImage: 400,
  uploadFailed: 500,
  unauthorized: 401,
} as const;

export async function POST(request: Request) {
  const auth = await authorizeApiRequest(request, "uploadAvatar");
  if (!auth.ok) return auth.response;

  const image = await readUploadedImage(request);
  if (!image.ok) return image.response;

  const result = await saveAvatarForUser(
    auth.user.id,
    image.buffer,
    "POST /api/profile/avatar",
  );
  if ("error" in result) {
    return jsonPrivate(
      { error: result.error },
      { status: SAVE_ERROR_STATUS[result.error] },
    );
  }
  return jsonPrivate({ success: true, avatarUrl: result.avatarUrl });
}

export async function DELETE(request: Request) {
  const auth = await authorizeApiRequest(request, "deleteAvatar");
  if (!auth.ok) return auth.response;

  await removeAvatarForUser(auth.user.id);
  return jsonPrivate({ success: true });
}
