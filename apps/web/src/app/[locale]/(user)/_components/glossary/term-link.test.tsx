/**
 * TermLink の用語リンク設定への追従テスト
 *
 * @description
 * - 既定（設定なし）: 用語ページへの `<a href>` を描く
 * - 用語リンクをオフ: 表示語だけを地の文として残し、リンクを描かない
 * - 英語のページ: 英語の用語ページへ張る（英語で出していなければ日本語の
 *   ページへ `hrefLang="ja"` で向ける）
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

  it("英語のページでは、その言語の公開状態に合わせて用語ページへ張る", () => {
    const { container } = render(
      withLocale(
        "en",
        <TermLink slug="pinfu" href="/reference/glossary/pinfu">
          pinfu
        </TermLink>,
      ),
    );

    const anchor = container.querySelector("a");
    if (
      getTranslatedPublication("/reference/glossary/pinfu", "en") ===
      "unpublished"
    ) {
      expect(anchor?.getAttribute("href")).toBe("/reference/glossary/pinfu");
      expect(anchor?.getAttribute("hrefLang")).toBe("ja");
    } else {
      expect(anchor?.getAttribute("href")).toBe("/en/reference/glossary/pinfu");
      expect(anchor?.getAttribute("hrefLang")).toBeNull();
    }
  });
});
