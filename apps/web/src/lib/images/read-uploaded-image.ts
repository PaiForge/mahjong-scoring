import type { NextResponse } from "next/server";

import { jsonPrivate } from "@/lib/api-response";
import { validateImageBinarySignature } from "@/lib/images/binary-signature";
import {
  AVATAR_MAX_FILE_SIZE,
  isAllowedImageMimeType,
} from "@/lib/images/policy";

type ReadUploadedImageResult =
  | { readonly ok: true; readonly buffer: Buffer }
  | { readonly ok: false; readonly response: NextResponse };

/**
 * multipart の `file` フィールドから、受け付けてよい画像のバイト列を取り出す
 * アップロード画像読み取り
 *
 * 画像アップロード API（アバター・広告画像）が sharp に渡す前に必ず通す
 * 検証の一式。形式の許可リスト・サイズ上限・バイナリ先頭の署名のどれか
 * 1 つでも経路ごとに抜けると、その経路だけが任意のバイト列の入口になるため
 * ここ 1 箇所に置く。失敗時は 400 の応答を `{ ok: false, response }` で返す
 * （`authorizeApiRequest` と同じ形）。
 *
 * 上限はアバターと広告画像で共通（バケットの file_size_limit と一致させている）。
 */
export async function readUploadedImage(
  request: Request,
): Promise<ReadUploadedImageResult> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    // 壊れた multipart を 500 にしない（送信側の誤りなので 400）
    return reject("invalidForm");
  }
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return reject("noFile");
  }
  if (!isAllowedImageMimeType(file.type)) {
    return reject("invalidType");
  }
  if (file.size > AVATAR_MAX_FILE_SIZE) {
    return reject("tooLarge");
  }

  const arrayBuffer = await file.arrayBuffer();
  // 拡張子・Content-Type 偽装対策にバイナリ先頭を検証する。
  if (!validateImageBinarySignature(arrayBuffer, file.type)) {
    return reject("invalidType");
  }

  return { ok: true, buffer: Buffer.from(arrayBuffer) };
}

function reject(error: string): ReadUploadedImageResult {
  return { ok: false, response: jsonPrivate({ error }, { status: 400 }) };
}
