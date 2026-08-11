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
  await supabase.auth.getClaims();

  return supabaseResponse;
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
