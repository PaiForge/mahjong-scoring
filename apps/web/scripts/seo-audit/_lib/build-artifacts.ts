/**
 * `next build` の成果物（manifest と `.next/server/app` の HTML）を読む
 *
 * 静的 / 動的の分類は build の route table と同じ情報源（prerender manifest と
 * app-path-routes manifest）から、**ロケールを展開した後の実パス**で決める。
 * `app/[locale]` 配下の 1 枚の page は、`/[locale]/practice` という 1 つの app route が
 * `/ja/practice` と `/en/practice` の 2 つのプリレンダーを持つ。app route の単位で
 * 「プリレンダーがあるか」を見ると、英語の not-found（未公開の英語は 404 として
 * 静的生成される）だけがあって日本語は要求ごとに描画される（ƒ）ルートを静的と
 * 誤認する。そこで言語ごとに、その言語の接頭辞を持つプリレンダーだけを数える。
 *
 * 未公開の英語の not-found の成果物は、通常のページの静的 / 動的の分類とは別に
 * 数える。Next 16 はこれを `notFoundRoutes` ではなく `routes` に載せ、`.meta` の
 * `status: 404` で区別する（`notFoundRoutes` は空のことがある）ので、両方を見る。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { z } from "zod";

const prerenderManifestSchema = z.object({
  routes: z.record(
    z.string(),
    z.object({
      routeType: z.string().optional(),
      srcRoute: z.string().nullable().optional(),
      initialRevalidateSeconds: z
        .union([z.number(), z.literal(false)])
        .optional(),
    }),
  ),
  dynamicRoutes: z.record(z.string(), z.unknown()),
  notFoundRoutes: z.array(z.string()).default([]),
});

const appPathRoutesSchema = z.record(z.string(), z.string());

const metaSchema = z.object({ status: z.number().optional() });

/** プリレンダーされたルート 1 本 */
export interface PrerenderedRoute {
  /** 内部パス（`/ja/practice`・`/robots.txt`） */
  readonly key: string;
  /** 生成元の app route（`/[locale]/practice`）。無ければ key と同じ */
  readonly srcRoute: string;
  /** `page` / `route` */
  readonly routeType: string;
  /** プリレンダーの HTTP ステータス（not-found は 404） */
  readonly status: number;
  /** ISR の秒数（false は再検証なし） */
  readonly revalidate: number | false | undefined;
}

/** build の成果物 */
export interface BuildArtifacts {
  /** ページ（`/page` で終わる app path）の app route */
  readonly pageRoutes: readonly string[];
  readonly prerendered: readonly PrerenderedRoute[];
  /** `generateStaticParams` で列挙する app route（prerender manifest の dynamicRoutes） */
  readonly ssgRoutes: ReadonlySet<string>;
  /** `.next/server/app` の絶対パス（HTML・`.meta` の置き場） */
  readonly serverAppDir: string | undefined;
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readStatus(
  serverAppDir: string | undefined,
  key: string,
  notFound: ReadonlySet<string>,
): number {
  if (notFound.has(key)) return 404;
  if (!serverAppDir) return 200;
  const metaPath = join(serverAppDir, `${key === "/" ? "/index" : key}.meta`);
  if (!existsSync(metaPath)) return 200;
  return metaSchema.parse(readJson(metaPath)).status ?? 200;
}

/**
 * manifest 2 つから成果物を読む
 *
 * @param prerenderManifestPath - `prerender-manifest.json`
 * @param appPathRoutesManifestPath - `app-path-routes-manifest.json`
 * @param serverAppDir - `.next/server/app`（baseline のように HTML が無いときは undefined）
 * @throws manifest が無い・形が違うとき
 */
export function readBuildArtifacts(
  prerenderManifestPath: string,
  appPathRoutesManifestPath: string,
  serverAppDir: string | undefined,
): BuildArtifacts {
  const prerender = prerenderManifestSchema.parse(
    readJson(prerenderManifestPath),
  );
  const appPaths = appPathRoutesSchema.parse(
    readJson(appPathRoutesManifestPath),
  );
  const notFound: ReadonlySet<string> = new Set(prerender.notFoundRoutes);
  return {
    pageRoutes: Object.entries(appPaths)
      .filter(([source]) => source.endsWith("/page"))
      .map(([, route]) => route),
    prerendered: Object.entries(prerender.routes).map(([key, route]) => ({
      key,
      srcRoute: route.srcRoute ?? key,
      routeType: route.routeType ?? "page",
      status: readStatus(serverAppDir, key, notFound),
      revalidate: route.initialRevalidateSeconds,
    })),
    ssgRoutes: new Set(Object.keys(prerender.dynamicRoutes)),
    serverAppDir,
  };
}

/**
 * ある app route（とロケール）の分類
 *
 * - `static` — その言語で 200 のプリレンダーがある（SSG / ISR）
 * - `not-found` — その言語のプリレンダーがすべて 404（未公開の英語）
 * - `ssg-empty` — `generateStaticParams` で列挙するルートなのに、その言語の値が 0 件
 * - `dynamic` — プリレンダーが無く、要求ごとに描画する（route table の ƒ）
 */
export type RouteKind = "static" | "not-found" | "ssg-empty" | "dynamic";

/** {@link classifyRoute} の結果 */
export interface RouteClassification {
  readonly kind: RouteKind;
  /** 200 のプリレンダー */
  readonly ok: readonly PrerenderedRoute[];
  /** 404 のプリレンダー（not-found の成果物） */
  readonly notFound: readonly PrerenderedRoute[];
}

/** 内部パスがその言語のものか（`/ja` と `/ja/...`） */
export function isLocaleKey(key: string, locale: string): boolean {
  return key === `/${locale}` || key.startsWith(`/${locale}/`);
}

/**
 * app route を言語ごとに分類する
 *
 * @param artifacts - {@link readBuildArtifacts} の結果
 * @param appRoute - `/[locale]/practice`・`/admin`
 * @param locale - `app/[locale]` 配下なら言語。外なら undefined
 */
export function classifyRoute(
  artifacts: BuildArtifacts,
  appRoute: string,
  locale: string | undefined,
): RouteClassification {
  const prerenders = artifacts.prerendered.filter(
    (route) =>
      route.routeType === "page" &&
      (route.srcRoute === appRoute || route.key === appRoute) &&
      (locale === undefined || isLocaleKey(route.key, locale)),
  );
  const ok = prerenders.filter((route) => route.status !== 404);
  const notFound = prerenders.filter((route) => route.status === 404);
  const kind: RouteKind =
    ok.length > 0
      ? "static"
      : notFound.length > 0
        ? "not-found"
        : artifacts.ssgRoutes.has(appRoute)
          ? "ssg-empty"
          : "dynamic";
  return { kind, ok, notFound };
}

/**
 * 内部パスを公開 URL のパスにする
 *
 * 既定の言語は接頭辞を外し（`/ja/x` → `/x`、`/ja` → `/`）、他の言語はそのまま。
 * どの言語の接頭辞も持たないもの（`/_not-found` 等）は undefined。
 *
 * @param key - 内部パス
 * @param locales - 言語（先頭が既定）
 */
export function toPublicPath(
  key: string,
  locales: readonly string[],
): { readonly locale: string; readonly publicPath: string } | undefined {
  const [defaultLocale] = locales;
  for (const locale of locales) {
    if (!isLocaleKey(key, locale)) continue;
    if (locale !== defaultLocale) return { locale, publicPath: key };
    const rest = key.slice(locale.length + 1);
    return { locale, publicPath: rest === "" ? "/" : rest };
  }
  return undefined;
}

/**
 * 内部パスの HTML の場所（`.next/server/app` 相対）
 *
 * `/ja` → `ja.html`、`/ja/company` → `ja/company.html`、`/` → `index.html`。
 */
export function htmlRelativePath(key: string): string {
  return key === "/" ? "index.html" : `${key.slice(1)}.html`;
}
