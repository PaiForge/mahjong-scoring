import type { User } from "@supabase/supabase-js";
import type { SupabaseServerClient } from "./supabase/server";
import { NextResponse } from "next/server";

import { getClientIp } from "./client-ip";
import {
  IP_RATE_LIMITS,
  checkIpRateLimitGuard,
  type IpRateLimitConfig,
} from "./rate-limit-ip";
import { createClient } from "./supabase/server";

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
 * const auth = await authorizeApiRequest("deleteAccount");
 * if (!auth.ok) return auth.response;
 * const { user, supabase } = auth;
 *
 * @param rateLimitKey - レートリミットのアクションキー（`IP_RATE_LIMITS` のキー）
 * @param config - レートリミット設定（省略時は `IP_RATE_LIMITS[rateLimitKey]`）
 */
export async function authorizeApiRequest(
  rateLimitKey: keyof typeof IP_RATE_LIMITS,
  config: Readonly<IpRateLimitConfig> = IP_RATE_LIMITS[rateLimitKey],
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
