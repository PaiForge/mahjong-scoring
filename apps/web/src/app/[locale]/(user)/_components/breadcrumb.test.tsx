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
    const { container, getByLabelText, getByText } = renderIn("en");

    // ホーム（/en）と「Reference」（/en/reference）は英語では未公開
    expect(getByLabelText("Home").tagName).toBe("SPAN");
    expect(getByText("Reference").tagName).toBe("SPAN");
    expect(hrefs(container)).toEqual([]);
    // 残るのは現在地だけで、BreadcrumbList として意味を持たないので出さない
    expect(readSchema(container)).toBeNull();
  });

  it("英語で公開しているページは英語の URL へリンクし、JSON-LD の item も英語のページ", () => {
    const { container } = renderIn("en", [
      { label: "Score table", href: "/reference/score-table" },
      { label: "Details" },
    ]);

    expect(hrefs(container)).toEqual(["/en/reference/score-table"]);
    expect(readSchema(container)).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Score table",
          item: `${SITE_URL}/en/reference/score-table`,
        },
        { "@type": "ListItem", position: 2, name: "Details" },
      ],
    });
  });
});
