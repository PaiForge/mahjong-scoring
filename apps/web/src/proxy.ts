import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";

import { readSupabasePublicEnv } from "@/lib/supabase/env";
import {
  isNonLocalizedPath,
  localizedHref,
  parseExternalPath,
  type ExternalPath,
} from "@/i18n/public-path";
import { getPublication } from "@/i18n/route-policy";
import { routing } from "@/i18n/routing";

import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/**
 * リクエストごとのルーティング層（Next.js 16 の Proxy）
 *
 * 1 本の処理で、次を順に合成する:
 *
 * 1. **i18n の対象外**（API・認証コールバック・管理画面・metadata routes・
 *    `public/` の実ファイル。`isNonLocalizedPath`）はセッション更新だけして
 *    そのまま通す。管理画面のセッション更新は従来どおり
 * 2. 外部 URL のパスからロケールとロケール非依存のパスを決める。
 *    `Accept-Language` と cookie は見ない（言語は URL だけで決める）
 * 3. **未公開の英語 URL は 404 + noindex**（`/en/admin`・`/en/api/...`・
 *    `/en/auth/callback` を含む）。外部から来た `/ja/...` は、接頭辞なしの
 *    日本語ページが実在するときだけ next-intl の正規化（接頭辞なしへの
 *    リダイレクト）に任せ、実在しなければ 404。既存の日本語 URL を `/ja` へ
 *    転送することはない
 * 4. Supabase のセッションを更新する。更新した cookie はリクエストの cookie に
 *    書き戻し（後段のサーバーコンポーネントが新しいトークンを読む）、
 *    応答の `Set-Cookie` にも全属性ごと載せる
 * 5. ログイン済みの `/` を内部の `/ja/dashboard` へ rewrite する（アドレスバーは
 *    `/` のまま）。未ログインの `/dashboard` 直アクセスは同じ言語の LP へ HTTP の
 *    リダイレクト。英語は `/en` も dashboard も未公開なので対象にならない
 * 6. next-intl の middleware を最後に 1 回だけ呼び、その応答（内部 rewrite と
 *    ロケールのリクエストヘッダ）をそのまま返す。セッション更新の cookie と
 *    ヘッダはその応答に足す。cookie 更新用に別の `NextResponse.next()` を作って
 *    i18n の応答を捨てると、rewrite とロケールのヘッダが消える。
 *    Supabase の環境変数が無い環境でも 6 は必ず通す
 *
 * 認証済みの HTML（dashboard への rewrite）と、セッションの cookie を書いた
 * 応答は共有キャッシュさせない。未ログインで認証 cookie の無い LP は従来どおり
 * 静的な内容のまま。User-Agent による出し分けはしない。
 */

const handleI18nRouting = createMiddleware(routing);

/** ログイン済みトップの実体（外部 URL は「/」のまま、内部 rewrite で出す） */
const DASHBOARD_PATH = "/dashboard";

/** セッション更新で応答へ載せる cookie（`@supabase/ssr` の `setAll` が渡すもの） */
interface CookieToSet {
  readonly name: string;
  readonly value: string;
  readonly options: CookieOptions;
}

/** セッション更新の結果 */
interface SessionRefresh {
  readonly isAuthenticated: boolean;
  /** 応答の Set-Cookie に載せる cookie（属性ごと） */
  readonly cookies: readonly CookieToSet[];
  /** 応答に載せるヘッダ（cookie を書いた応答をキャッシュさせない指定） */
  readonly headers: Readonly<Record<string, string>>;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isNonLocalizedPath(pathname)) {
    const session = await refreshSession(request);
    return withSession(NextResponse.next({ request }), session);
  }

  const external = parseExternalPath(pathname);
  if (shouldRespondNotFound(external)) {
    return notFoundResponse(external.locale);
  }

  const session = await refreshSession(request);

  if (external.canonical) {
    // トップの LP / ダッシュボード分岐はページ内ではなくここ（ルーティング層）で行う。
    // ページ内で cookie を読むと「/」全体が動的になり、cookie を読めない 1 枚の
    // loading.tsx で形の違う 2 ページを受けることになる（スケルトンが必ずずれる）。
    // 「/」を cookie を読まない静的な LP に保ち、ログイン済みだけを dashboard の
    // 実体へ rewrite する。認証状態の切り替わりは auth-context が
    // router.refresh() を呼ぶため、古い方のキャッシュは残らない。
    if (
      session.isAuthenticated &&
      external.path === "/" &&
      canRewriteToDashboard(external.locale)
    ) {
      const response = handleI18nRouting(
        requestWithPathname(
          request,
          localizedHref(DASHBOARD_PATH, external.locale),
        ),
      );
      response.headers.set("Cache-Control", "private, no-store");
      return withSession(response, session);
    }
    // 未ログインの dashboard 直アクセスは LP へ。ページ側の redirect() に任せると
    // 祖先の loading.tsx がヘッダを確定させてしまうため、HTTP レベルで返す
    if (!session.isAuthenticated && external.path === DASHBOARD_PATH) {
      return withSession(
        NextResponse.redirect(
          new URL(localizedHref("/", external.locale), request.url),
        ),
        session,
      );
    }
  }

  return withSession(handleI18nRouting(request), session);
}

/**
 * proxy が HTTP 404 を返すべき外部パスか
 *
 * - 英語（接頭辞の大文字小文字を問わない）で未公開のパス
 * - `/ja` 接頭辞付きで、接頭辞なしの日本語ページが実在しないパス
 *
 * 接頭辞の無い日本語のパスは判定しない（従来どおり Next のルーティングに
 * 任せる）。日本語の URL の集合を公開状態の表で変えないため。
 */
function shouldRespondNotFound(external: ExternalPath): boolean {
  if (external.prefix === undefined) return false;
  return getPublication(external.path, external.locale) === "unpublished";
}

/**
 * ログイン済みのトップを dashboard へ rewrite してよい言語か
 *
 * 日本語だけ。英語の dashboard を公開するとき（認証済みの `/en` を内部の
 * `/en/dashboard` へ rewrite する）は、next-intl が `/en/dashboard` を
 * 書き換え不要と判定して rewrite を出さないため、この合成のままでは動かない。
 * 英語を解禁するときに合成の方法を決め、テストを足す。
 */
function canRewriteToDashboard(locale: SupportedLocale): boolean {
  return (
    locale === DEFAULT_LOCALE &&
    getPublication(DASHBOARD_PATH, locale) !== "unpublished"
  );
}

/**
 * パスだけを差し替えたリクエストを作る（query・ヘッダ・cookie は引き継ぐ）
 *
 * next-intl に「この外部パスへ来た」として内部 URL を決めさせるために使う。
 * 元のリクエストのパスと内部 URL が異なるので、next-intl は rewrite を返す。
 */
function requestWithPathname(
  request: NextRequest,
  pathname: string,
): NextRequest {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return new NextRequest(url, {
    headers: request.headers,
    method: request.method,
  });
}

/**
 * Supabase のセッションを更新する
 *
 * 環境変数が無い環境では何もしない（未ログイン扱い。従来どおり黙ってスキップ）。
 * 更新した cookie は `request.cookies` に書き戻す。`request.cookies` は
 * リクエストの `cookie` ヘッダを書き換えるので、後で next-intl が組む
 * リクエストヘッダにも新しい値が入る。
 */
async function refreshSession(request: NextRequest): Promise<SessionRefresh> {
  const env = readSupabasePublicEnv();
  if (!env) {
    return { isAuthenticated: false, cookies: [], headers: {} };
  }

  let cookies: readonly CookieToSet[] = [];
  let headers: Readonly<Record<string, string>> = {};
  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        cookies = cookiesToSet;
        headers = cacheHeaders;
      },
    },
  });

  // Refresh the session - important for Server Components.
  // getClaims() は非対称署名キー構成では JWT をローカル検証するため、
  // getUser() のような認証サーバーへのネットワーク往復が不要になり、
  // 全ナビゲーションに乗っていた固定遅延を削減できる。
  // 期限切れ時はセッションリフレッシュにフォールバックし、Cookie 更新も維持される。
  const { data } = await supabase.auth.getClaims();
  return { isAuthenticated: Boolean(data?.claims), cookies, headers };
}

/**
 * セッション更新で積まれた Set-Cookie とヘッダを応答へ載せる
 *
 * これを忘れるとリフレッシュ済みトークンが破棄され、次のリクエストで再度
 * リフレッシュが走る。ヘッダは `@supabase/ssr` が cookie を書いたときに渡す
 * キャッシュ禁止の指定（別の利用者へトークンを配らないため）。
 */
function withSession(
  response: NextResponse,
  session: SessionRefresh,
): NextResponse {
  for (const { name, value, options } of session.cookies) {
    response.cookies.set(name, value, options);
  }
  for (const [key, value] of Object.entries(session.headers)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * 未公開のロケール付き URL に返す汎用の 404
 *
 * ページを描かずに HTTP で返す（ページの `notFound()` は祖先の `loading.tsx` が
 * ヘッダを確定させた後だと 200 になり得る）。索引させないよう `X-Robots-Tag` と
 * meta robots の両方で noindex を示す。
 */
function notFoundResponse(locale: SupportedLocale): NextResponse {
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width, initial-scale=1"><title>404 Not Found</title></head><body><h1>404 Not Found</h1></body></html>`;
  return new NextResponse(html, {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (Route Handler は自分で認証する。Stripe の Webhook のような
     *   外部からの POST にセッション更新を走らせる理由がなく、/ と /dashboard の
     *   書き換えにも関係しない)
     * - public files (images, etc.)
     *
     * matcher に掛かるがロケール化しないパス（/auth/callback・/admin・
     * robots.txt 等）は proxy の中で isNonLocalizedPath が振り分ける。
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
