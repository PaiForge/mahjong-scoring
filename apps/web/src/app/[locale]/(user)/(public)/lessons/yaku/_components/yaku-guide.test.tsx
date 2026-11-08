import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { currentLocale } from "@/i18n/current-locale";
import { YakuGuide } from "./yaku-guide";

vi.mock("@/i18n/current-locale", () => ({ currentLocale: vi.fn() }));
vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));
vi.mock("../../_components/yaku-naki-comparison-table", () => ({
  YakuNakiComparisonTable: () => null,
}));

describe("YakuGuide reference link", () => {
  it.each([
    ["ja", "/reference/yaku"],
    ["en", "/en/reference/yaku"],
  ] as const)("%s の本文から同じ言語の役一覧へ移る", async (locale, href) => {
    vi.mocked(currentLocale).mockResolvedValue(locale);
    render(await YakuGuide());
    expect(
      screen.getByRole("link", { name: "referenceLink" }).getAttribute("href"),
    ).toBe(href);
  });
});
