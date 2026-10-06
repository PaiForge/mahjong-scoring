import type { NextResponse } from "next/server";

import { jsonPrivate } from "./api-response";

import { authenticateAndCheckBan, type AuthUser } from "./auth";
import { isValidOrigin } from "./csrf";
import { getClientIp } from "./client-ip";
import {
  IP_RATE_LIMITS,
  checkIpRateLimitGuard,
  type IpRateLimitConfig,
} from "./rate-limit-ip";

type AuthorizeResult =
  | { readonly ok: true; readonly user: AuthUser }
  | { readonly ok: false; readonly response: NextResponse };

/**
 * API ルート共通の「CSRF + IP レートリミット + 認証ユーザー取得」前処理。
 * API認証前処理
 *
 * Origin 不一致は 403、レートリミット超過は 429、未認証は 401、BAN 済みは 403 の
 * `NextResponse` を `{ ok: false, response }` として返す。
 * 成功時は `{ ok: true, user }`。
 *
 * Origin 検証を最初に置くのは、Server Action と違い Route Handler には
 * CSRF 防御が無いため（{@link isValidOrigin}）。他サイトのフォームから
 * 認証 cookie 込みで叩かれる経路をここで塞ぐ。
 *
 * BAN チェックはページガードと同じ方針。Route Handler は画面を経由せず
 * 直接叩けるため、ここでも弾く。認証と BAN の判定は Server Action と同じ
 * {@link authenticateAndCheckBan} に任せる — `getOptionalVerifiedUser` の
 * `cache()` を共有するので、続けて `requireAdmin()` 等を呼んでも認証サーバーへの
 * 問い合わせは 1 回で済む。
 *
 * @example
 * const auth = await authorizeApiRequest(request, "deleteAccount");
 * if (!auth.ok) return auth.response;
 * const { user } = auth;
 *
 * @param request - 検証対象のリクエスト（Origin ヘッダを見る）
 * @param rateLimitKey - レートリミットのアクションキー（`IP_RATE_LIMITS` のキー）
 * @param config - レートリミット設定（省略時は `IP_RATE_LIMITS[rateLimitKey]`）
 */
export async function authorizeApiRequest(
  request: Request,
  rateLimitKey: keyof typeof IP_RATE_LIMITS,
  config: Readonly<IpRateLimitConfig> = IP_RATE_LIMITS[rateLimitKey],
): Promise<AuthorizeResult> {
  if (!isValidOrigin(request)) {
    return {
      ok: false,
      response: jsonPrivate({ error: "forbidden" }, { status: 403 }),
    };
  }

  const ipRateLimited = checkIpRateLimitGuard(
    await getClientIp(),
    rateLimitKey,
    config,
  );
  if (ipRateLimited) {
    return {
      ok: false,
      response: jsonPrivate({ error: "rateLimited" }, { status: 429 }),
    };
  }

  const gate = await authenticateAndCheckBan();
  if ("error" in gate) {
    return {
      ok: false,
      response: jsonPrivate(
        { error: gate.error },
        { status: gate.error === "unauthorized" ? 401 : 403 },
      ),
    };
  }

  return { ok: true, user: gate.user };
}
