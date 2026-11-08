/// <reference types="node" />
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * クライアントのツリーから重いサーバー用モジュールへ届かないことの検査
 *
 * `route-policy.ts` は日本語の分類のために sitemap のレジストリ（教本・用語・
 * 段級位・料金）を読む。`"use client"` のファイルからそこへ import の鎖が届くと、
 * レジストリごとクライアントの JS に載る（パンくずとエラー境界から届き、LP が
 * 読むチャンクにも入っていた）。クライアントが公開状態を要るときは
 * `translated-publications.ts`（既定以外の言語の許可リストだけ）を読む。
 *
 * `"use client"` のファイルを起点に、web の中の import（`@/` と相対パス）を
 * 推移的に辿る。型だけの import（`import type` / `export type`）は出力に
 * 残らないので辿らない。Server Action（`"use server"`）の先も辿らない。
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB_SRC = resolve(HERE, "..");

/** クライアントのツリーから届いてはいけないモジュール */
const SERVER_ONLY_MODULES = [
  resolve(WEB_SRC, "i18n/route-policy.ts"),
  resolve(WEB_SRC, "app/_lib/sitemap-routes.ts"),
] as const;

function listSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      files.push(...listSourceFiles(path));
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) {
      files.push(path);
    }
  }
  return files;
}

function hasDirective(source: string, directive: string): boolean {
  return new RegExp(`^\\s*(?:\\/\\/[^\\n]*\\n\\s*)*["']${directive}["']`).test(
    source,
  );
}

function isClientEntry(source: string): boolean {
  return hasDirective(source, "use client");
}

/**
 * クライアントの JS に中身が入らない境界か
 *
 * Server Action のファイル（`"use server"`）はクライアントへ参照だけが渡り、
 * その先の import はサーバーに残るので辿らない。
 */
function isServerBoundary(source: string): boolean {
  return hasDirective(source, "use server");
}

/** 実行時に残る import の指定子（型だけの import を除く） */
function runtimeSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const pattern =
    /(?:^|\n)\s*(?:import|export)\s+(type\s+)?(?:[\s\S]*?\sfrom\s+)?["']([^"']+)["']/g;
  for (const match of source.matchAll(pattern)) {
    if (match[1] === undefined && match[2] !== undefined) {
      specifiers.push(match[2]);
    }
  }
  for (const match of source.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) {
    if (match[1] !== undefined) specifiers.push(match[1]);
  }
  return specifiers;
}

function resolveSpecifier(from: string, specifier: string): string | undefined {
  let base: string;
  if (specifier.startsWith("@/")) {
    base = resolve(WEB_SRC, specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    base = resolve(dirname(from), specifier);
  } else {
    return undefined;
  }
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  return candidates.find(
    (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
  );
}

/** 起点から禁止モジュールへ届く import の鎖（届かなければ undefined） */
function findChain(
  entry: string,
  forbidden: ReadonlySet<string>,
): string[] | undefined {
  const parents = new Map<string, string | undefined>([[entry, undefined]]);
  const queue = [entry];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    if (forbidden.has(current)) {
      const chain: string[] = [];
      for (
        let node: string | undefined = current;
        node !== undefined;
        node = parents.get(node)
      ) {
        chain.unshift(relative(WEB_SRC, node));
      }
      return chain;
    }
    const source = readFileSync(current, "utf8");
    if (current !== entry && isServerBoundary(source)) continue;
    for (const specifier of runtimeSpecifiers(source)) {
      const next = resolveSpecifier(current, specifier);
      if (next !== undefined && !parents.has(next)) {
        parents.set(next, current);
        queue.push(next);
      }
    }
  }
  return undefined;
}

describe("クライアントのツリーの境界", () => {
  const clientEntries = listSourceFiles(WEB_SRC).filter((file) =>
    isClientEntry(readFileSync(file, "utf8")),
  );

  it("`use client` のファイルを見つけている（走査の前提）", () => {
    expect(clientEntries.length).toBeGreaterThan(50);
  });

  it("`use client` のファイルから route-policy・sitemap-routes へ届かない", () => {
    const forbidden = new Set<string>(SERVER_ONLY_MODULES);
    const violations = clientEntries.flatMap((entry) => {
      const chain = findChain(entry, forbidden);
      return chain === undefined ? [] : [chain.join(" → ")];
    });
    expect(violations).toEqual([]);
  });

  it("鎖の検出が効いている（自己検査: 禁止モジュールを起点にすると自分に届く）", () => {
    const [routePolicy] = SERVER_ONLY_MODULES;
    expect(findChain(routePolicy, new Set([routePolicy]))).toEqual([
      "i18n/route-policy.ts",
    ]);
  });
});
