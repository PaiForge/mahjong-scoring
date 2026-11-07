/**
 * 起動したサーバーの HTTP 応答の SEO 監査（移行前の台帳との比較）
 * SEO HTTP 監査
 *
 * 使い方（`apps/web` で `next build` → `next start -H localhost -p 3198` の後）:
 *
 * ```sh
 * pnpm --filter @mahjong-scoring/web exec tsx scripts/seo-audit/http.ts \
 *   --origin http://localhost:3198 --baseline <dir>
 * ```
 *
 * `--out <file>` を付けると、全件の明細を JSON で書き出す（標準出力は 1 検査 40 件で切る）。
 *
 * build の成果物では見えない振る舞い — proxy の 404・リダイレクト・言語の判定・
 * cookie とキャッシュ・動的ページ — を、実際の応答で確かめる。検索エンジンが
 * 見るのは HTML・HTTP・XML の実出力なので、ソースや型ではなくそれを正本にする。
 *
 * 検査（すべて機械判定。1 件でも失敗すれば終了コード 1）:
 *
 * 1. HTTP の台帳 — 移行前の全 URL が同じステータスと Location を返す
 *    （意図した変更は `expectations.ts` の `BASELINE_HTTP_CHANGES` だけ）。
 *    日本語の正規 URL に新しい 3xx / 404 が無い
 * 2. sitemap の実応答 — 掲載 URL がすべて 200・索引対象・自己 canonical で、
 *    HTML の hreflang が sitemap と同じ。hreflang の相手も 200・索引対象・自己 canonical
 *    （DB 由来のお知らせ詳細のような動的ページもここで見る）
 * 3. 未公開の英語 — 移行前の日本語の URL に `/en` を付けたものは、公開した英語を除き
 *    すべて hard 404 + `X-Robots-Tag: noindex` + meta robots noindex（index を併記しない）
 * 4. 言語の判定 — cookie（`NEXT_LOCALE`）・`Accept-Language`・bot の User-Agent・
 *    query のどの組み合わせでも、ステータス・Location・canonical・lang・robots・
 *    hreflang が変わらない。`NEXT_LOCALE` を書かない
 * 5. RSC / prefetch — Next のクライアント遷移の要求（`RSC: 1`・`Next-Router-Prefetch: 1`）
 *    も、日本語・公開した英語は 200 の RSC、未公開の英語は 404
 * 6. 未知の slug・言語・`/ja` の別名・管理画面・API・認証・静的ファイル・robots.txt
 * 7. noindex — 日本語の noindex ページは meta robots が noindex で、親の googlebot の
 *    index が残らない
 * 8. 認証 — ゲスト・壊れた cookie・ログイン済み（dev-seed のユーザー。ローカルの
 *    Supabase に対してだけ）で `/` と `/dashboard` を確かめ、ログイン済みの HTML が
 *    共有キャッシュに載らず、後続のゲストに漏れない
 * 9. SNS・構造化データ — bot の User-Agent で取得した head の title・description・
 *    og・twitter、og:image の実体（200・PNG・寸法）、JSON-LD
 *
 * `--origin` は手元のサーバー（localhost / 127.0.0.1 / [::1]）に限る。
 * 本番や Preview に向けて走らせない（ログインの検査が dev-seed の資格情報を使う）。
 */
import { resolve } from "node:path";

import { createServerClient } from "@supabase/ssr";

import { readBaseline, stripOrigin } from "./_lib/baseline";
import {
  hasExplicitIndex,
  type HtmlHead,
  isNoindex,
  parseHtml,
  readHead,
} from "./_lib/html";
import {
  createReport,
  difference,
  printReport,
  readArg,
  type Report,
  writeReportJson,
} from "./_lib/report";
import { parseSitemap } from "./_lib/sitemap-xml";
import {
  AUDIT_LOCALES,
  BASELINE_HTTP_CHANGES,
  BASELINE_ROBOTS_DISALLOW,
  EN_INDEXABLE_PATHS,
  EN_NOINDEX_PATHS,
  parseSiteUrl,
  SITE_ORIGIN,
} from "./expectations";
import { SEED_PASSWORD } from "../dev-seed/users";

const [DEFAULT_LOCALE = "ja"] = AUDIT_LOCALES;

/** ローカルの開発サーバーとみなすホスト */
const LOCAL_HOSTS: ReadonlySet<string> = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
]);

/** ログインの検査に使う dev-seed のユーザー（ローカルの Supabase にだけ存在する） */
const SEED_EMAIL = "alice@example.local";

/** 検索エンジン・SNS のクローラーの User-Agent */
const BOT_USER_AGENTS: Readonly<Record<string, string>> = {
  googlebot:
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  twitterbot: "Twitterbot/1.0",
  facebook:
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
};

/** 応答 1 件 */
interface Fetched {
  readonly status: number;
  readonly headers: Headers;
  readonly body: string;
  /** Location（origin を外したもの。無ければ空） */
  readonly location: string;
}

/** 監査の文脈 */
interface Context {
  readonly origin: string;
  readonly report: Report;
}

async function get(
  context: Context,
  path: string,
  headers: Readonly<Record<string, string>> = {},
): Promise<Fetched> {
  const response = await fetch(`${context.origin}${path}`, {
    redirect: "manual",
    headers,
  });
  const location = response.headers.get("location") ?? "";
  return {
    status: response.status,
    headers: response.headers,
    body: await response.text(),
    location: stripOrigin(location),
  };
}

function headOf(fetched: Fetched): HtmlHead | undefined {
  const type = fetched.headers.get("content-type") ?? "";
  return type.includes("text/html")
    ? readHead(parseHtml(fetched.body))
    : undefined;
}

/** X-Robots-Tag が noindex か */
function headerNoindex(fetched: Fetched): boolean {
  return isNoindex([fetched.headers.get("x-robots-tag") ?? ""]);
}

/** 応答が「索引されない」か（404 / 410、または noindex） */
function isNotIndexable(fetched: Fetched): boolean {
  if (fetched.status === 404 || fetched.status === 410) return true;
  const head = headOf(fetched);
  return (
    headerNoindex(fetched) || (head !== undefined && isNoindex(head.robots))
  );
}

/** 未公開の英語の応答が hard 404 + noindex（index を併記しない）か。違えば理由 */
function hardNotFoundProblems(fetched: Fetched): string[] {
  const problems: string[] = [];
  if (fetched.status !== 404) problems.push(`status ${fetched.status}`);
  if (!headerNoindex(fetched)) problems.push("X-Robots-Tag: noindex が無い");
  const head = headOf(fetched);
  if (!head || !isNoindex(head.robots))
    problems.push("meta robots noindex が無い");
  if (
    head &&
    (hasExplicitIndex(head.robots) || hasExplicitIndex(head.googlebot))
  ) {
    problems.push("robots / googlebot に index が残る");
  }
  return problems;
}

/** 応答の SEO 上の署名（変わってはいけない項目） */
function signature(fetched: Fetched): string {
  const head = headOf(fetched);
  return JSON.stringify({
    status: fetched.status,
    location: fetched.location,
    xRobots: fetched.headers.get("x-robots-tag") ?? "",
    lang: head?.lang ?? "",
    canonicals: head?.canonicals ?? [],
    robots: head?.robots ?? [],
    alternates: head?.alternates ?? [],
  });
}

/** 本番の絶対 URL を、監査するサーバーのパスにする */
function toLocalPath(url: string): string | undefined {
  if (url === SITE_ORIGIN) return "/";
  return url.startsWith(`${SITE_ORIGIN}/`)
    ? url.slice(SITE_ORIGIN.length)
    : undefined;
}

/** 1. HTTP の台帳 */
async function auditHttpLedger(
  context: Context,
  rows: readonly { path: string; status: number; location: string }[],
): Promise<void> {
  const failures: string[] = [];
  for (const row of rows) {
    const change = BASELINE_HTTP_CHANGES.get(row.path);
    const expected = change
      ? { status: change.status, location: change.location ?? "" }
      : { status: row.status, location: row.location };
    const fetched = await get(context, row.path);
    if (
      fetched.status !== expected.status ||
      fetched.location !== expected.location
    ) {
      failures.push(
        `${row.path}: ${fetched.status} ${fetched.location || ""}（期待 ${expected.status} ${expected.location}）`.trim(),
      );
    }
    if (row.path.startsWith("/en") && expected.status === 404) {
      for (const problem of hardNotFoundProblems(fetched)) {
        failures.push(`${row.path}: ${problem}`);
      }
    }
  }
  context.report.check(
    "HTTP の台帳",
    `baseline ${rows.length} URL を照合（意図した変更 ${BASELINE_HTTP_CHANGES.size} 件）`,
    failures,
  );
}

/** 2. sitemap の実応答 */
async function auditSitemapResponses(
  context: Context,
  baselineLocs: readonly string[],
): Promise<void> {
  const fetched = await get(context, "/sitemap.xml");
  const parsed = parseSitemap(fetched.body);
  if (fetched.status !== 200 || parsed.error) {
    context.report.check("sitemap の実応答", "取得・解析できない", [
      `status ${fetched.status} ${parsed.error ?? ""}`.trim(),
    ]);
    return;
  }
  const failures: string[] = [];
  const locs = parsed.entries.map((entry) => entry.loc);
  const japanese = locs.filter(
    (loc) => parseSiteUrl(loc)?.locale === DEFAULT_LOCALE,
  );
  failures.push(
    ...difference(baselineLocs, new Set(japanese)).map(
      (loc) => `missing: ${loc}`,
    ),
    ...difference(japanese, new Set(baselineLocs)).map(
      (loc) => `unexpected-ja: ${loc}`,
    ),
  );
  const checkedTargets = new Set<string>();
  const checkIndexable = async (url: string, label: string) => {
    const path = toLocalPath(url);
    if (path === undefined) {
      failures.push(`${label}: 本番の origin でない ${url}`);
      return undefined;
    }
    const response = await get(context, path);
    const head = headOf(response);
    if (response.status !== 200)
      failures.push(`${label}: ${url} が ${response.status}`);
    if (isNotIndexable(response))
      failures.push(`${label}: ${url} が noindex / 404`);
    if (!head || head.canonicals.length !== 1 || head.canonicals[0] !== url) {
      failures.push(
        `${label}: ${url} の canonical が ${head?.canonicals.join(" ") || "(なし)"}`,
      );
    }
    return head;
  };
  let alternateCount = 0;
  for (const entry of parsed.entries) {
    const head = await checkIndexable(entry.loc, "sitemap");
    if (!head) continue;
    const htmlAlternates = Object.fromEntries(
      head.alternates.map((alternate) => [alternate.hreflang, alternate.href]),
    );
    if (JSON.stringify(htmlAlternates) !== JSON.stringify(entry.alternates)) {
      failures.push(`${entry.loc}: HTML の hreflang が sitemap と違う`);
    }
    for (const href of Object.values(entry.alternates)) {
      alternateCount += 1;
      if (checkedTargets.has(href)) continue;
      checkedTargets.add(href);
      await checkIndexable(href, `${entry.loc} の hreflang の相手`);
    }
  }
  context.report.check(
    "sitemap の実応答",
    `URL ${locs.length} 件（日本語 ${japanese.length}・英語 ${locs.length - japanese.length}）、hreflang ${alternateCount} 本・相手 ${checkedTargets.size} URL`,
    failures,
  );
}

/** 3. 未公開の英語 */
async function auditUnpublishedEnglish(
  context: Context,
  japanesePaths: readonly string[],
): Promise<void> {
  const published = new Set([...EN_INDEXABLE_PATHS, ...EN_NOINDEX_PATHS]);
  const targets = japanesePaths.filter((path) => !published.has(path));
  const failures: string[] = [];
  for (const path of targets) {
    const enPath = `/en${path === "/" ? "" : path}`;
    for (const problem of hardNotFoundProblems(await get(context, enPath))) {
      failures.push(`${enPath}: ${problem}`);
    }
  }
  context.report.check(
    "未公開の英語は hard 404 + noindex",
    `${targets.length} URL`,
    failures,
  );
}

/** 4 で使う URL（静的・動的・英語・noindex を混ぜる） */
const VARIANT_SAMPLE_PATHS = [
  "/",
  "/practice",
  "/reference/score-table",
  "/en/reference/score-table",
  "/en/practice",
  "/en",
  "/lessons",
  "/announcements",
  "/practice/jantou-fu/play",
  "/dashboard",
] as const;

/** 4. 言語の判定は URL だけ */
async function auditLocaleNegotiation(context: Context): Promise<number> {
  const cookies = ["", "NEXT_LOCALE=en", "NEXT_LOCALE=ja"];
  const languages = ["", "en-US,en;q=0.9", "ja,en;q=0.5"];
  const failures: string[] = [];
  let combinations = 0;
  for (const path of VARIANT_SAMPLE_PATHS) {
    const base = await get(context, path);
    const expected = signature(base);
    const variants: [string, Record<string, string>][] = [];
    for (const cookie of cookies) {
      for (const language of languages) {
        const headers: Record<string, string> = {};
        if (cookie) headers.cookie = cookie;
        if (language) headers["accept-language"] = language;
        variants.push([
          `cookie=${cookie || "-"} lang=${language || "-"}`,
          headers,
        ]);
      }
    }
    for (const [name, userAgent] of Object.entries(BOT_USER_AGENTS)) {
      variants.push([`ua=${name}`, { "user-agent": userAgent }]);
      variants.push([
        `ua=${name} lang=en`,
        { "user-agent": userAgent, "accept-language": "en-US,en;q=0.9" },
      ]);
    }
    for (const [label, headers] of variants) {
      combinations += 1;
      const fetched = await get(context, path, headers);
      if (signature(fetched) !== expected) {
        failures.push(
          `${path} [${label}]: ${signature(fetched)}（基準 ${expected}）`,
        );
      }
      if ((fetched.headers.get("set-cookie") ?? "").includes("NEXT_LOCALE")) {
        failures.push(`${path} [${label}]: NEXT_LOCALE を書いた`);
      }
    }
    // query は canonical・hreflang に混ざらない（Location は query ごと引き継いでよい）
    combinations += 1;
    const withQuery = await get(
      context,
      `${path}?utm_source=audit&variant=all`,
    );
    const queryHead = headOf(withQuery);
    const baseHead = headOf(base);
    if (
      withQuery.status !== base.status ||
      JSON.stringify(queryHead?.canonicals ?? []) !==
        JSON.stringify(baseHead?.canonicals ?? []) ||
      JSON.stringify(queryHead?.alternates ?? []) !==
        JSON.stringify(baseHead?.alternates ?? [])
    ) {
      failures.push(
        `${path}?utm_source=audit&variant=all: canonical / hreflang / status が query で変わった`,
      );
    }
  }
  context.report.check(
    "言語の判定は URL だけ（cookie・Accept-Language・UA・query）",
    `${VARIANT_SAMPLE_PATHS.length} URL × 組み合わせ ${combinations} 件`,
    failures,
    ["hash は HTTP の要求に載らないため検査できない（クライアントだけの値）"],
  );
  return combinations;
}

/**
 * RSC の要求を送る
 *
 * Next 16 は `RSC: 1` の要求に `_rsc`（キャッシュ分けの値）が無いと、同じ URL に
 * `_rsc` を付けて 307 で返す（クライアントの router は最初から付けて送る）。
 * 監査はその 307 を 1 回だけたどる。
 */
async function getRsc(
  context: Context,
  path: string,
  headers: Readonly<Record<string, string>>,
): Promise<Fetched> {
  const first = await get(context, path, headers);
  if (first.status === 307 && /[?&]_rsc(=|&|$)/.test(first.location)) {
    return get(context, first.location, headers);
  }
  return first;
}

/** 5. RSC / prefetch */
async function auditRsc(context: Context): Promise<void> {
  const failures: string[] = [];
  const headerSets: [string, Record<string, string>][] = [
    ["RSC", { rsc: "1" }],
    ["prefetch", { rsc: "1", "next-router-prefetch": "1" }],
  ];
  const okPaths = [
    "/",
    "/practice",
    "/reference/score-table",
    "/en/reference/score-table",
    "/lessons",
  ];
  const notFoundPaths = ["/en/practice", "/en", "/en/lessons", "/en/admin"];
  let requests = 0;
  for (const [label, headers] of headerSets) {
    for (const path of okPaths) {
      requests += 1;
      const fetched = await getRsc(context, path, headers);
      const type = fetched.headers.get("content-type") ?? "";
      if (fetched.status !== 200 || !type.includes("text/x-component")) {
        failures.push(
          `${path} [${label}]: ${fetched.status} ${type} ${fetched.location}`,
        );
      }
    }
    for (const path of notFoundPaths) {
      requests += 1;
      const fetched = await getRsc(context, path, headers);
      if (fetched.status !== 404 || !headerNoindex(fetched)) {
        failures.push(
          `${path} [${label}]: ${fetched.status}（期待 404 + noindex）`,
        );
      }
    }
  }
  context.report.check("RSC / prefetch の要求", `${requests} 件`, failures);
}

/** 6 の 1 件の期待 */
interface EdgeCase {
  readonly path: string;
  /** 期待の説明 */
  readonly expect: string;
  /** 合格なら undefined、不合格なら理由 */
  readonly check: (fetched: Fetched) => string | undefined;
}

const expectStatus =
  (status: number, location?: string) =>
  (fetched: Fetched): string | undefined =>
    fetched.status === status &&
    (location === undefined || fetched.location === location)
      ? undefined
      : `${fetched.status} ${fetched.location}`.trim();

const expectHardNotFound = (fetched: Fetched): string | undefined => {
  const problems = hardNotFoundProblems(fetched);
  return problems.length === 0 ? undefined : problems.join(" / ");
};

const expectNotIndexable = (fetched: Fetched): string | undefined =>
  isNotIndexable(fetched) ? undefined : `${fetched.status} で索引対象`;

const expectNotOk = (fetched: Fetched): string | undefined =>
  fetched.status === 200 ? "200 で重複の URL を返した" : undefined;

const expectContentType =
  (type: string) =>
  (fetched: Fetched): string | undefined =>
    fetched.status === 200 &&
    (fetched.headers.get("content-type") ?? "").includes(type)
      ? undefined
      : `${fetched.status} ${fetched.headers.get("content-type") ?? ""}`;

const EDGE_CASES: readonly EdgeCase[] = [
  {
    path: "/reference/glossary/__audit_unknown__",
    expect: "404",
    check: expectStatus(404),
  },
  {
    path: "/dojo/ranks/__audit_unknown__",
    expect: "404 か noindex",
    check: expectNotIndexable,
  },
  {
    path: "/announcements/__audit_unknown__",
    expect: "404 か noindex",
    check: expectNotIndexable,
  },
  {
    path: "/u/__audit_unknown__",
    expect: "404 か noindex",
    check: expectNotIndexable,
  },
  { path: "/__audit_unknown__", expect: "404", check: expectStatus(404) },
  {
    path: "/en/__audit_unknown__",
    expect: "hard 404 + noindex",
    check: expectHardNotFound,
  },
  {
    path: "/en/reference/glossary/ankan",
    expect: "hard 404 + noindex",
    check: expectHardNotFound,
  },
  {
    path: "/en/reference/glossary/__audit_unknown__",
    expect: "hard 404 + noindex",
    check: expectHardNotFound,
  },
  { path: "/fr/practice", expect: "404", check: expectStatus(404) },
  { path: "/fr", expect: "404", check: expectStatus(404) },
  {
    path: "/ja/practice",
    expect: "307 → /practice",
    check: expectStatus(307, "/practice"),
  },
  {
    path: "/ja/reference/score-table?x=1",
    expect: "307 → /reference/score-table?x=1",
    check: expectStatus(307, "/reference/score-table?x=1"),
  },
  { path: "/ja/__audit_unknown__", expect: "404", check: expectStatus(404) },
  { path: "/ja/admin", expect: "404", check: expectStatus(404) },
  {
    path: "/ja/en/reference/score-table",
    expect: "200 にならない",
    check: expectNotOk,
  },
  {
    path: "/en/en/reference/score-table",
    expect: "hard 404 + noindex",
    check: expectHardNotFound,
  },
  {
    path: "/EN/reference/score-table",
    expect: "200 にならない（大文字の別名を 200 で出さない）",
    check: expectNotOk,
  },
  {
    path: "/en/admin",
    expect: "hard 404 + noindex",
    check: expectHardNotFound,
  },
  {
    path: "/en/api/health",
    expect: "hard 404 + noindex",
    check: expectHardNotFound,
  },
  {
    path: "/en/auth/callback",
    expect: "hard 404 + noindex",
    check: expectHardNotFound,
  },
  {
    path: "/en/sitemap.xml",
    expect: "hard 404 + noindex",
    check: expectHardNotFound,
  },
  {
    path: "/auth/callback",
    expect: "307（コード無しはサインインへ）",
    check: (fetched) =>
      fetched.status === 307 && fetched.location.startsWith("/sign-in")
        ? undefined
        : `${fetched.status} ${fetched.location}`,
  },
  {
    path: "/api/ads/mobile-practice-grid-native-ad",
    expect: "200 JSON",
    check: expectContentType("application/json"),
  },
  {
    path: "/favicon.ico",
    expect: "200 image",
    check: expectContentType("image/"),
  },
  {
    path: "/icon.png",
    expect: "200 image/png",
    check: expectContentType("image/png"),
  },
  {
    path: "/apple-icon.png",
    expect: "200 image/png",
    check: expectContentType("image/png"),
  },
  {
    path: "/og-image.png",
    expect: "200 image/png",
    check: expectContentType("image/png"),
  },
  {
    path: "/og-image-en.png",
    expect: "200 image/png",
    check: expectContentType("image/png"),
  },
  {
    path: "/robots.txt",
    expect: "200 text/plain",
    check: expectContentType("text/plain"),
  },
  { path: "/sitemap.xml", expect: "200 XML", check: expectContentType("xml") },
];

/** 6. 未知の値・別名・管理画面・API・認証・静的ファイル・robots.txt */
async function auditEdgeCases(context: Context): Promise<void> {
  const failures: string[] = [];
  for (const edge of EDGE_CASES) {
    const problem = edge.check(await get(context, edge.path));
    if (problem)
      failures.push(`${edge.path}: ${problem}（期待 ${edge.expect}）`);
  }
  const robots = await get(context, "/robots.txt");
  const disallow = robots.body
    .split("\n")
    .map((line) => /^Disallow:\s*(\S+)/i.exec(line.trim())?.[1])
    .filter((value): value is string => value !== undefined);
  if (JSON.stringify(disallow) !== JSON.stringify(BASELINE_ROBOTS_DISALLOW)) {
    failures.push(
      `robots.txt の Disallow が ${disallow.join(" ")}（移行前 ${BASELINE_ROBOTS_DISALLOW.join(" ")}）`,
    );
  }
  context.report.check(
    "未知の値・別名・管理画面・API・認証・静的ファイル・robots.txt",
    `${EDGE_CASES.length + 1} 件`,
    failures,
  );
}

/** 7 で見る日本語の noindex ページ */
const JA_NOINDEX_SAMPLES = [
  "/practice/jantou-fu/play",
  "/practice/jantou-fu/training",
  "/practice/jantou-fu/result",
  "/practice/agari-score/play",
  "/exam/fu/training",
  "/mypage",
  "/contact/success",
] as const;

/**
 * 公開状態は noindex（`route-policy.ts`）だが、HTML は移行前から index のページ
 *
 * ランキングの詳細は移行前から canonical も noindex も持たない（`index, follow`）。
 * 移行で変えたものではないので失敗にせず、食い違いとして報告だけする。
 */
const JA_NOINDEX_KNOWN_GAPS = ["/leaderboard/monthly/jantou-fu"] as const;

/** 7. 日本語の noindex */
async function auditJapaneseNoindex(context: Context): Promise<void> {
  const failures: string[] = [];
  for (const path of JA_NOINDEX_SAMPLES) {
    const fetched = await get(context, path);
    const head = headOf(fetched);
    if (fetched.status !== 200) {
      failures.push(`${path}: ${fetched.status}`);
      continue;
    }
    if (!head || !isNoindex(head.robots))
      failures.push(`${path}: noindex でない`);
    if (head && head.googlebot.some((content) => !isNoindex([content]))) {
      failures.push(
        `${path}: googlebot に index が残る（${head.googlebot.join(" | ")}）`,
      );
    }
    if (head && head.alternates.length > 0)
      failures.push(`${path}: noindex なのに hreflang がある`);
  }
  const notes: string[] = [];
  for (const path of JA_NOINDEX_KNOWN_GAPS) {
    const fetched = await get(context, path);
    const head = headOf(fetched);
    if (fetched.status === 200 && head && !isNoindex(head.robots)) {
      notes.push(
        `${path}: 公開状態は noindex だが HTML は ${head.robots.join(" | ")}・canonical ${head.canonicals.join(" ") || "(なし)"}（移行前から同じ）`,
      );
    }
  }
  context.report.check(
    "日本語の noindex",
    `${JA_NOINDEX_SAMPLES.length} 件`,
    failures,
    notes,
  );
}

/** cookie を書いた・ログイン済みの応答が共有キャッシュに載らないか */
function isPrivate(fetched: Fetched): boolean {
  const cacheControl = (
    fetched.headers.get("cache-control") ?? ""
  ).toLowerCase();
  return (
    (cacheControl.includes("private") || cacheControl.includes("no-store")) &&
    !cacheControl.includes("s-maxage") &&
    !cacheControl.includes("public")
  );
}

/** LP（未ログインの `/`）の応答か */
function isLandingPage(fetched: Fetched): boolean {
  const head = headOf(fetched);
  return (
    fetched.status === 200 &&
    head !== undefined &&
    head.canonicals[0] === SITE_ORIGIN &&
    !isNoindex(head.robots)
  );
}

/** dev-seed のユーザーでログインし、要求に載せる cookie を返す */
async function signIn(): Promise<{ cookie: string } | { error: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return {
      error:
        "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY が無い（ローカルの Supabase の値で起動した環境で走らせる）",
    };
  }
  const host = new URL(url).hostname;
  if (!LOCAL_HOSTS.has(host) && !LOCAL_HOSTS.has(`[${host}]`)) {
    return {
      error: `Supabase の接続先がローカルでない（${host}）。ログインの検査はローカルだけで行う`,
    };
  }
  const jar = new Map<string, string>();
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const { name, value } of cookies) {
          if (value === "") jar.delete(name);
          else jar.set(name, value);
        }
      },
    },
  });
  const { error } = await client.auth.signInWithPassword({
    email: SEED_EMAIL,
    password: SEED_PASSWORD,
  });
  if (error) return { error: `ログインに失敗: ${error.message}` };
  if (jar.size === 0) return { error: "ログインしたが cookie が書かれない" };
  return {
    cookie: [...jar].map(([name, value]) => `${name}=${value}`).join("; "),
  };
}

/** 8. 認証 */
async function auditAuth(context: Context): Promise<void> {
  const failures: string[] = [];
  const guestTop = await get(context, "/");
  if (!isLandingPage(guestTop))
    failures.push(`ゲストの / が LP でない（${guestTop.status}）`);
  const guestDashboard = await get(context, "/dashboard");
  if (guestDashboard.status !== 307 || guestDashboard.location !== "/") {
    failures.push(
      `ゲストの /dashboard: ${guestDashboard.status} ${guestDashboard.location}（期待 307 → /）`,
    );
  }
  // 期限切れ・壊れたセッションの cookie（@supabase/ssr の名前の形）
  const expired = { cookie: "sb-127-auth-token=base64-eyJleHBpcmVkIjp0cnVlfQ" };
  const expiredTop = await get(context, "/", expired);
  if (!isLandingPage(expiredTop))
    failures.push(`壊れた cookie の / が LP でない（${expiredTop.status}）`);
  if (expiredTop.headers.get("set-cookie") && !isPrivate(expiredTop)) {
    failures.push(
      "壊れた cookie の / が cookie を書いたのに共有キャッシュ可能",
    );
  }
  const expiredDashboard = await get(context, "/dashboard", expired);
  if (expiredDashboard.status !== 307 || expiredDashboard.location !== "/") {
    failures.push(
      `壊れた cookie の /dashboard: ${expiredDashboard.status} ${expiredDashboard.location}`,
    );
  }

  const session = await signIn();
  if ("error" in session) {
    failures.push(`ログイン済みの検査ができない: ${session.error}`);
  } else {
    const headers = { cookie: session.cookie };
    const top = await get(context, "/", headers);
    const head = headOf(top);
    if (top.status !== 200)
      failures.push(`ログイン済みの /: ${top.status} ${top.location}`);
    if (!head || !isNoindex(head.robots))
      failures.push("ログイン済みの / が dashboard（noindex）でない");
    if (!isPrivate(top)) {
      failures.push(
        `ログイン済みの / が共有キャッシュ可能（Cache-Control: ${top.headers.get("cache-control") ?? "(なし)"}）`,
      );
    }
    if (top.headers.get("set-cookie") && !isPrivate(top)) {
      failures.push(
        "ログイン済みの / が cookie を書いたのに共有キャッシュ可能",
      );
    }
    const dashboard = await get(context, "/dashboard", headers);
    if (dashboard.status === 200 && !isPrivate(dashboard)) {
      failures.push("ログイン済みの /dashboard が共有キャッシュ可能");
    }
    const enTop = await get(context, "/en", headers);
    for (const problem of hardNotFoundProblems(enTop))
      failures.push(`ログイン済みの /en: ${problem}`);
    const after = await get(context, "/");
    if (!isLandingPage(after))
      failures.push(
        "ログイン済みの要求の後、ゲストの / が LP でない（キャッシュの混入）",
      );
  }
  context.report.check(
    "認証（ゲスト・壊れた cookie・ログイン済み）",
    "ゲスト / 壊れた cookie / dev-seed のユーザー",
    failures,
  );
}

/** PNG の寸法（IHDR）。PNG でなければ undefined */
function pngSize(
  bytes: Uint8Array,
): { width: number; height: number } | undefined {
  const pngMagic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (
    bytes.length < 24 ||
    pngMagic.some((value, index) => bytes[index] !== value)
  ) {
    return undefined;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

/** 9 で見るページ（言語ごとの公開ページ） */
const SOCIAL_SAMPLES: readonly { path: string; locale: string }[] = [
  { path: "/", locale: "ja" },
  { path: "/reference/score-table", locale: "ja" },
  { path: "/lessons/jantou-fu", locale: "ja" },
  { path: "/en/reference/score-table", locale: "en" },
];

/** 9. SNS・構造化データ */
async function auditSocial(context: Context): Promise<void> {
  const failures: string[] = [];
  const titles = new Map<string, string>();
  for (const { path, locale } of SOCIAL_SAMPLES) {
    for (const [name, userAgent] of Object.entries(BOT_USER_AGENTS)) {
      const fetched = await get(context, path, { "user-agent": userAgent });
      const head = headOf(fetched);
      const label = `${path} [${name}]`;
      if (fetched.status !== 200 || !head) {
        failures.push(`${label}: ${fetched.status}`);
        continue;
      }
      if (head.lang !== locale) failures.push(`${label}: lang=${head.lang}`);
      for (const key of [
        "description",
        "og:title",
        "og:description",
        "og:url",
        "og:image",
        "og:locale",
        "twitter:card",
        "twitter:title",
        "twitter:image",
      ]) {
        if ((head.meta.get(key) ?? "") === "")
          failures.push(`${label}: ${key} が無い`);
      }
      if (head.meta.get("og:url") !== head.canonicals[0])
        failures.push(`${label}: og:url と canonical が違う`);
      titles.set(`${locale}:${path.replace(/^\/en/, "") || "/"}`, head.title);
      for (const error of head.jsonLdErrors)
        failures.push(`${label}: JSON-LD を解析できない ${error}`);
      const imagePath = toLocalPath(head.meta.get("og:image") ?? "");
      if (imagePath === undefined) {
        failures.push(`${label}: og:image が本番の絶対 URL でない`);
        continue;
      }
      const image = await fetch(`${context.origin}${imagePath}`, {
        headers: { "user-agent": userAgent },
      });
      const size = pngSize(new Uint8Array(await image.arrayBuffer()));
      if (
        image.status !== 200 ||
        !(image.headers.get("content-type") ?? "").includes("image/png")
      ) {
        failures.push(
          `${label}: og:image ${imagePath} が ${image.status} ${image.headers.get("content-type") ?? ""}`,
        );
      } else if (
        !size ||
        String(size.width) !== head.meta.get("og:image:width") ||
        String(size.height) !== head.meta.get("og:image:height")
      ) {
        failures.push(
          `${label}: og:image の寸法 ${size ? `${size.width}x${size.height}` : "(PNG でない)"} が meta と違う`,
        );
      }
    }
  }
  if (
    titles.get("ja:/reference/score-table") ===
    titles.get("en:/reference/score-table")
  ) {
    failures.push("点数表の日英の title が同じ");
  }
  context.report.check(
    "SNS・構造化データ（bot の User-Agent）",
    `${SOCIAL_SAMPLES.length} URL × ${Object.keys(BOT_USER_AGENTS).length} UA`,
    failures,
  );
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const origin = readArg(argv, "origin");
  const baselineDir = readArg(argv, "baseline");
  const report = createReport();
  if (!origin || !baselineDir) {
    report.check("引数", "--origin と --baseline が要る", ["引数が足りない"]);
    process.exitCode = printReport("SEO HTTP 監査", report) ? 0 : 1;
    return;
  }
  const originUrl = new URL(origin);
  if (!LOCAL_HOSTS.has(originUrl.hostname)) {
    report.check("引数", "--origin は手元のサーバーに限る", [
      `${originUrl.hostname} はローカルでない`,
    ]);
    process.exitCode = printReport("SEO HTTP 監査", report) ? 0 : 1;
    return;
  }
  const context: Context = { origin: originUrl.origin, report };
  const baseline = readBaseline(baselineDir);
  const baselineLocs = baseline.sitemap.entries.map((entry) => entry.loc);
  const japanesePaths = baseline.http
    .map((row) => row.path)
    .filter(
      (path) =>
        parseSiteUrl(`${SITE_ORIGIN}${path === "/" ? "" : path}`)?.locale ===
        DEFAULT_LOCALE,
    )
    .filter((path) => path !== "/ja" && !path.startsWith("/ja/"));

  await auditHttpLedger(context, baseline.http);
  await auditSitemapResponses(context, baselineLocs);
  await auditUnpublishedEnglish(context, japanesePaths);
  await auditLocaleNegotiation(context);
  await auditRsc(context);
  await auditEdgeCases(context);
  await auditJapaneseNoindex(context);
  await auditAuth(context);
  await auditSocial(context);

  const out = readArg(argv, "out");
  if (out) writeReportJson(resolve(out), report);
  process.exitCode = printReport("SEO HTTP 監査", report) ? 0 : 1;
}

void main();
