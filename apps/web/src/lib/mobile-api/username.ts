import "server-only";

import type { NextResponse } from "next/server";
import { z } from "zod";

import type { MobileUsernameErrorCode } from "@mahjong-scoring/features/account/mobile-api";

import { registerUsernameForUser } from "../users/register-username";

import { authorizeMobileRequest } from "./auth";
import { readMobileJson } from "./request";
import { mobileJson } from "./response";

/** 要求の 1 項目の長さの上限。本当の上限は検証側が持つので、ここでは型と桁だけを見る */
const FIELD_MAX_LENGTH = 200;

/**
 * 本文の上限。{@link bodySchema} を通る本文がすべて収まる大きさにする
 * （本文の上限で、要求の形より先に何かを弾かない）。
 *
 * 1 項目は最長 200（UTF-16 の単位）で、JSON の文字列では 1 単位が最悪
 * 6 バイト（制御文字の `\uXXXX`。それ以外は UTF-8 で 3 バイトまで、
 * サロゲートの組は 2 単位で 4 バイト）になる。2 項目で 2400 バイト、
 * キーと括弧を足しても 4 KiB に収まる。
 */
const BODY_MAX_BYTES = 4 * 1024;

const bodySchema = z.object({
  username: z.string().max(FIELD_MAX_LENGTH),
  displayName: z.string().max(FIELD_MAX_LENGTH).optional(),
});

/**
 * ユーザー名を決めてプロフィールを作る（アプリ向け）
 * ユーザー名登録API（アプリ向け）
 *
 * web の setup-username と同じ本体（`registerUsernameForUser`）を呼ぶ。
 * プロフィール未作成のユーザーが呼ぶので、認証はプロフィールの有無を問わない。
 * 入力の誤りは 422 で理由を返す。
 */
export async function handleRegisterUsername(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "username");
  if (!auth.ok) return auth.response;
  const body = bodySchema.safeParse(
    await readMobileJson(request, BODY_MAX_BYTES),
  );
  if (!body.success)
    return mobileJson({ error: "invalidRequest" }, { status: 400 });

  const result = await registerUsernameForUser(
    auth.user.id,
    body.data.username,
    body.data.displayName,
  );
  if (!("error" in result)) return mobileJson({ success: true });
  // 認証を通った後に退会が受け付けられた（入口で弾いたときと同じ答え）
  if (result.error === "unauthorized")
    return mobileJson({ error: "deleted" }, { status: 403 });
  return mobileJson<{ error: MobileUsernameErrorCode }>(
    { error: result.error },
    { status: 422 },
  );
}
