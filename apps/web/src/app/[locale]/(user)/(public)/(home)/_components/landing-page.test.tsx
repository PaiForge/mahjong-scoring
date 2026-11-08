/**
 * トップページ（LP）の CTA のテスト
 *
 * 日本語の LP の CTA は今までどおりの `next/link`（言語またぎの印も
 * hrefLang も無い）で、英語の LP の CTA は公開状態で張る先が決まることを固定する。
 * 英語の公開状態は許可リスト（`translated-publications.ts`）を差し替えて
 * 与え、許可リストの現在の中身に依らずに規則だけを確かめる。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, within } from "@testing-library/react";

const { enPublished } = vi.hoisted(() => ({
  enPublished: { current: new Set<string>() },
}));

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));
vi.mock("@/i18n/translated-publications", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/i18n/translated-publications")>()),
  getTranslatedPublication: (path: string) =>
    enPublished.current.has(path) ? "published-indexable" : "unpublished",
}));
// 目次（ChapterTocList）は別の担当の部品で、ここでは CTA だけを見る
vi.mock(
  "@/app/[locale]/(user)/(public)/lessons/_components/chapter-toc-list",
  () => ({ ChapterTocList: () => null }),
);

const { LandingPage } = await import("./landing-page");
const { heroCtaTarget } = await import("./hero-section");
const { translatedPublishedPaths } =
  await import("@/i18n/translated-publications");

const JAPANESE_ONLY = "language.japaneseOnly";

/** CTA のラベル（辞書キー）を持つリンクを返す */
function ctaLink(container: HTMLElement, labelKey: string): HTMLAnchorElement {
  const link = within(container)
    .getByText(labelKey)
    .closest<HTMLAnchorElement>("a");
  if (link === null) throw new Error(`${labelKey} のリンクが無い`);
  return link;
}

describe("LandingPage", () => {
  beforeEach(() => {
    enPublished.current = new Set();
  });

  it("日本語の LP の CTA は今までどおりの行き先で、言語またぎの印も hrefLang も無い", () => {
    const { container } = render(<LandingPage locale="ja" />);

    const expected = {
      ctaGetStarted: "/getting-started",
      practiceCta: "/practice",
      referenceCta: "/reference/demo",
      learnCta: "/lessons",
    };
    for (const [key, href] of Object.entries(expected)) {
      const link = ctaLink(container, key);
      expect(link.getAttribute("href")).toBe(href);
      expect(link.hasAttribute("hrefLang")).toBe(false);
    }
    expect(container.textContent).not.toContain(JAPANESE_ONLY);
  });

  it("英語の LP のヒーローは、案内ページが英語で未公開ならレッスンの目次（英語）へ向ける", () => {
    enPublished.current = new Set(["/", "/lessons"]);
    const { container } = render(<LandingPage locale="en" />);

    const hero = ctaLink(container, "ctaGetStarted");
    expect(hero.getAttribute("href")).toBe("/en/lessons");
    expect(hero.hasAttribute("hrefLang")).toBe(false);
    expect(hero.textContent).not.toContain(JAPANESE_ONLY);
  });

  it("英語の LP の節の CTA は、英語で未公開の行き先を日本語へ素の <a hrefLang=ja> と印付きで向ける", () => {
    enPublished.current = new Set(["/", "/lessons"]);
    const { container } = render(<LandingPage locale="en" />);

    for (const [key, href] of [
      ["practiceCta", "/practice"],
      ["referenceCta", "/reference/demo"],
    ] as const) {
      const link = ctaLink(container, key);
      expect(link.getAttribute("href")).toBe(href);
      expect(link.getAttribute("hrefLang")).toBe("ja");
      expect(link.textContent).toContain(JAPANESE_ONLY);
    }

    const learn = ctaLink(container, "learnCta");
    expect(learn.getAttribute("href")).toBe("/en/lessons");
    expect(learn.hasAttribute("hrefLang")).toBe(false);
    expect(learn.textContent).not.toContain(JAPANESE_ONLY);
  });

  it("今の許可リストでは、英語の LP の CTA はどれも英語のページ（はじめ方・練習・デモ・レッスン）を言語をまたがずに指す", () => {
    enPublished.current = new Set(translatedPublishedPaths("en"));
    const { container } = render(<LandingPage locale="en" />);

    const expected = {
      ctaGetStarted: "/en/getting-started",
      practiceCta: "/en/practice",
      referenceCta: "/en/reference/demo",
      learnCta: "/en/lessons",
    };
    for (const [key, href] of Object.entries(expected)) {
      const link = ctaLink(container, key);
      expect(link.getAttribute("href"), key).toBe(href);
      expect(link.hasAttribute("hrefLang"), key).toBe(false);
      expect(link.textContent, key).not.toContain(JAPANESE_ONLY);
    }
  });
});

describe("heroCtaTarget", () => {
  beforeEach(() => {
    enPublished.current = new Set();
  });

  it("日本語では常に案内ページ", () => {
    expect(heroCtaTarget("ja")).toEqual({
      href: "/getting-started",
      crossLocale: false,
    });
  });

  it("案内ページを英語で公開したら英語の案内ページへ戻る", () => {
    enPublished.current = new Set(["/getting-started", "/lessons"]);
    expect(heroCtaTarget("en")).toEqual({
      href: "/en/getting-started",
      crossLocale: false,
    });
  });

  it("レッスンの目次も英語で未公開なら、日本語の目次へ言語をまたいで向ける", () => {
    expect(heroCtaTarget("en")).toEqual({
      href: "/lessons",
      crossLocale: true,
    });
  });
});
