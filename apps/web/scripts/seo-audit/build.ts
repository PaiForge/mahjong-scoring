/**
 * build の成果物の SEO 監査（移行前の台帳との比較）
 * SEO build 監査
 *
 * 使い方（`apps/web` で `next build` の後）:
 *
 * ```sh
 * pnpm --filter @mahjong-scoring/web exec tsx scripts/seo-audit/build.ts --baseline <dir>
 * ```
 *
 * `--out <file>` を付けると、全件の明細を JSON で書き出す（標準出力は 1 検査 40 件で切る）。
 *
 * 英語を足す移行で、日本語の検索資産（URL・canonical・静的生成・sitemap）を
 * 1 本も失わないことを、build の見た目ではなく成果物そのもの（manifest・
 * `.next/server/app` の HTML・sitemap.xml）で確かめる。比較は公開 URL に
 * 正規化してから行う — manifest のキーは内部名（`/ja/practice`）なので
 * `/ja` を外して移行前の `/practice` と突き合わせ、英語を除いた差分が空である
 * ことを要求する（`missing == []` かつ `unexpected-ja == []`）。「だいたい同じ」
 * では通さない。
 *
 * 検査（すべて機械判定。1 件でも失敗すれば終了コード 1）:
 *
 * 1. 静的生成の台帳 — 移行前に静的生成した日本語のページがすべて 200 で静的生成され、
 *    新しく静的になったものは `ALLOWED_NEW_JA_STATIC`（動的から静的へ移したことを
 *    認めるパス）だけで、許可したパスは実際に新しく静的になっている。ISR の秒数も同じ。
 *    ページ以外の静的ルート（robots・sitemap・アイコン・API）も残る
 * 2. 動的ルートの台帳 — 日本語で要求ごとに描画するルートの集合が、移行前から
 *    `ALLOWED_NEW_JA_STATIC` を除いたものと同じ（新たに動的になったものは無い）。
 *    許可したパスは移行前に動的で、いまは動的でない。
 *    `generateStaticParams` が日本語で 0 件のルートは失敗（静的な URL が丸ごと消える）
 * 3. 英語の成果物 — 英語は公開したページだけが 200 で、他は not-found の成果物。
 *    200 の静的な HTML を期待するのは、索引させるページ全部と、索引させない
 *    ページのうち日本語で静的なもの（baseline の静的生成の台帳で判定する）。
 *    索引させないページは動的でよく（結果・試験の play / result・道場は日本語でも
 *    動的）、静的 / 動的が日本語と食い違ったら失敗。静的な noindex の英語は
 *    meta robots が noindex。用語のページ（テンプレート）は baseline の日本語の
 *    索引対象のうちテンプレートに合うものを期待する（`expectedEnIndexablePaths`）。
 *    お知らせの一覧は日本語でも動的なので英語も動的な noindex（成果物に無くてよい）。
 *    お知らせの詳細（`EN_NOINDEX_TEMPLATES`）は DB 由来で具体的な URL を列挙せず、
 *    英語のプリレンダーを持たない（あれば「未公開なのに 200 で静的生成」で落ちる）
 * 4. canonical の台帳 — 移行前の HTML ごとの canonical の文字列と robots が同じ。
 *    canonical は 1 本だけ。公開 URL に内部の `/ja` が出ない。英語の索引対象は
 *    自己 canonical、英語の noindex は自己 canonical か canonical 無し
 * 5. hreflang — HTML の alternate が期待値（`expectations.ts` の規則）と一致し、
 *    相手が 200・索引対象・自己 canonical で、相手からも同じ集合が返る
 * 6. 初期 HTML の本文 — 静的な索引対象のページは、JS を実行しない HTML の見える
 *    `<main>` に空でない h1 と本文がある（Suspense で本文が末尾の hidden に回って
 *    いない）。点数表は表の th / td と既知の点数まで見る。英語の索引対象には
 *    広告のリンク（`rel="sponsored"`）が無い（英語では広告を出さない）
 * 7. sitemap — 名前空間付きの XML として解析し、日本語の掲載 URL・lastmod・
 *    changefreq・priority・並びが移行前と同じ、英語は索引対象だけが 1 回ずつ、
 *    alternate が HTML と同じ、掲載 URL が noindex / 404 でない
 * 8. SNS・構造化データ — 静的な索引対象のページの head に言語ごとの title・
 *    description・og・twitter があり、JSON-LD が解析でき、URL と言語が一致する
 *
 * 成果物が無い・読めない検査は skip せず失敗にする（このゲートでは「見なかった」を
 * 合格にしない）。HTTP の振る舞い（proxy の 404・リダイレクト・cookie）は
 * `http.ts` が `next start` に対して確かめる。
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { type Baseline, readBaseline } from "./_lib/baseline";
import {
  type BuildArtifacts,
  classifyRoute,
  htmlRelativePath,
  readBuildArtifacts,
  toPublicPath,
} from "./_lib/build-artifacts";
import {
  type HtmlBody,
  type HtmlHead,
  isNoindex,
  parseHtml,
  readBody,
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
import { parseSitemap, type SitemapEntry } from "./_lib/sitemap-xml";
import {
  ALLOWED_NEW_JA_STATIC,
  AUDIT_LOCALES,
  EN_NOINDEX_PATHS,
  expectedAlternates,
  expectedEnIndexablePaths,
  expectedUrl,
  isEnIndexable,
  matchStaticMigrations,
  parseSiteUrl,
  SITE_ORIGIN,
} from "./expectations";

const [DEFAULT_LOCALE = "ja"] = AUDIT_LOCALES;

/** 本文の見える文字数の下限（h1 を除く）。これ未満はスケルトンだけの HTML とみなす */
const MIN_MAIN_TEXT = 40;

/** 本文まで詳しく見るページ（パス → 見える `<main>` に含まれるべき文言） */
const PILOT_BODIES: ReadonlyMap<
  string,
  {
    readonly minTh: number;
    readonly minTd: number;
    readonly texts: Readonly<Record<string, readonly string[]>>;
  }
> = new Map([
  [
    "/reference/score-table",
    {
      minTh: 5,
      minTd: 50,
      // 30 符 4 翻の子ロン 7700・親ツモ 3900 オール相当の既知の点数と、満貫の見出し
      texts: { ja: ["7700", "3900", "満貫"], en: ["7700", "3900", "Mangan"] },
    },
  ],
]);

/** og:locale の期待値 */
const OG_LOCALES: Readonly<Record<string, string>> = {
  ja: "ja_JP",
  en: "en_US",
};

/** 監査に読み込んだ静的ページ 1 枚 */
interface StaticPage {
  readonly locale: string;
  /** ロケール非依存のパス */
  readonly path: string;
  /** 公開 URL のパス */
  readonly publicPath: string;
  readonly htmlPath: string;
  readonly head: HtmlHead;
  readonly body: HtmlBody;
}

function pageLabel(page: { locale: string; publicPath: string }): string {
  return `${page.publicPath}（${page.locale}）`;
}

/** 公開 URL のパスをロケール非依存のパスにする */
function localeFreePath(locale: string, publicPath: string): string {
  if (locale === DEFAULT_LOCALE) return publicPath;
  const rest = publicPath.slice(locale.length + 1);
  return rest === "" ? "/" : rest;
}

/** 内部の `/ja` が公開 URL に出ていないか（`/ja` と `/ja/...`） */
function exposesInternalLocale(url: string): boolean {
  return (
    url === `${SITE_ORIGIN}/${DEFAULT_LOCALE}` ||
    url.startsWith(`${SITE_ORIGIN}/${DEFAULT_LOCALE}/`) ||
    url.startsWith(`${SITE_ORIGIN}/${DEFAULT_LOCALE}?`)
  );
}

/** alternate を hreflang → href にし、重複を失敗として返す */
function alternateMap(head: HtmlHead): {
  readonly map: Readonly<Record<string, string>>;
  readonly duplicates: readonly string[];
} {
  const map: Record<string, string> = {};
  const duplicates: string[] = [];
  for (const { hreflang, href } of head.alternates) {
    if (hreflang in map) duplicates.push(hreflang);
    map[hreflang] = href;
  }
  return { map, duplicates };
}

function sameRecord(
  a: Readonly<Record<string, string>>,
  b: Readonly<Record<string, string>>,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((key) => a[key] === b[key]);
}

function formatRecord(record: Readonly<Record<string, string>>): string {
  const entries = Object.entries(record);
  return entries.length === 0
    ? "{}"
    : entries.map(([key, value]) => `${key}=${value}`).join(" ");
}

/** 静的に 200 で生成された（言語付きの）ページを読み込む */
function loadStaticPages(
  artifacts: BuildArtifacts,
  serverAppDir: string,
): StaticPage[] {
  const pages: StaticPage[] = [];
  for (const route of artifacts.prerendered) {
    if (route.routeType !== "page" || route.status === 404) continue;
    const resolved = toPublicPath(route.key, AUDIT_LOCALES);
    if (!resolved) continue;
    const htmlPath = htmlRelativePath(route.key);
    const file = join(serverAppDir, htmlPath);
    if (!existsSync(file)) continue;
    const document = parseHtml(readFileSync(file, "utf8"));
    pages.push({
      locale: resolved.locale,
      path: localeFreePath(resolved.locale, resolved.publicPath),
      publicPath: resolved.publicPath,
      htmlPath,
      head: readHead(document),
      body: readBody(document),
    });
  }
  return pages;
}

/** ページ（`/page` の app route）をロケール非依存のテンプレートと言語に分ける */
function templateOf(appRoute: string): {
  readonly template: string;
  readonly localized: boolean;
} {
  if (appRoute === "/[locale]") return { template: "/", localized: true };
  if (appRoute.startsWith("/[locale]/")) {
    return { template: appRoute.slice("/[locale]".length), localized: true };
  }
  return { template: appRoute, localized: false };
}

/** 1. 静的生成の台帳 */
function auditStaticLedger(
  report: Report,
  baseline: Baseline,
  current: BuildArtifacts,
): void {
  const isRoot = (key: string) => key.startsWith("/_");
  const baselinePages = baseline.build.prerendered.filter(
    (route) => route.routeType === "page" && !isRoot(route.key),
  );
  const baselineStatic = new Set(baselinePages.map((route) => route.key));
  const jaStatic = new Map<string, (typeof current.prerendered)[number]>();
  for (const route of current.prerendered) {
    if (route.routeType !== "page" || route.status === 404) continue;
    const resolved = toPublicPath(route.key, AUDIT_LOCALES);
    if (resolved?.locale === DEFAULT_LOCALE)
      jaStatic.set(resolved.publicPath, route);
  }
  const missing = difference(baselineStatic, new Set(jaStatic.keys()));
  const { unexpected, unused } = matchStaticMigrations(
    difference(jaStatic.keys(), baselineStatic),
  );
  report.check(
    "静的生成の台帳（日本語）",
    `baseline ${baselineStatic.size} 件 / 現在 ${jaStatic.size} 件、missing ${missing.length} 件、unexpected-ja ${unexpected.length} 件、unused-allowance ${unused.length} 件`,
    [
      ...missing.map(
        (path) =>
          `missing: ${path}（移行前は静的生成。いまは 200 の静的な HTML が無い）`,
      ),
      ...unexpected.map(
        (path) =>
          `unexpected-ja: ${path}（移行前に無かった日本語の静的ページ）`,
      ),
      ...unused.map(
        (path) =>
          `unused-allowance: ${path}（静的化を許可したが、新しく静的生成されていない）`,
      ),
    ],
  );

  const revalidateDiff: string[] = [];
  for (const route of baselinePages) {
    const now = jaStatic.get(route.key);
    if (now && now.revalidate !== route.revalidate) {
      revalidateDiff.push(
        `${route.key}: ISR ${String(route.revalidate)} → ${String(now.revalidate)}`,
      );
    }
  }
  report.check(
    "ISR の秒数（日本語）",
    `${baselinePages.length - missing.length} 件を比較`,
    revalidateDiff,
  );

  const baselineOthers = baseline.build.prerendered
    .filter((route) => route.routeType !== "page" || isRoot(route.key))
    .map((route) => route.key);
  const currentKeys = new Set(current.prerendered.map((route) => route.key));
  const lostOthers = difference(baselineOthers, currentKeys);
  report.check(
    "ページ以外の静的ルートと root の成果物",
    `baseline ${baselineOthers.length} 件、欠落 ${lostOthers.length} 件`,
    lostOthers.map((key) => `missing: ${key}`),
  );
}

/** 2. 動的ルートの台帳 */
function auditDynamicLedger(
  report: Report,
  baseline: Baseline,
  current: BuildArtifacts,
): void {
  const baselineTemplates = new Set(baseline.build.pageRoutes);
  const baselineDynamic = new Set(
    baseline.build.pageRoutes.filter(
      (route) =>
        classifyRoute(baseline.build, route, undefined).kind === "dynamic",
    ),
  );
  const currentTemplates = new Set<string>();
  const currentDynamic = new Set<string>();
  const ssgEmpty: string[] = [];
  for (const appRoute of current.pageRoutes) {
    const { template, localized } = templateOf(appRoute);
    if (appRoute === "/_not-found" || appRoute === "/_global-error") continue;
    currentTemplates.add(template);
    const kind = classifyRoute(
      current,
      appRoute,
      localized ? DEFAULT_LOCALE : undefined,
    ).kind;
    if (kind === "dynamic") currentDynamic.add(template);
    if (kind === "ssg-empty") ssgEmpty.push(template);
    if (kind === "not-found")
      ssgEmpty.push(`${template}（日本語が not-found）`);
  }
  for (const route of ["/_not-found", "/_global-error"])
    baselineTemplates.delete(route);
  const lostPages = difference(baselineTemplates, currentTemplates);
  const newPages = difference(currentTemplates, baselineTemplates);
  report.check(
    "ページの台帳（ルートのテンプレート）",
    `baseline ${baselineTemplates.size} 件 / 現在 ${currentTemplates.size} 件`,
    [
      ...lostPages.map((template) => `missing: ${template}`),
      ...newPages.map((template) => `unexpected: ${template}`),
    ],
  );
  const { unexpected: lostDynamic, unused } = matchStaticMigrations(
    difference(baselineDynamic, currentDynamic),
  );
  const newDynamic = difference(currentDynamic, baselineDynamic);
  report.check(
    "動的ルートの台帳（日本語で要求ごとに描画）",
    `baseline ${baselineDynamic.size} 件 / 現在 ${currentDynamic.size} 件、静的化を許可 ${ALLOWED_NEW_JA_STATIC.length} 件`,
    [
      ...lostDynamic.map((template) => `移行前は動的: ${template}`),
      ...newDynamic.map((template) => `新たに動的: ${template}`),
      ...unused.map(
        (template) =>
          `unused-allowance: ${template}（静的化を許可したが、移行前に動的で今は動的でないルートに無い）`,
      ),
    ],
  );
  report.check(
    "generateStaticParams の日本語の値",
    `日本語で 0 件のルート ${ssgEmpty.length} 件`,
    ssgEmpty.map(
      (template) =>
        `${template}: generateStaticParams が日本語で 0 件（dynamicParams=false なら全 URL が 404）`,
    ),
  );
}

/**
 * 移行前に日本語で静的生成されていたページ（ロケール非依存のパス）
 *
 * baseline の静的生成の台帳（移行前の `prerender-manifest.json`。移行前は接頭辞が
 * 無いのでキーがそのまま公開パス）。いまの成果物ではなく移行前の台帳で見るのは、
 * 日本語の静的 / 動的が移行で変わらないことを前提に、英語の期待値を日本語の
 * 移行前の分類から独立に決めるため（いまの成果物で決めると、日本語ごと動的に
 * 崩れたときに英語の期待値も一緒に動いて見逃す）。
 */
function japaneseStaticAtBaseline(baseline: Baseline): ReadonlySet<string> {
  return new Set(
    baseline.build.prerendered
      .filter(
        (route) =>
          route.routeType === "page" &&
          route.status !== 404 &&
          !route.key.startsWith("/_"),
      )
      .map((route) => route.key),
  );
}

/** ロケール非依存のパスを英語の公開パスにする */
function englishPublicPath(path: string): string {
  return `/en${path === "/" ? "" : path}`;
}

/**
 * 3. 英語の成果物
 *
 * 英語の noindex は動的でよい（閲覧者ごとの内容で、日本語でも動的なものが多い。
 * 静的生成が要るのはクローラーが初期 HTML を読む索引対象だけ）。noindex の
 * 静的 / 動的は日本語の移行前の分類と同じであることを求める。
 */
function auditEnglishArtifacts(
  report: Report,
  baseline: Baseline,
  current: BuildArtifacts,
  pages: readonly StaticPage[],
  jaIndexable: ReadonlySet<string>,
): void {
  const jaStatic = japaneseStaticAtBaseline(baseline);
  const staticNoindex = EN_NOINDEX_PATHS.filter((path) => jaStatic.has(path));
  const dynamicNoindex = new Set(
    EN_NOINDEX_PATHS.filter((path) => !jaStatic.has(path)).map(
      englishPublicPath,
    ),
  );
  const expected = new Set(
    [...expectedEnIndexablePaths(jaIndexable), ...staticNoindex].map(
      englishPublicPath,
    ),
  );
  const englishPages = pages.filter((page) => page.locale === "en");
  const ok = new Set(englishPages.map((page) => page.publicPath));
  const notNoindexPages = englishPages
    .filter(
      (page) =>
        EN_NOINDEX_PATHS.includes(page.path) && !isNoindex(page.head.robots),
    )
    .map((page) => page.publicPath);
  const notFound = current.prerendered.filter(
    (route) =>
      route.routeType === "page" &&
      route.status === 404 &&
      toPublicPath(route.key, AUDIT_LOCALES)?.locale === "en",
  );
  const conflicting: string[] = [];
  const notNoindex: string[] = [];
  for (const route of notFound) {
    const file = join(current.serverAppDir ?? "", htmlRelativePath(route.key));
    if (!existsSync(file)) continue;
    const head = readHead(parseHtml(readFileSync(file, "utf8")));
    if (!isNoindex(head.robots)) notNoindex.push(route.key);
    else if (
      head.robots.some((content) => !isNoindex([content])) ||
      head.googlebot.some((content) => !isNoindex([content]))
    ) {
      conflicting.push(route.key);
    }
  }
  report.check(
    "英語の成果物",
    `200 の静的ページ ${ok.size} 件（期待 ${expected.size} 件。索引対象 ${expected.size - staticNoindex.length}・日本語で静的な noindex ${staticNoindex.length}）、動的な noindex ${dynamicNoindex.size} 件（成果物に無くてよい。判定は baseline の静的生成の台帳）、not-found の成果物 ${notFound.length} 件`,
    [
      ...difference(expected, ok).map(
        (path) => `公開したのに 200 の静的な HTML が無い: ${path}`,
      ),
      ...difference(ok, expected).map((path) =>
        dynamicNoindex.has(path)
          ? `日本語で動的な noindex が英語だけ 200 で静的生成: ${path}`
          : `未公開なのに 200 で静的生成: ${path}`,
      ),
      ...notNoindexPages.map(
        (path) =>
          `英語の noindex のページに meta robots noindex が無い: ${path}`,
      ),
      ...notNoindex.map((key) => `not-found の成果物に noindex が無い: ${key}`),
    ],
    conflicting.length === 0
      ? []
      : [
          `not-found の成果物 ${conflicting.length} 件が noindex と並んで親の robots / googlebot の index を持つ（例: ${conflicting.slice(0, 3).join(", ")}）。外部の /en/... には proxy が先に最小の 404 を返すので配信はされない（http.ts が実応答を検査する）`,
        ],
  );
}

/** 4. canonical の台帳 */
function auditCanonicalLedger(
  report: Report,
  baseline: Baseline,
  serverAppDir: string,
  pages: readonly StaticPage[],
): void {
  const failures: string[] = [];
  let compared = 0;
  for (const row of baseline.canonicals) {
    const isRoot = row.htmlPath.startsWith("_");
    const currentPath = isRoot
      ? row.htmlPath
      : row.htmlPath === "index.html"
        ? `${DEFAULT_LOCALE}.html`
        : `${DEFAULT_LOCALE}/${row.htmlPath}`;
    const file = join(serverAppDir, currentPath);
    if (!existsSync(file)) {
      failures.push(`${row.htmlPath}: HTML が無い（${currentPath}）`);
      continue;
    }
    const head = readHead(parseHtml(readFileSync(file, "utf8")));
    compared += 1;
    if (head.canonicals.length > 1) {
      failures.push(
        `${row.htmlPath}: canonical が ${head.canonicals.length} 本`,
      );
    }
    const canonical = head.canonicals[0] ?? "";
    if (canonical !== row.canonical) {
      failures.push(
        `${row.htmlPath}: canonical ${row.canonical || "(なし)"} → ${canonical || "(なし)"}`,
      );
    }
    if (row.htmlPath === "_not-found.html") {
      // 移行前は noindex と親の index の 2 本だった。noindex だけになるのは改善なので
      // 一致は求めず、noindex であることだけを求める
      if (!isNoindex(head.robots))
        failures.push(`${row.htmlPath}: noindex でない`);
    } else if (head.robots.join("|") !== row.robots.join("|")) {
      failures.push(
        `${row.htmlPath}: robots ${row.robots.join("|") || "(なし)"} → ${head.robots.join("|") || "(なし)"}`,
      );
    }
  }
  const exposed = pages.flatMap((page) =>
    [
      ...page.head.canonicals,
      ...page.head.alternates.map((alternate) => alternate.href),
      page.head.meta.get("og:url") ?? "",
    ]
      .filter(exposesInternalLocale)
      .map(
        (url) =>
          `${pageLabel(page)}: 内部の /${DEFAULT_LOCALE} が出ている ${url}`,
      ),
  );
  // 英語の索引対象は自己 canonical。noindex は日本語と同じく canonical を
  // 持たなくてよい（持つなら自分）
  const enCanonical = pages
    .filter((page) => page.locale !== DEFAULT_LOCALE)
    .flatMap((page) => {
      const expected = expectedUrl(page.path, page.locale);
      const selfCanonical =
        page.head.canonicals.length === 1 &&
        page.head.canonicals[0] === expected;
      const allowNone =
        !isEnIndexable(page.path) && page.head.canonicals.length === 0;
      return selfCanonical || allowNone
        ? []
        : [
            `${pageLabel(page)}: canonical ${page.head.canonicals.join(" ") || "(なし)"}（期待 ${expected}${isEnIndexable(page.path) ? "" : " か無し"}）`,
          ];
    });
  report.check(
    "canonical の台帳",
    `baseline ${baseline.canonicals.length} 件中 ${compared} 件を照合、英語 ${pages.filter((page) => page.locale !== DEFAULT_LOCALE).length} 件`,
    [...failures, ...exposed, ...enCanonical],
  );
}

/** 日本語で索引させるパス（移行前の sitemap に載っていたもの） */
function japaneseIndexable(baseline: Baseline): ReadonlySet<string> {
  const paths = new Set<string>();
  for (const entry of baseline.sitemap.entries) {
    const parsed = parseSiteUrl(entry.loc);
    if (parsed?.locale === DEFAULT_LOCALE) paths.add(parsed.path);
  }
  return paths;
}

function expectedAlternatesOf(
  path: string,
  jaIndexable: ReadonlySet<string>,
): Readonly<Record<string, string>> {
  return expectedAlternates(path, jaIndexable.has(path), isEnIndexable(path));
}

/** 5. hreflang */
function auditHreflang(
  report: Report,
  pages: readonly StaticPage[],
  jaIndexable: ReadonlySet<string>,
): void {
  const byUrl = new Map(
    pages.map((page) => [expectedUrl(page.path, page.locale), page]),
  );
  const failures: string[] = [];
  let withAlternates = 0;
  for (const page of pages) {
    const { map, duplicates } = alternateMap(page.head);
    const expected = expectedAlternatesOf(page.path, jaIndexable);
    if (Object.keys(map).length > 0) withAlternates += 1;
    for (const key of duplicates)
      failures.push(`${pageLabel(page)}: hreflang=${key} が重複`);
    if (!sameRecord(map, expected)) {
      failures.push(
        `${pageLabel(page)}: ${formatRecord(map)}（期待 ${formatRecord(expected)}）`,
      );
      continue;
    }
    for (const href of Object.values(map)) {
      if (!href.startsWith("https://"))
        failures.push(`${pageLabel(page)}: 絶対 HTTPS URL でない ${href}`);
      const target = byUrl.get(href);
      if (!target) {
        failures.push(
          `${pageLabel(page)}: 相手 ${href} が 200 の静的な HTML に無い`,
        );
        continue;
      }
      if (isNoindex(target.head.robots))
        failures.push(`${pageLabel(page)}: 相手 ${href} が noindex`);
      if (target.head.canonicals[0] !== href) {
        failures.push(
          `${pageLabel(page)}: 相手 ${href} の canonical が ${target.head.canonicals[0] ?? "(なし)"}`,
        );
      }
      if (!sameRecord(alternateMap(target.head).map, map)) {
        failures.push(
          `${pageLabel(page)}: 相手 ${href} の hreflang が相互でない`,
        );
      }
    }
  }
  report.check(
    "hreflang（HTML）",
    `${pages.length} 件を照合、alternate を持つページ ${withAlternates} 件`,
    failures,
  );
}

/** 6. 初期 HTML の本文 */
function auditInitialBody(
  report: Report,
  pages: readonly StaticPage[],
  jaIndexable: ReadonlySet<string>,
): void {
  const failures: string[] = [];
  const notes: string[] = [];
  let checked = 0;
  const problems = (page: StaticPage): string[] => {
    const { body } = page;
    const found: string[] = [];
    if (body.visibleMains === 0) found.push("見える <main> が無い");
    if (body.mainH1s === 0) found.push("見える <main> に空でない h1 が無い");
    if (body.firstVisibleH1 === "") found.push("文書順で最初の h1 が空");
    if (body.mainTextLength < MIN_MAIN_TEXT) {
      found.push(
        `見える本文が ${body.mainTextLength} 文字（${MIN_MAIN_TEXT} 未満）`,
      );
    }
    if (body.hiddenH1s.length > 0 && body.mainH1s === 0) {
      found.push(
        `h1 が hidden の下にだけある（${body.hiddenH1s.join(" / ")}）`,
      );
    }
    const pilot = PILOT_BODIES.get(page.path);
    if (pilot) {
      if (body.mainTh < pilot.minTh)
        found.push(`th が ${body.mainTh}（${pilot.minTh} 以上）`);
      if (body.mainTd < pilot.minTd)
        found.push(`td が ${body.mainTd}（${pilot.minTd} 以上）`);
      for (const text of pilot.texts[page.locale] ?? []) {
        if (!body.mainText.includes(text))
          found.push(`本文に「${text}」が無い`);
      }
    }
    return found;
  };
  for (const page of pages) {
    const indexable =
      page.locale === DEFAULT_LOCALE
        ? jaIndexable.has(page.path)
        : isEnIndexable(page.path);
    const found = problems(page);
    // 英語では広告を出さない。札の文言は辞書にあり監査は知らないので、
    // 広告のリンクが必ず持つ rel="sponsored" で判定する
    if (page.locale !== DEFAULT_LOCALE && page.body.sponsoredLinks > 0) {
      found.push(
        `広告のリンク（rel="sponsored"）が ${page.body.sponsoredLinks} 本ある（英語では広告を出さない）`,
      );
    }
    if (indexable) {
      checked += 1;
      for (const problem of found)
        failures.push(`${pageLabel(page)}: ${problem}`);
    } else if (found.length > 0) {
      notes.push(`${pageLabel(page)}（索引対象外）: ${found.join(" / ")}`);
    }
  }
  report.check(
    "初期 HTML の本文（静的な索引対象）",
    `${checked} 件を検査（点数表は th / td と既知の点数まで、英語は広告の有無も）`,
    failures,
    notes,
  );
}

/** 7. sitemap */
function auditSitemap(
  report: Report,
  baseline: Baseline,
  serverAppDir: string,
  pages: readonly StaticPage[],
  jaIndexable: ReadonlySet<string>,
): void {
  const file = join(serverAppDir, "sitemap.xml.body");
  if (!existsSync(file)) {
    report.check("sitemap", "sitemap.xml の成果物が無い", [`${file} が無い`]);
    return;
  }
  const parsed = parseSitemap(readFileSync(file, "utf8"));
  if (parsed.error) {
    report.check("sitemap", "XML として解析できない", [parsed.error]);
    return;
  }
  if (baseline.sitemap.error) {
    report.check("sitemap", "baseline の sitemap を解析できない", [
      baseline.sitemap.error,
    ]);
    return;
  }
  const failures: string[] = [];
  const locCounts = new Map<string, number>();
  for (const entry of parsed.entries) {
    locCounts.set(entry.loc, (locCounts.get(entry.loc) ?? 0) + 1);
  }
  for (const [loc, count] of locCounts) {
    if (count > 1) failures.push(`${loc}: ${count} 回載っている`);
  }
  const isJapanese = (entry: SitemapEntry) =>
    parseSiteUrl(entry.loc)?.locale === DEFAULT_LOCALE;
  const japanese = parsed.entries.filter(isJapanese);
  const english = parsed.entries.filter((entry) => !isJapanese(entry));
  const baselineLocs = baseline.sitemap.entries.map((entry) => entry.loc);
  const missing = difference(
    baselineLocs,
    new Set(japanese.map((entry) => entry.loc)),
  );
  const unexpected = difference(
    japanese.map((entry) => entry.loc),
    new Set(baselineLocs),
  );
  failures.push(
    ...missing.map((loc) => `missing: ${loc}`),
    ...unexpected.map((loc) => `unexpected-ja: ${loc}`),
  );
  if (
    missing.length === 0 &&
    unexpected.length === 0 &&
    japanese.map((entry) => entry.loc).join("\n") !== baselineLocs.join("\n")
  ) {
    failures.push("日本語の掲載順が移行前と違う");
  }
  const baselineByLoc = new Map(
    baseline.sitemap.entries.map((entry) => [entry.loc, entry]),
  );
  for (const entry of japanese) {
    const before = baselineByLoc.get(entry.loc);
    if (!before) continue;
    for (const key of ["lastmod", "changefreq", "priority"] as const) {
      if (entry[key] !== before[key]) {
        failures.push(
          `${entry.loc}: ${key} ${before[key] ?? "(なし)"} → ${entry[key] ?? "(なし)"}`,
        );
      }
    }
  }
  const expectedEnglish = expectedEnIndexablePaths(jaIndexable).map((path) =>
    expectedUrl(path, "en"),
  );
  failures.push(
    ...difference(
      expectedEnglish,
      new Set(english.map((entry) => entry.loc)),
    ).map((loc) => `英語の索引対象が載っていない: ${loc}`),
    ...difference(
      english.map((entry) => entry.loc),
      new Set(expectedEnglish),
    ).map((loc) => `英語の未公開 / noindex / 404 が載っている: ${loc}`),
  );
  const pageByUrl = new Map(
    pages.map((page) => [expectedUrl(page.path, page.locale), page]),
  );
  let withAlternates = 0;
  for (const entry of parsed.entries) {
    const target = parseSiteUrl(entry.loc);
    if (!target) {
      failures.push(`${entry.loc}: 本番の origin でない`);
      continue;
    }
    const expected = expectedAlternatesOf(target.path, jaIndexable);
    if (Object.keys(entry.alternates).length > 0) withAlternates += 1;
    if (!sameRecord(entry.alternates, expected)) {
      failures.push(
        `${entry.loc}: alternate ${formatRecord(entry.alternates)}（期待 ${formatRecord(expected)}）`,
      );
    }
    const page = pageByUrl.get(entry.loc);
    if (!page) continue; // 動的なページ（お知らせ詳細等）は http.ts が実応答で見る
    if (isNoindex(page.head.robots))
      failures.push(`${entry.loc}: HTML が noindex`);
    if (page.head.canonicals[0] !== entry.loc) {
      failures.push(
        `${entry.loc}: HTML の canonical が ${page.head.canonicals[0] ?? "(なし)"}`,
      );
    }
    if (!sameRecord(alternateMap(page.head).map, entry.alternates)) {
      failures.push(`${entry.loc}: alternate が HTML と違う`);
    }
  }
  report.check(
    "sitemap",
    `URL ${parsed.entries.length} 件（日本語 ${japanese.length}・英語 ${english.length}、baseline ${baselineLocs.length}）、alternate を持つ URL ${withAlternates} 件、missing ${missing.length}・unexpected-ja ${unexpected.length}`,
    failures,
  );
}

/** JSON-LD から `url` と `inLanguage` を集める（入れ子・@graph を含む） */
function collectJsonLdFields(
  value: unknown,
  urls: string[],
  languages: string[],
): void {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdFields(item, urls, languages);
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, field] of Object.entries(value)) {
    if (key === "url" && typeof field === "string") urls.push(field);
    else if (key === "inLanguage" && typeof field === "string")
      languages.push(field);
    else collectJsonLdFields(field, urls, languages);
  }
}

/** 8. SNS・構造化データ */
function auditSocial(
  report: Report,
  pages: readonly StaticPage[],
  jaIndexable: ReadonlySet<string>,
): void {
  const failures: string[] = [];
  let checked = 0;
  for (const page of pages) {
    const indexable =
      page.locale === DEFAULT_LOCALE
        ? jaIndexable.has(page.path)
        : isEnIndexable(page.path);
    if (!indexable) continue;
    checked += 1;
    const { head } = page;
    const label = pageLabel(page);
    if (head.lang !== page.locale)
      failures.push(`${label}: html lang=${head.lang}`);
    if (head.title.trim() === "") failures.push(`${label}: title が空`);
    for (const key of [
      "description",
      "og:title",
      "og:description",
      "og:url",
      "og:image",
      "twitter:card",
      "twitter:title",
      "twitter:image",
    ]) {
      if ((head.meta.get(key) ?? "").trim() === "")
        failures.push(`${label}: ${key} が無い`);
    }
    const ogUrl = head.meta.get("og:url");
    if (ogUrl !== undefined && ogUrl !== head.canonicals[0]) {
      failures.push(`${label}: og:url ${ogUrl} が canonical と違う`);
    }
    const ogLocale = head.meta.get("og:locale");
    if (ogLocale !== undefined && ogLocale !== OG_LOCALES[page.locale]) {
      failures.push(`${label}: og:locale ${ogLocale}`);
    }
    const image = head.meta.get("og:image") ?? "";
    if (image !== "" && !image.startsWith(`${SITE_ORIGIN}/`)) {
      failures.push(`${label}: og:image が本番の絶対 URL でない ${image}`);
    }
    for (const error of head.jsonLdErrors)
      failures.push(`${label}: JSON-LD を解析できない ${error}`);
    const urls: string[] = [];
    const languages: string[] = [];
    collectJsonLdFields(head.jsonLd, urls, languages);
    for (const url of urls) {
      if (!url.startsWith(SITE_ORIGIN)) continue; // 外部（運営者のサイト等）
      if (exposesInternalLocale(url))
        failures.push(
          `${label}: JSON-LD の url に内部の /${DEFAULT_LOCALE}: ${url}`,
        );
    }
    for (const language of languages) {
      if (!language.toLowerCase().startsWith(page.locale)) {
        failures.push(`${label}: JSON-LD の inLanguage=${language}`);
      }
    }
  }
  report.check(
    "SNS・構造化データ（静的な索引対象の head）",
    `${checked} 件を検査`,
    failures,
  );
}

function main(): void {
  const argv = process.argv.slice(2);
  const baselineDir = readArg(argv, "baseline");
  const nextDir = resolve(
    readArg(argv, "next-dir") ?? join(process.cwd(), ".next"),
  );
  const report = createReport();
  if (!baselineDir) {
    report.check("引数", "--baseline <dir> が要る", ["--baseline が無い"]);
    process.exitCode = printReport("SEO build 監査", report) ? 0 : 1;
    return;
  }
  const serverAppDir = join(nextDir, "server", "app");
  const manifests = [
    join(nextDir, "prerender-manifest.json"),
    join(nextDir, "app-path-routes-manifest.json"),
  ];
  const absent = [...manifests, serverAppDir].filter(
    (path) => !existsSync(path),
  );
  if (absent.length > 0) {
    report.check(
      "build の成果物",
      "next build の成果物が無い（skip せず失敗にする）",
      absent.map((path) => `${path} が無い`),
    );
    process.exitCode = printReport("SEO build 監査", report) ? 0 : 1;
    return;
  }
  const baseline = readBaseline(resolve(baselineDir));
  const current = readBuildArtifacts(manifests[0], manifests[1], serverAppDir);
  const pages = loadStaticPages(current, serverAppDir);
  const jaIndexable = japaneseIndexable(baseline);

  auditStaticLedger(report, baseline, current);
  auditDynamicLedger(report, baseline, current);
  auditEnglishArtifacts(report, baseline, current, pages, jaIndexable);
  auditCanonicalLedger(report, baseline, serverAppDir, pages);
  auditHreflang(report, pages, jaIndexable);
  auditInitialBody(report, pages, jaIndexable);
  auditSitemap(report, baseline, serverAppDir, pages, jaIndexable);
  auditSocial(report, pages, jaIndexable);

  const out = readArg(argv, "out");
  if (out) writeReportJson(resolve(out), report);
  process.exitCode = printReport("SEO build 監査", report) ? 0 : 1;
}

main();
