/**
 * 移行前（英語の導入前）の成果物の台帳を読む
 *
 * baseline のディレクトリは移行前の HEAD で `next build` / `next start` して
 * 採ったもので、監査はこれを書き換えない（読み取り専用）。中身:
 *
 * - `prerender-manifest.json` / `app-path-routes-manifest.json` — 静的生成の集合と動的ルート
 * - `canonicals.tsv` — `.next/server/app` 配下の HTML ごとの「相対パス・canonical・robots」
 *   （robots は複数の meta を `|` で連結）
 * - `sitemap.xml` — 掲載 URL・lastmod・changefreq・priority
 * - `http.tsv` / `urls.txt` — URL ごとの HTTP ステータスと Location
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { type BuildArtifacts, readBuildArtifacts } from "./build-artifacts";
import { type ParsedSitemap, parseSitemap } from "./sitemap-xml";

/** canonical 台帳の 1 行 */
export interface CanonicalRow {
  /** `.next/server/app` 相対の HTML（`company.html`・`index.html`） */
  readonly htmlPath: string;
  readonly canonical: string;
  /** robots の meta（出現順） */
  readonly robots: readonly string[];
}

/** HTTP 台帳の 1 行 */
export interface HttpRow {
  readonly path: string;
  readonly status: number;
  /** Location（origin を外したパス。無ければ空） */
  readonly location: string;
}

/** baseline 一式 */
export interface Baseline {
  readonly build: BuildArtifacts;
  readonly canonicals: readonly CanonicalRow[];
  readonly sitemap: ParsedSitemap;
  readonly http: readonly HttpRow[];
}

/** baseline に要るファイル */
const REQUIRED_FILES = [
  "prerender-manifest.json",
  "app-path-routes-manifest.json",
  "canonicals.tsv",
  "sitemap.xml",
  "http.tsv",
] as const;

function readLines(path: string): string[] {
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "");
}

/** URL の origin を外してパス（+ query）にする。パスならそのまま */
export function stripOrigin(url: string): string {
  if (url === "") return "";
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

/**
 * baseline のディレクトリを読む
 *
 * @param dir - baseline のディレクトリ
 * @throws 必要なファイルが無いとき
 */
export function readBaseline(dir: string): Baseline {
  const missing = REQUIRED_FILES.filter((file) => !existsSync(join(dir, file)));
  if (missing.length > 0) {
    throw new Error(`baseline に無いファイル: ${missing.join(", ")}（${dir}）`);
  }
  return {
    build: readBuildArtifacts(
      join(dir, "prerender-manifest.json"),
      join(dir, "app-path-routes-manifest.json"),
      undefined,
    ),
    canonicals: readLines(join(dir, "canonicals.tsv")).map((line) => {
      const [htmlPath = "", canonical = "", robots = ""] = line.split("\t");
      return {
        htmlPath,
        canonical,
        robots: robots === "" ? [] : robots.split("|"),
      };
    }),
    sitemap: parseSitemap(readFileSync(join(dir, "sitemap.xml"), "utf8")),
    http: readLines(join(dir, "http.tsv")).map((line) => {
      const [path = "", status = "", location = ""] = line.split("\t");
      return { path, status: Number(status), location: stripOrigin(location) };
    }),
  };
}
