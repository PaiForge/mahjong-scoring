import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { readSupabasePublicEnv } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 環境変数が無い環境ではセッション更新を行わない（従来どおり黙ってスキップ）
  const env = readSupabasePublicEnv();
  if (!env) {
    return supabaseResponse;
  }

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh the session - important for Server Components.
  // getClaims() は非対称署名キー構成では JWT をローカル検証するため、
  // getUser() のような認証サーバーへのネットワーク往復が不要になり、
  // 全ナビゲーションに乗っていた固定遅延を削減できる。
  // 期限切れ時はセッションリフレッシュにフォールバックし、Cookie 更新も維持される。
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);

  // トップの LP / ダッシュボード分岐はページ内ではなくここ（ルーティング層）で行う。
  // ページ内で cookie を読むと「/」全体が動的になり、cookie を読めない 1 枚の
  // loading.tsx で形の違う 2 ページを受けることになる（スケルトンが必ずずれる）。
  // 「/」を cookie を読まない静的な LP に保ち、ログイン済みだけを /dashboard の
  // 実体へ rewrite する（アドレスバーは「/」のまま）。認証状態の切り替わりは
  // auth-context が router.refresh() を呼ぶため、古い方のキャッシュは残らない。
  const { pathname } = request.nextUrl;
  if (isAuthenticated && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return withResponseCookies(
      NextResponse.rewrite(url, { request }),
      supabaseResponse,
    );
  }
  // 未ログインの /dashboard 直アクセスは LP へ。ページ側の redirect() に任せると
  // 祖先の loading.tsx がヘッダを確定させてしまうため、HTTP レベルで返す
  if (!isAuthenticated && pathname === "/dashboard") {
    return withResponseCookies(
      NextResponse.redirect(new URL("/", request.url)),
      supabaseResponse,
    );
  }

  return supabaseResponse;
}

/**
 * セッションリフレッシュで積まれた Set-Cookie を rewrite / redirect 応答へ引き継ぐ。
 * これを忘れるとリフレッシュ済みトークンが破棄され、次のリクエストで再度
 * リフレッシュが走る。
 */
function withResponseCookies(
  response: NextResponse,
  source: NextResponse,
): NextResponse {
  for (const cookie of source.cookies.getAll()) {
    response.cookies.set(cookie);
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
