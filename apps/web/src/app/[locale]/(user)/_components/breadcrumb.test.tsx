import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { SITE_URL } from "@/config";

import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import { Breadcrumb, type BreadcrumbItem } from "./breadcrumb";

const ITEMS: readonly BreadcrumbItem[] = [
  { label: "Reference", href: "/reference" },
  { label: "Score table" },
];

function renderIn(
  locale: SupportedLocale,
  items: readonly BreadcrumbItem[] = ITEMS,
) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "en" ? enMessages : jaMessages}
    >
      <Breadcrumb items={items} />
    </NextIntlClientProvider>,
  );
}

/** 埋め込んだ BreadcrumbList の JSON-LD を読む */
function readSchema(container: HTMLElement): unknown {
  const script = container.querySelector('script[type="application/ld+json"]');
  return JSON.parse(script?.textContent ?? "null");
}

function hrefs(container: HTMLElement): (string | null)[] {
  return [...container.querySelectorAll("a")].map((a) =>
    a.getAttribute("href"),
  );
}

describe("Breadcrumb", () => {
  it("日本語はホームを「ホーム」と呼び、接頭辞の無い URL を指す（既存の出力のまま）", () => {
    const { container, getByLabelText } = renderIn("ja");

    expect(getByLabelText("ホーム").getAttribute("href")).toBe("/");
    expect(hrefs(container)).toEqual(["/", "/reference"]);
    expect(readSchema(container)).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Reference",
          item: `${SITE_URL}/reference`,
        },
        // 現在地は item を持たない
        { "@type": "ListItem", position: 3, name: "Score table" },
      ],
    });
  });

  it("英語は英語で出していないページ（404 になる /en/...）へリンクせず、JSON-LD にも載せない", () => {
    // 練習一覧・練習の説明ページは英語では未公開。ホーム（/en）は公開している
    const { container, getByLabelText, getByText } = renderIn("en", [
      { label: "Practice", href: "/practice" },
      { label: "Pair fu", href: "/practice/jantou-fu" },
      { label: "Play" },
    ]);

    expect(getByLabelText("Home").getAttribute("href")).toBe("/en");
    expect(getByText("Practice").tagName).toBe("SPAN");
    expect(getByText("Pair fu").tagName).toBe("SPAN");
    // 未公開の段は文字だけ残し、/en/practice のような存在しない URL を作らない
    expect(hrefs(container)).toEqual(["/en"]);
    expect(readSchema(container)).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${SITE_URL}/en`,
        },
        { "@type": "ListItem", position: 2, name: "Play" },
      ],
    });
  });

  it("JSON-LD に載る段が 2 つ未満（ホームだけ）なら BreadcrumbList として意味を持たないので出さない", () => {
    const { container } = renderIn("en", []);

    expect(hrefs(container)).toEqual(["/en"]);
    expect(readSchema(container)).toBeNull();
  });

  it("英語で公開しているページは英語の URL へリンクし、JSON-LD の item も英語のページ", () => {
    // ホーム（/en）と早見表のハブ（/en/reference）は英語で公開している
    const { container, getByLabelText } = renderIn("en");

    expect(getByLabelText("Home").getAttribute("href")).toBe("/en");
    expect(hrefs(container)).toEqual(["/en", "/en/reference"]);
    expect(readSchema(container)).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${SITE_URL}/en`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Reference",
          item: `${SITE_URL}/en/reference`,
        },
        { "@type": "ListItem", position: 3, name: "Score table" },
      ],
    });
  });
});
