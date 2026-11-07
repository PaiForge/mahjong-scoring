/**
 * TryPracticeLinks のテスト
 *
 * 体験ページ・早見表の連動サンプルの下に置く導線のうち、このファイルが持つ
 * 「LP へ戻る」リンクが今の言語の LP へ張られることを固定する。練習のカードと
 * バナーは自分で言語を取る共有の部品なので、ここでは差し替えて描かない。
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { localeRef } = vi.hoisted(() => ({ localeRef: { current: "ja" } }));

vi.mock("next-intl/server", async () => ({
  ...(await import("@/test/intl-mock")),
  getLocale: () => Promise.resolve(localeRef.current),
}));
vi.mock("next/navigation", async () => ({
  ...(await import("@/test/navigation-mock")),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
}));
vi.mock("next/link", async () => await import("@/test/next-link-mock"));
vi.mock(
  "@/app/[locale]/(user)/(public)/practice/_components/catalog-practice-card",
  () => ({ CatalogPracticeCard: () => null }),
);
vi.mock(
  "@/app/[locale]/(user)/(public)/practice/_components/practical-practice-banners",
  () => ({
    AgariScorePracticeBanner: () => null,
    TenpaiScorePracticeBanner: () => null,
  }),
);

const { TryPracticeLinks } = await import("./try-practice-links");

async function renderIn(locale: "ja" | "en") {
  localeRef.current = locale;
  render(await TryPracticeLinks());
}

afterEach(() => {
  cleanup();
});

describe("TryPracticeLinks", () => {
  it("日本語のページでは LP（/）へ戻る", async () => {
    await renderIn("ja");

    const link = screen.getByRole("link", { name: "backToHome" });
    expect(link.getAttribute("href")).toBe("/");
    expect(link.getAttribute("hrefLang")).toBeNull();
  });

  it("英語のページでは英語の LP（/en）へ戻り、日本語のみの印を付けない", async () => {
    await renderIn("en");

    const link = screen.getByRole("link", { name: "backToHome" });
    expect(link.getAttribute("href")).toBe("/en");
    expect(link.getAttribute("hrefLang")).toBeNull();
    expect(screen.queryByText("language.japaneseOnly")).toBeNull();
  });
});
