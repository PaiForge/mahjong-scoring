import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getClientIp } from "./client-ip";
import { checkIpRateLimitGuard, type IpRateLimitConfig } from "./rate-limit-ip";
import { createClient } from "./supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type AuthorizeResult =
  | {
      readonly ok: true;
      readonly user: User;
      readonly supabase: SupabaseServerClient;
    }
  | { readonly ok: false; readonly response: NextResponse };

/**
 * API ルート共通の「IP レートリミット + 認証ユーザー取得」前処理。
 * API認証前処理
 *
 * レートリミット超過時は 429、未認証時は 401 の `NextResponse` を
 * `{ ok: false, response }` として返す。成功時は `{ ok: true, user, supabase }`。
 *
 * @example
 * const auth = await authorizeApiRequest("deleteAccount", IP_RATE_LIMITS.deleteAccount);
 * if (!auth.ok) return auth.response;
 * const { user, supabase } = auth;
 *
 * @param rateLimitKey - レートリミットのアクションキー
 * @param config - レートリミット設定
 */
export async function authorizeApiRequest(
  rateLimitKey: string,
  config: Readonly<IpRateLimitConfig>,
): Promise<AuthorizeResult> {
  const ipRateLimited = checkIpRateLimitGuard(
    await getClientIp(),
    rateLimitKey,
    config,
  );
  if (ipRateLimited) {
    return {
      ok: false,
      response: NextResponse.json({ error: "rateLimited" }, { status: 429 }),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, user, supabase };
}
