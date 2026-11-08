// @vitest-environment node
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { isNonLocalizedPath } from "@/i18n/public-path";
import { GLOSSARY_TERM_SLUGS } from "@mahjong-scoring/features/glossary/registry";

interface CookieToSet {
  readonly name: string;
  readonly value: string;
  readonly options: Record<string, unknown>;
}

const supabase = vi.hoisted(() => ({
  env: { url: "http://127.0.0.1:54321", publishableKey: "test-key" } as
    { url: string; publishableKey: string } | undefined,
  authenticated: false,
  cookiesToSet: [] as CookieToSet[],
  cacheHeaders: {} as Record<string, string>,
  getClaims: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  readSupabasePublicEnv: () => supabase.env,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: {
      cookies: {
        setAll: (
          cookies: CookieToSet[],
          headers: Record<string, string>,
        ) => void;
      };
    },
  ) => ({
    auth: {
      getClaims: async () => {
        supabase.getClaims();
        if (supabase.cookiesToSet.length > 0) {
          options.cookies.setAll(supabase.cookiesToSet, supabase.cacheHeaders);
        }
        return {
          data: supabase.authenticated ? { claims: { sub: "user-1" } } : null,
        };
      },
    },
  }),
}));

import { config, proxy } from "./proxy";

/** 手元の同一 origin（`127.0.0.1` だと内部 rewrite が別ホスト扱いになるため localhost） */
const ORIGIN = "http://localhost:3000";

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), "../public");

function makeRequest(
  path: string,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(`${ORIGIN}${path}`, { headers });
}

/** 応答が後段へ渡すリクエストヘッダ（next-intl・cookie 更新の書き換え結果） */
function forwardedRequestHeader(
  response: Response,
  name: string,
): string | null {
  return response.headers.get(`x-middleware-request-${name}`);
}

function rewriteTarget(response: Response): string | null {
  return response.headers.get("x-middleware-rewrite");
}

beforeEach(() => {
  supabase.env = { url: "http://127.0.0.1:54321", publishableKey: "test-key" };
  supabase.authenticated = false;
  supabase.cookiesToSet = [];
  supabase.cacheHeaders = {};
  supabase.getClaims.mockClear();
});

describe("日本語の用語集の未知 slug は rewrite 前に 404 にする", () => {
  it("符号化された固定セグメントでも未知の語を 404 にする", async () => {
    const response = await proxy(
      makeRequest("/reference/%67lossary/review-unknown-term"),
    );
    expect(response.status).toBe(404);
    expect(rewriteTarget(response)).toBeNull();
  });

  it.each(["__audit_unknown__", "review-unknown-term", "%E0%A4%A"])(
    "%s は noindex の 404（Next の NoFallbackError に到達しない）",
    async (slug) => {
      const response = await proxy(makeRequest(`/reference/glossary/${slug}`));
      expect(response.status).toBe(404);
      expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
      expect(rewriteTarget(response)).toBeNull();
      expect(await response.text()).toContain('<html lang="ja">');
    },
  );

  it.each([...GLOSSARY_TERM_SLUGS, "%6danzu"])(
    "実在する %s は静的ページへの rewrite を維持する",
    async (slug) => {
      const response = await proxy(makeRequest(`/reference/glossary/${slug}`));
      expect(response.status).toBe(200);
      expect(rewriteTarget(response)).toContain("/ja/reference/glossary/");
      expect(response.headers.get("location")).toBeNull();
    },
  );
});

describe("日本語 URL は接頭辞なしのまま内部の /ja へ rewrite する", () => {
  it.each([
    ["/", `${ORIGIN}/ja`],
    ["/practice", `${ORIGIN}/ja/practice`],
    [
      "/practice/jantou-fu/play?variant=all",
      `${ORIGIN}/ja/practice/jantou-fu/play?variant=all`,
    ],
    ["/reference/score-table", `${ORIGIN}/ja/reference/score-table`],
    // /en の部分一致で英語と誤認しない
    ["/english", `${ORIGIN}/ja/english`],
    ["/u/alice", `${ORIGIN}/ja/u/alice`],
  ])("%s → %s", async (path, target) => {
    const response = await proxy(makeRequest(path));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(rewriteTarget(response)).toBe(target);
    expect(forwardedRequestHeader(response, "x-next-intl-locale")).toBe("ja");
  });
});

describe("言語は URL だけで決める（Accept-Language・cookie で転送しない）", () => {
  const englishBrowser = {
    "accept-language": "en-US,en;q=0.9",
    cookie: "NEXT_LOCALE=en",
  };
  const japaneseBrowser = {
    "accept-language": "ja,en;q=0.5",
    cookie: "NEXT_LOCALE=ja",
  };

  it("英語のブラウザで日本語 URL を開いても日本語のまま（Location なし）", async () => {
    const response = await proxy(makeRequest("/", englishBrowser));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(rewriteTarget(response)).toBe(`${ORIGIN}/ja`);
    expect(forwardedRequestHeader(response, "x-next-intl-locale")).toBe("ja");
  });

  it("日本語のブラウザで英語 URL を開いても英語のまま（Location なし）", async () => {
    const response = await proxy(
      makeRequest("/en/reference/score-table", japaneseBrowser),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    // 外部と内部の URL が同じなので rewrite は要らない
    expect(rewriteTarget(response)).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(forwardedRequestHeader(response, "x-next-intl-locale")).toBe("en");
  });

  it("NEXT_LOCALE cookie を書かず、自動の hreflang の Link ヘッダも付けない", async () => {
    for (const path of ["/", "/en/reference/score-table"]) {
      const response = await proxy(makeRequest(path, englishBrowser));
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(response.headers.get("link")).toBeNull();
    }
  });
});

describe("英語で公開したページは英語のまま通す", () => {
  it.each([
    ["/en"],
    ["/en/lessons"],
    ["/en/lessons/jantou-fu"],
    ["/en/reference"],
    ["/en/reference/yaku"],
    ["/en/reference/glossary"],
    ["/en/reference/glossary/jantou"],
    ["/en/reference/glossary/menzen-ron-kafu"],
    ["/en/lessons/about-this-app"],
    ["/en/practice"],
    ["/en/practice/jantou-fu"],
    ["/en/practice/jantou-fu/play"],
    ["/en/practice/jantou-fu/result"],
    ["/en/practice/agari-score/play"],
    ["/en/exam/mangan"],
    ["/en/exam/mangan/training"],
    ["/en/getting-started"],
    ["/en/try/mentsu-fu"],
    ["/en/reference/demo"],
    ["/en/dojo"],
    ["/en/dojo/ranks/kyu-5"],
    ["/en/sign-in"],
    ["/en/sign-up"],
    ["/en/mypage"],
    ["/en/mypage/challenges/results"],
    ["/en/preferences"],
    ["/en/terms"],
    ["/en/contact"],
    ["/en/contact/success"],
    ["/en/plan"],
    ["/en/announcements"],
    // お知らせの詳細は DB 由来で形を問わず通し、英語の行が無い slug はページが 404 にする
    ["/en/announcements/some-news"],
  ])("%s", async (path) => {
    const response = await proxy(makeRequest(path));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    // 外部と内部の URL が同じなので rewrite は要らない
    expect(rewriteTarget(response)).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(forwardedRequestHeader(response, "x-next-intl-locale")).toBe("en");
  });

  it("英語の用語は形（英小文字で始まる英数字とハイフン）だけで通し、未知の語の 404 はページの dynamicParams = false に任せる", async () => {
    // 許可リストは用語のページをテンプレートで持ち、proxy はレジストリを引かない。
    // 英語の URL は内部の /ja へ rewrite しないので、日本語で起きる
    // NoFallbackError（500）の経路に乗らず、ページが 404 + noindex を返す
    // （scripts/seo-audit/http.ts の EDGE_CASES が実応答で確かめる）
    const response = await proxy(
      makeRequest("/en/reference/glossary/unknown-term"),
    );
    expect(response.status).toBe(200);
    expect(rewriteTarget(response)).toBeNull();
    expect(forwardedRequestHeader(response, "x-next-intl-locale")).toBe("en");
  });
});

describe("未公開の英語 URL は 404 + noindex", () => {
  it.each([
    ["/en/leaderboard"],
    ["/en/leaderboard/monthly/jantou-fu"],
    ["/en/u/alice"],
    ["/en/u/bob"],
    ["/en/announcements/some-news/extra"],
    ["/en/mypage/unknown"],
    ["/en/dojo/ranks"],
    // 段級位の slug の形に合わない（形に合う未知の段級位はページが 404 にする）
    ["/en/dojo/ranks/__unknown__"],
    ["/en/practice/jantou-fu/extra"],
    ["/en/reference/glossary/__unknown__"],
    ["/en/reference/glossary/jantou/extra"],
    ["/en/admin"],
    ["/en/admin/users"],
    ["/en/api/version"],
    ["/en/auth/callback"],
    ["/en/robots.txt"],
    ["/en/reference/score-table/extra"],
    ["/EN/leaderboard"],
  ])("%s", async (path) => {
    const response = await proxy(makeRequest(path));
    expect(response.status).toBe(404);
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
    expect(await response.text()).toContain('content="noindex"');
    expect(response.headers.get("location")).toBeNull();
    expect(rewriteTarget(response)).toBeNull();
  });

  it("未公開の判定はセッション更新より前（404 に Set-Cookie を載せない）", async () => {
    supabase.cookiesToSet = [{ name: "sb", value: "x", options: {} }];
    const response = await proxy(makeRequest("/en/leaderboard"));
    expect(supabase.getClaims).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

describe("外部の /ja は実在する日本語 URL への正規化だけ", () => {
  it.each([
    ["/ja", `${ORIGIN}/`],
    ["/ja/practice", `${ORIGIN}/practice`],
    ["/ja/practice?variant=all", `${ORIGIN}/practice?variant=all`],
    ["/ja/dashboard", `${ORIGIN}/dashboard`],
  ])("%s → %s へリダイレクト", async (path, location) => {
    const response = await proxy(makeRequest(path));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(location);
  });

  it.each([["/ja/nonexistent"], ["/ja/admin"], ["/ja/api/version"]])(
    "接頭辞なしの日本語ページが無い %s は 404",
    async (path) => {
      const response = await proxy(makeRequest(path));
      expect(response.status).toBe(404);
      expect(response.headers.get("location")).toBeNull();
    },
  );

  it("大文字の /EN は小文字の正規形へリダイレクトする", async () => {
    const response = await proxy(makeRequest("/EN/reference/score-table"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/en/reference/score-table`,
    );
  });
});

describe("認証によるトップの出し分け", () => {
  it("ログイン済みの / は内部の /ja/dashboard へ rewrite（アドレスバーは / のまま・共有キャッシュさせない）", async () => {
    supabase.authenticated = true;
    const response = await proxy(makeRequest("/"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(rewriteTarget(response)).toBe(`${ORIGIN}/ja/dashboard`);
    expect(forwardedRequestHeader(response, "x-next-intl-locale")).toBe("ja");
    expect(response.headers.get("cache-control")).toContain("private");
  });

  it("ログイン済みの / の query は rewrite 先に引き継ぐ", async () => {
    supabase.authenticated = true;
    const response = await proxy(makeRequest("/?from=mail"));
    expect(rewriteTarget(response)).toBe(`${ORIGIN}/ja/dashboard?from=mail`);
  });

  it("ログイン済みの /en は /en/dashboard へ rewrite（アドレスバーは /en のまま・共有キャッシュさせない・ロケールのヘッダが en）", async () => {
    supabase.authenticated = true;
    const response = await proxy(makeRequest("/en"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(rewriteTarget(response)).toBe(`${ORIGIN}/en/dashboard`);
    expect(response.headers.get("x-middleware-next")).toBeNull();
    expect(forwardedRequestHeader(response, "x-next-intl-locale")).toBe("en");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("ログイン済みの /en の query は rewrite 先に引き継ぐ", async () => {
    supabase.authenticated = true;
    const response = await proxy(makeRequest("/en?from=mail"));
    expect(rewriteTarget(response)).toBe(`${ORIGIN}/en/dashboard?from=mail`);
  });

  it("英語の dashboard への rewrite は、next-intl が組む日本語の rewrite と同じ形のヘッダを後段へ渡す", async () => {
    supabase.authenticated = true;
    const headers = { cookie: "sb-access-token=t; other=1", "x-custom": "v" };
    const ja = await proxy(makeRequest("/", headers));
    const en = await proxy(makeRequest("/en", headers));
    const responseHeaderNames = (response: Response): string[] =>
      [...response.headers.keys()].sort();
    // 応答のヘッダの名前の集合が同じ（x-middleware-override-headers・
    // x-middleware-request-* の展開・x-middleware-rewrite・cache-control）
    expect(responseHeaderNames(en)).toEqual(responseHeaderNames(ja));
    expect(en.headers.get("x-middleware-override-headers")).toBe(
      ja.headers.get("x-middleware-override-headers"),
    );
    for (const name of ["cookie", "x-custom"]) {
      expect(forwardedRequestHeader(en, name), name).toBe(
        forwardedRequestHeader(ja, name),
      );
    }
    expect(forwardedRequestHeader(ja, "x-next-intl-locale")).toBe("ja");
    expect(forwardedRequestHeader(en, "x-next-intl-locale")).toBe("en");
  });

  it("未ログインの /en は英語の LP（rewrite せず Cache-Control を付けない）", async () => {
    const response = await proxy(makeRequest("/en"));
    expect(response.status).toBe(200);
    expect(rewriteTarget(response)).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(forwardedRequestHeader(response, "x-next-intl-locale")).toBe("en");
    expect(response.headers.get("cache-control")).toBeNull();
  });

  it("未ログインの /en/dashboard は英語の LP へ HTTP リダイレクト", async () => {
    const response = await proxy(makeRequest("/en/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/en`);
  });

  it("ログイン済みの /en/dashboard はそのまま通す（外部と内部の URL が同じ）", async () => {
    supabase.authenticated = true;
    const response = await proxy(makeRequest("/en/dashboard"));
    expect(response.status).toBe(200);
    expect(rewriteTarget(response)).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(forwardedRequestHeader(response, "x-next-intl-locale")).toBe("en");
  });

  it("未ログインの / は LP（Cache-Control を付けない）", async () => {
    const response = await proxy(makeRequest("/"));
    expect(rewriteTarget(response)).toBe(`${ORIGIN}/ja`);
    expect(response.headers.get("cache-control")).toBeNull();
  });

  it("未ログインの /dashboard は LP へ HTTP リダイレクト", async () => {
    const response = await proxy(makeRequest("/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/`);
  });

  it("ログイン済みの /dashboard はそのまま内部の /ja/dashboard", async () => {
    supabase.authenticated = true;
    const response = await proxy(makeRequest("/dashboard"));
    expect(rewriteTarget(response)).toBe(`${ORIGIN}/ja/dashboard`);
  });
});

describe("セッション更新の cookie と i18n の合成", () => {
  const refreshed: CookieToSet[] = [
    {
      name: "sb-access-token",
      value: "new-token",
      options: {
        path: "/",
        maxAge: 3600,
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      },
    },
  ];
  const cacheHeaders = {
    "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
    Expires: "0",
    Pragma: "no-cache",
  };

  beforeEach(() => {
    supabase.cookiesToSet = refreshed;
    supabase.cacheHeaders = cacheHeaders;
  });

  it.each([
    ["/practice", `${ORIGIN}/ja/practice`, false, "ja"],
    ["/", `${ORIGIN}/ja/dashboard`, true, "ja"],
    ["/en", `${ORIGIN}/en/dashboard`, true, "en"],
  ])(
    "%s: rewrite とロケールのヘッダを保ったまま、新しい cookie を後段と応答の両方へ渡す",
    async (path, target, authenticated, locale) => {
      supabase.authenticated = authenticated;
      const response = await proxy(
        makeRequest(path, { cookie: "sb-access-token=old-token; other=1" }),
      );

      expect(rewriteTarget(response)).toBe(target);
      expect(forwardedRequestHeader(response, "x-next-intl-locale")).toBe(
        locale,
      );
      // 後段（サーバーコンポーネント）が読む cookie は更新後の値
      const forwardedCookie = forwardedRequestHeader(response, "cookie") ?? "";
      expect(forwardedCookie).toContain("sb-access-token=new-token");
      expect(forwardedCookie).not.toContain("old-token");
      expect(forwardedCookie).toContain("other=1");
      // 応答の Set-Cookie は属性ごと
      const setCookie = response.headers.get("set-cookie") ?? "";
      expect(setCookie).toContain("sb-access-token=new-token");
      expect(setCookie).toContain("Max-Age=3600");
      expect(setCookie).toContain("Path=/");
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("Secure");
      expect(setCookie.toLowerCase()).toContain("samesite=lax");
      // cookie を書いた応答はキャッシュさせない
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(response.headers.get("pragma")).toBe("no-cache");
    },
  );

  it("リダイレクトにも Set-Cookie を載せる", async () => {
    const response = await proxy(makeRequest("/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("set-cookie")).toContain(
      "sb-access-token=new-token",
    );
  });

  it("英語の公開ページでもロケールのヘッダと cookie の両方が残る", async () => {
    const response = await proxy(makeRequest("/en/reference/score-table"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(forwardedRequestHeader(response, "x-next-intl-locale")).toBe("en");
    expect(forwardedRequestHeader(response, "cookie")).toContain(
      "sb-access-token=new-token",
    );
    expect(response.headers.get("set-cookie")).toContain(
      "sb-access-token=new-token",
    );
  });
});

describe("Supabase の環境変数が無くても i18n は通す", () => {
  beforeEach(() => {
    supabase.env = undefined;
  });

  it.each([
    ["/practice", `${ORIGIN}/ja/practice`, "ja"],
    ["/", `${ORIGIN}/ja`, "ja"],
  ])("%s → %s", async (path, target, locale) => {
    const response = await proxy(makeRequest(path));
    expect(rewriteTarget(response)).toBe(target);
    expect(forwardedRequestHeader(response, "x-next-intl-locale")).toBe(locale);
    expect(supabase.getClaims).not.toHaveBeenCalled();
  });

  it("英語の公開ページもロケールが付く", async () => {
    const response = await proxy(makeRequest("/en/reference/score-table"));
    expect(forwardedRequestHeader(response, "x-next-intl-locale")).toBe("en");
  });

  it("未公開の英語は 404 のまま", async () => {
    const response = await proxy(makeRequest("/en/leaderboard"));
    expect(response.status).toBe(404);
  });
});

describe("ロケール化しないパスはセッション更新だけで通す", () => {
  it.each([
    ["/admin"],
    ["/admin/users/123"],
    ["/auth/callback?code=abc"],
    ["/robots.txt"],
    ["/sitemap.xml"],
    ["/google9cbea86c89b56a83.html"],
  ])("%s", async (path) => {
    supabase.cookiesToSet = [
      { name: "sb-access-token", value: "new", options: { path: "/" } },
    ];
    const response = await proxy(makeRequest(path));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(rewriteTarget(response)).toBeNull();
    expect(response.headers.get("location")).toBeNull();
    expect(forwardedRequestHeader(response, "x-next-intl-locale")).toBeNull();
    // 管理画面のセッション更新は従来どおり
    expect(supabase.getClaims).toHaveBeenCalledTimes(1);
    expect(response.headers.get("set-cookie")).toContain("sb-access-token=new");
  });
});

describe("matcher", () => {
  const matcherRegex = new RegExp(`^${config.matcher[0]}$`);

  it.each([
    ["/", true],
    ["/en/reference/score-table", true],
    ["/admin", true],
    ["/auth/callback", true],
    ["/u/alice", true],
    ["/api/version", false],
    ["/_next/static/chunk.js", false],
    ["/tiles/Man1.webp", false],
    ["/og-image.png", false],
  ])("%s → %s", (path, matched) => {
    expect(matcherRegex.test(path)).toBe(matched);
  });

  it("public/ の実ファイルはすべて、matcher が除外するか i18n の対象外になる", () => {
    const unhandled = readdirSync(PUBLIC_DIR, { withFileTypes: true })
      .map((entry) => `/${entry.name}`)
      .filter((path) => matcherRegex.test(path) && !isNonLocalizedPath(path));
    expect(
      unhandled,
      "public/ に足したファイルを i18n/public-path.ts の PUBLIC_ASSET_PATHS / PUBLIC_ASSET_DIRECTORIES に足すこと",
    ).toEqual([]);
  });
});
