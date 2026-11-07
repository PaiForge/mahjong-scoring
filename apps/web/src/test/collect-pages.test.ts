import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  collectPages,
  collectPageTemplates,
  expandLocaleRoutes,
  stripLocaleSegment,
} from "./collect-pages";

/** 一時ディレクトリに app ツリーを作る（`relativeDirs` の各ディレクトリに page.tsx を置く） */
function makeAppTree(root: string, relativeDirs: readonly string[]): void {
  for (const dir of relativeDirs) {
    const full = join(root, dir);
    mkdirSync(full, { recursive: true });
    writeFileSync(join(full, "page.tsx"), "export default function P() {}\n");
  }
}

describe("collectPages / collectPageTemplates", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "collect-pages-"));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("app route はそのまま（[locale] を残し route group と private folder を落とす）", () => {
    makeAppTree(root, [
      "[locale]/(user)/(public)/(home)",
      "[locale]/(user)/(public)/practice",
      "[locale]/(user)/_components/x",
      "admin/(dashboard)",
    ]);
    expect([...collectPages(root).keys()].sort()).toEqual([
      "/[locale]",
      "/[locale]/practice",
      "/admin",
    ]);
  });

  it("テンプレートは先頭の [locale] だけを外し、他の動的セグメントは残す", () => {
    makeAppTree(root, [
      "[locale]/(user)/(public)/(home)",
      "[locale]/(user)/(public)/dojo/ranks/[slug]",
      "[locale]/(user)/(public)/dojo/(index)",
      "admin/users/[id]",
    ]);
    const templates = collectPageTemplates(root);
    expect([...templates.keys()].sort()).toEqual([
      "/",
      "/admin/users/[id]",
      "/dojo",
      "/dojo/ranks/[slug]",
    ]);
    expect(templates.get("/dojo/ranks/[slug]")?.localized).toBe(true);
    expect(templates.get("/admin/users/[id]")?.localized).toBe(false);
    expect(templates.get("/")?.appRoute).toBe("/[locale]");
  });

  it("[locale] の内と外で同じテンプレートになるページは上書きせずに例外にする", () => {
    makeAppTree(root, ["[locale]/(user)/admin", "admin"]);
    expect(() => collectPageTemplates(root)).toThrow(
      /同じテンプレート \/admin/,
    );
  });
});

describe("stripLocaleSegment", () => {
  it.each([
    ["/[locale]", "/", true],
    ["/[locale]/practice", "/practice", true],
    ["/admin", "/admin", false],
    ["/x/[locale]", "/x/[locale]", false],
  ])("%s → %s", (appRoute, template, localized) => {
    expect(stripLocaleSegment(appRoute)).toEqual({ template, localized });
  });
});

describe("expandLocaleRoutes", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "collect-pages-"));
    makeAppTree(root, [
      "[locale]/(user)/(public)/(home)",
      "[locale]/(user)/(public)/practice",
      "admin",
    ]);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("1 枚のページから言語の数だけルートを作り、どちらの言語も失わない", () => {
    const routes = expandLocaleRoutes(collectPageTemplates(root), ["ja", "en"]);
    expect(
      routes
        .map((route) => [route.locale, route.internalPath, route.publicPath])
        .sort(),
    ).toEqual([
      ["en", "/en", "/en"],
      ["en", "/en/practice", "/en/practice"],
      ["ja", "/ja", "/"],
      ["ja", "/ja/practice", "/practice"],
    ]);
  });

  it("[locale] の外のページは展開しない", () => {
    const routes = expandLocaleRoutes(collectPageTemplates(root), ["ja", "en"]);
    expect(routes.some((route) => route.template === "/admin")).toBe(false);
  });
});
