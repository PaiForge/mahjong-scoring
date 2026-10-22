import { API_ERROR_BANNED, API_ERROR_RATE_LIMITED } from "@/lib/api-client";
import { prepareImageForUpload } from "@/lib/client-images/prepare-image-for-upload";
import {
  AVATAR_MAX_FILE_SIZE,
  isAllowedImageMimeType,
} from "@/lib/images/policy";
import { logExternalError } from "@/lib/log-error";

/** アバターの画面の辞書（profileEdit）のエラーの文言のキー */
export type AvatarErrorKey =
  | "avatarConversionFailed"
  | "avatarInvalidType"
  | "avatarTooLarge"
  | "avatarUploadFailed"
  | "avatarRemoveFailed"
  | "rateLimited"
  | "banned";

/**
 * 選ばれたファイルをアップロードできる形に整え、送れない理由があればそれを返す
 * アバターファイルの準備
 *
 * 検証の前に正規化する。iPhone 既定の HEIC を JPEG へ変換し、大きすぎる
 * 画像はブラウザ側で縮小する。すでに web 対応形式かつ上限内ならそのまま返る。
 * 記録する価値があるのはこちらのパイプラインが壊れたとき（`encodeFailed`）だけ。
 * ブラウザがデコードできないファイルを選ぶのはユーザーの操作であってバグではない。
 */
export async function prepareAvatarFile(
  original: File,
): Promise<
  | { readonly ok: true; readonly file: File }
  | { readonly ok: false; readonly error: AvatarErrorKey }
> {
  const prepared = await prepareImageForUpload(original);
  if (!prepared.ok) {
    if (prepared.reason === "encodeFailed") {
      logExternalError(
        "AvatarUpload",
        `画像の変換に失敗しました (${original.type || "unknown"}, ${original.size}B)`,
        prepared.reason,
      );
    }
    return { ok: false, error: "avatarConversionFailed" };
  }
  const { file } = prepared;
  if (!isAllowedImageMimeType(file.type)) {
    return { ok: false, error: "avatarInvalidType" };
  }
  if (file.size > AVATAR_MAX_FILE_SIZE) {
    return { ok: false, error: "avatarTooLarge" };
  }
  return { ok: true, file };
}

/** アップロードの API のエラーを画面の文言のキーに直す */
export function avatarUploadErrorKey(error: string): AvatarErrorKey {
  if (error === "tooLarge") return "avatarTooLarge";
  if (error === "invalidType" || error === "invalidImage")
    return "avatarInvalidType";
  return avatarApiErrorKey(error, "avatarUploadFailed");
}

/** 削除の API のエラーを画面の文言のキーに直す */
export function avatarRemoveErrorKey(error: string): AvatarErrorKey {
  return avatarApiErrorKey(error, "avatarRemoveFailed");
}

function avatarApiErrorKey(
  error: string,
  fallback: AvatarErrorKey,
): AvatarErrorKey {
  if (error === API_ERROR_RATE_LIMITED) return "rateLimited";
  if (error === API_ERROR_BANNED) return "banned";
  return fallback;
}
