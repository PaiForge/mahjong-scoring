import { z } from "zod";

import type { MobileUsernameErrorCode } from "@mahjong-scoring/features/account/mobile-api";

import { authorizeMobileRequest } from "@/lib/mobile-api/auth";
import { mobileJson, mobilePreflight } from "@/lib/mobile-api/response";
import { registerUsernameForUser } from "@/lib/users/register-username";

/** 要求の形。長さの上限は検証側が持つので、ここでは型だけを見る */
const bodySchema = z.object({
  username: z.string().max(200),
  displayName: z.string().max(200).optional(),
});

/**
 * ユーザー名を決めてプロフィールを作る（アプリ向け）
 * ユーザー名登録API（アプリ向け）
 *
 * web の setup-username と同じ本体（`registerUsernameForUser`）を呼ぶ。
 * プロフィール未作成のユーザーが呼ぶので、認証はプロフィールの有無を問わない。
 * 入力の誤りは 422 で理由を返す。
 */
export async function POST(request: Request) {
  const auth = await authorizeMobileRequest(request, "username");
  if (!auth.ok) return auth.response;

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return mobileJson({ error: "invalidRequest" }, { status: 400 });
  }

  const result = await registerUsernameForUser(
    auth.user.id,
    body.data.username,
    body.data.displayName,
  );
  if ("error" in result) {
    return mobileJson<{ error: MobileUsernameErrorCode }>(
      { error: result.error },
      { status: 422 },
    );
  }
  return mobileJson({ success: true });
}

export const OPTIONS = mobilePreflight;
