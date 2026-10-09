import type { NextResponse } from "next/server";
import type { z } from "zod";

import { mobileJson } from "./response";

/**
 * アプリ向け API の要求本文を JSON として読む。上限を超えた・JSON でなければ undefined
 * アプリAPI本文読み取り
 *
 * 本文はクライアントが自由に決められるので、読む前に大きさを絞る。
 * `Content-Length` は嘘をつけるため、読んだ実際の長さで判定する。
 *
 * @param maxBytes - 受け付ける本文の上限（UTF-8 のバイト数）
 */
export async function readMobileJson(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return undefined;
  const text = await request.text().catch(() => undefined);
  if (text === undefined || new TextEncoder().encode(text).length > maxBytes)
    return undefined;
  try {
    const body: unknown = JSON.parse(text);
    return body;
  } catch {
    return undefined;
  }
}

/** {@link parseMobileBody} の結果。失敗時はそのまま返せる 400 の応答を持つ */
export type MobileBodyResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly response: NextResponse };

/**
 * アプリ向け API の要求本文を読み、スキーマで検証する。通らなければ 400 `invalidRequest`
 * アプリAPI本文検証
 *
 * 上限超過・JSON でない・空の本文は {@link readMobileJson} が undefined にするので、
 * 本文を省略できる API はスキーマの側で undefined を受ける（`z.preprocess` 等）。
 *
 * @param maxBytes - 受け付ける本文の上限（UTF-8 のバイト数）
 */
export async function parseMobileBody<T>(
  request: Request,
  schema: z.ZodType<T>,
  maxBytes: number,
): Promise<MobileBodyResult<T>> {
  const body = schema.safeParse(await readMobileJson(request, maxBytes));
  if (body.success) return { ok: true, data: body.data };
  return {
    ok: false,
    response: mobileJson({ error: "invalidRequest" }, { status: 400 }),
  };
}
