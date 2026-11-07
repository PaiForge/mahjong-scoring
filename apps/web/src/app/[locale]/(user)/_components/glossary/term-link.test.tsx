/**
 * TermLink の用語リンク設定への追従テスト
 *
 * @description
 * - 既定（設定なし）: 用語ページへの `<a href>` を描く
 * - 用語リンクをオフ: 表示語だけを地の文として残し、リンクを描かない
 * - 英語のページ: 英語で公開している用語ページ（`/en/reference/glossary/<slug>`）へ
 *   言語またぎの印なしで張る
 */
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { useDisplaySettingsStore } from "@/app/_hooks/use-display-settings-store";
import { getTranslatedPublication } from "@/i18n/translated-publications";

import { TermLink } from "./term-link";

function withLocale(locale: "ja" | "en", children: ReactNode) {
  return (
    <NextIntlClientProvider locale={locale} messages={{}}>
      {children}
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  useDisplaySettingsStore.setState({ termLinks: true });
});

afterEach(() => {
  cleanup();
});

describe("TermLink", () => {
  it("既定では用語ページへのリンクを描く", () => {
    const { container } = render(
      withLocale(
        "ja",
        <TermLink slug="pinfu" href="/reference/glossary/pinfu">
          平和
        </TermLink>,
      ),
    );

    const anchor = container.querySelector("a");
    expect(anchor?.getAttribute("href")).toBe("/reference/glossary/pinfu");
    expect(anchor?.getAttribute("hrefLang")).toBeNull();
    expect(anchor?.textContent).toBe("平和");
  });

  it("用語リンクをオフにすると表示語だけが残る", () => {
    useDisplaySettingsStore.setState({ termLinks: false });

    const { container } = render(
      withLocale(
        "ja",
        <TermLink slug="pinfu" href="/reference/glossary/pinfu">
          平和
        </TermLink>,
      ),
    );

    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toBe("平和");
  });

  it("英語のページでは英語の用語ページへ張り、hrefLang を付けない", () => {
    const { container } = render(
      withLocale(
        "en",
        <TermLink slug="pinfu" href="/reference/glossary/pinfu">
          pinfu
        </TermLink>,
      ),
    );

    const anchor = container.querySelector("a");
    expect(anchor?.getAttribute("href")).toBe("/en/reference/glossary/pinfu");
    expect(anchor?.getAttribute("hrefLang")).toBeNull();
  });

  it("前提: 用語ページは英語で公開している（取り下げたら日本語への向け先を検査する）", () => {
    expect(getTranslatedPublication("/reference/glossary/pinfu", "en")).toBe(
      "published-indexable",
    );
  });
});
