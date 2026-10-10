import type { NextResponse } from "next/server";

import { jsonPrivate } from "@/lib/api-response";
import { validateImageBinarySignature } from "@/lib/images/binary-signature";
import {
  AVATAR_MAX_FILE_SIZE,
  isAllowedImageMimeType,
} from "@/lib/images/policy";

/**
 * 受け付けない画像の理由（400）
 *
 * - `invalidForm` — multipart として読めない
 * - `noFile` — `file` フィールドが無い
 * - `invalidType` — 許可していない形式、または中身が申告の形式と違う
 * - `tooLarge` — サイズの上限を超える
 */
export type UploadedImageError =
  "invalidForm" | "noFile" | "invalidType" | "tooLarge";

type ReadUploadedImageFileResult =
  | { readonly ok: true; readonly buffer: Buffer }
  | { readonly ok: false; readonly error: UploadedImageError };

type ReadUploadedImageResult =
  | { readonly ok: true; readonly buffer: Buffer }
  | { readonly ok: false; readonly response: NextResponse };

/**
 * multipart の `file` フィールドから、受け付けてよい画像のバイト列を取り出す
 * アップロード画像読み取り
 *
 * 画像アップロード API（アバター・広告画像・アプリのアバター）が sharp に
 * 渡す前に必ず通す検証の一式。形式の許可リスト・サイズ上限・バイナリ先頭の
 * 署名のどれか 1 つでも経路ごとに抜けると、その経路だけが任意のバイト列の
 * 入口になるためここ 1 箇所に置く。応答の形（CORS の有無）は経路ごとに
 * 違うので、ここでは理由だけを返す。web の API は {@link readUploadedImage} を使う。
 *
 * 上限はアバターと広告画像で共通（バケットの file_size_limit と一致させている）。
 */
export async function readUploadedImageFile(
  request: Request,
): Promise<ReadUploadedImageFileResult> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    // 壊れた multipart を 500 にしない（送信側の誤りなので 400）
    return { ok: false, error: "invalidForm" };
  }
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { ok: false, error: "noFile" };
  }
  if (!isAllowedImageMimeType(file.type)) {
    return { ok: false, error: "invalidType" };
  }
  if (file.size > AVATAR_MAX_FILE_SIZE) {
    return { ok: false, error: "tooLarge" };
  }

  const arrayBuffer = await file.arrayBuffer();
  // 拡張子・Content-Type 偽装対策にバイナリ先頭を検証する。
  if (!validateImageBinarySignature(arrayBuffer, file.type)) {
    return { ok: false, error: "invalidType" };
  }

  return { ok: true, buffer: Buffer.from(arrayBuffer) };
}

/**
 * {@link readUploadedImageFile} の web の API 向けの形。失敗時は 400 の応答を
 * `{ ok: false, response }` で返す（`authorizeApiRequest` と同じ形）。
 */
export async function readUploadedImage(
  request: Request,
): Promise<ReadUploadedImageResult> {
  const result = await readUploadedImageFile(request);
  if (result.ok) return result;
  return {
    ok: false,
    response: jsonPrivate({ error: result.error }, { status: 400 }),
  };
}
