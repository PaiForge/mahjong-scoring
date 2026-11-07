/**
 * 用語モーダルの中身のテスト
 *
 * @description
 * - 用語リンクを押すと、その語の意味と用語ページへの導線が出る
 * - 同じモーダルに、用語リンクを切る設定への導線が出る
 *   （設定ページを自分から見に行く読者しか設定に辿り着けない状態を避ける）
 * - 英語のページでは 2 本の導線をその言語で張り、英語で出していない
 *   ページ（設定）は日本語のページへ「日本語のみ」と添えて向ける
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { useDisplaySettingsStore } from "@/app/_hooks/use-display-settings-store";
import { getTranslatedPublication } from "@/i18n/translated-publications";

import { GlossaryTermModalProvider } from "./glossary-term-modal-provider";
import { TermLink } from "./term-link";

const TERMS = {
  pinfu: {
    slug: "pinfu",
    term: "平和",
    reading: "ピンフ",
    definition: "符が付く要素がひとつもない門前限定の1翻役。",
    href: "/reference/glossary/pinfu",
  },
} as const;

const JAPANESE_ONLY = "Japanese only";

function renderChapter(locale: "ja" | "en" = "ja") {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={{ nav: { language: { japaneseOnly: JAPANESE_ONLY } } }}
    >
      <GlossaryTermModalProvider
        terms={TERMS}
        viewDetailsLabel="用語ページを見る"
        turnOffLabel="用語リンクなしで表示する"
        closeLabel="閉じる"
      >
        <p>
          <TermLink slug="pinfu" href="/reference/glossary/pinfu">
            平和
          </TermLink>
          で和了る
        </p>
      </GlossaryTermModalProvider>
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  useDisplaySettingsStore.setState({ termLinks: true });
});

afterEach(() => {
  cleanup();
});

describe("GlossaryTermModalProvider", () => {
  it("用語リンクを押すと語の意味を出す", () => {
    renderChapter();
    fireEvent.click(screen.getByRole("link", { name: "平和" }));

    expect(screen.getByText("ピンフ")).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: "用語ページを見る" })
        .getAttribute("href"),
    ).toBe("/reference/glossary/pinfu");
  });

  it("用語リンクを切る設定への導線を出す", () => {
    renderChapter();
    fireEvent.click(screen.getByRole("link", { name: "平和" }));

    const settings = screen.getByRole("link", {
      name: "用語リンクなしで表示する",
    });
    expect(settings.getAttribute("href")).toBe("/preferences#term-links");
    expect(settings.getAttribute("hrefLang")).toBeNull();
    expect(screen.queryByText(JAPANESE_ONLY)).toBeNull();
  });

  it("英語のページでは用語ページへの導線を、公開状態に合わせて張る", () => {
    renderChapter("en");
    fireEvent.click(screen.getByRole("link", { name: "平和" }));

    const details = screen.getByRole("link", { name: "用語ページを見る" });
    if (
      getTranslatedPublication("/reference/glossary/pinfu", "en") ===
      "unpublished"
    ) {
      expect(details.getAttribute("href")).toBe("/reference/glossary/pinfu");
      expect(details.getAttribute("hrefLang")).toBe("ja");
    } else {
      expect(details.getAttribute("href")).toBe("/en/reference/glossary/pinfu");
      expect(details.getAttribute("hrefLang")).toBeNull();
    }
  });

  it("英語のページで英語版の無い設定へは、日本語のページへ「日本語のみ」と添えて向ける", () => {
    renderChapter("en");
    fireEvent.click(screen.getByRole("link", { name: "平和" }));

    const settings = screen.getByRole("link", {
      name: "用語リンクなしで表示する",
    });
    if (getTranslatedPublication("/preferences", "en") === "unpublished") {
      expect(settings.getAttribute("href")).toBe("/preferences#term-links");
      expect(settings.getAttribute("hrefLang")).toBe("ja");
      expect(screen.getByText(JAPANESE_ONLY)).toBeDefined();
    } else {
      expect(settings.getAttribute("href")).toBe("/en/preferences#term-links");
      expect(screen.queryByText(JAPANESE_ONLY)).toBeNull();
    }
  });
});
