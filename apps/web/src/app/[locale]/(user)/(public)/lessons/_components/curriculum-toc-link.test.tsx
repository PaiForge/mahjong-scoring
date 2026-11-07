import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

import { CurriculumTocLink } from "./curriculum-toc-link";

const { requestLocale, forceCrossLocale } = vi.hoisted(() => ({
  requestLocale: { current: "ja" as SupportedLocale },
  forceCrossLocale: { current: false },
}));

vi.mock("next-intl/server", async () => ({
  ...(await import("@/test/intl-mock")),
  getLocale: () => Promise.resolve(requestLocale.current),
}));
// 目次の公開状態は本物の許可リストで解決する（`/lessons` は英語で公開済み）。
// 未公開の場合の描き方だけ、フラグで言語をまたぐ結果に差し替えて見る
vi.mock(
  "@/app/[locale]/(user)/_components/_lib/locale-nav-target",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("@/app/[locale]/(user)/_components/_lib/locale-nav-target")
      >();
    return {
      resolveNavTargetFor: (path: string, locale: SupportedLocale) =>
        forceCrossLocale.current
          ? { href: path, crossLocale: true }
          : actual.resolveNavTargetFor(path, locale),
    };
  },
);

afterEach(() => {
  cleanup();
  requestLocale.current = "ja";
  forceCrossLocale.current = false;
});

describe("CurriculumTocLink", () => {
  it("日本語のページでは接頭辞なしの目次へリンクする", async () => {
    const { container } = render(await CurriculumTocLink());

    const anchor = container.querySelector("a");
    expect(anchor?.getAttribute("href")).toBe("/lessons");
  });

  it("日本語のページで章を指すと、目次のその章の位置へリンクする", async () => {
    const { container } = render(
      await CurriculumTocLink({ focusSlug: "jantou-fu" }),
    );

    const anchor = container.querySelector("a");
    expect(anchor?.getAttribute("href")).toBe("/lessons#chapter-jantou-fu");
  });

  it("英語のページでは英語の目次へリンクする（日本語の目次へクライアント遷移しない）", async () => {
    requestLocale.current = "en";
    const { container } = render(
      await CurriculumTocLink({ focusSlug: "jantou-fu" }),
    );

    const anchor = container.querySelector("a");
    expect(anchor?.getAttribute("href")).toBe("/en/lessons#chapter-jantou-fu");
    expect(anchor?.hasAttribute("hrefLang")).toBe(false);
  });

  it("目次がその言語で未公開なら、日本語の目次へ文書ごと移り「日本語のみ」を添える", async () => {
    requestLocale.current = "en";
    forceCrossLocale.current = true;
    const { container } = render(await CurriculumTocLink());

    const anchor = container.querySelector("a");
    expect(anchor?.getAttribute("href")).toBe("/lessons");
    expect(anchor?.getAttribute("hrefLang")).toBe("ja");
    expect(anchor?.textContent).toContain("language.japaneseOnly");
  });
});
