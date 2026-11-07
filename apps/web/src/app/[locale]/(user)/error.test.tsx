import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import UserError from "./error";

function renderIn(locale: SupportedLocale) {
  const messages = locale === "en" ? enMessages : jaMessages;
  render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <UserError error={new Error("boom")} reset={() => {}} />
    </NextIntlClientProvider>,
  );
  return messages.errorPage;
}

describe("(user) のエラー境界", () => {
  it.each(["ja", "en"] as const)(
    "%s: 見出し・説明・再試行・ホームへのリンクがすべてその言語の辞書から出る",
    (locale) => {
      const errorPage = renderIn(locale);
      expect(screen.getByText(errorPage.title)).toBeTruthy();
      expect(screen.getByText(errorPage.description)).toBeTruthy();
      expect(
        screen.getByRole("button", { name: errorPage.retry }),
      ).toBeTruthy();
      expect(
        screen
          .getByRole("link", { name: errorPage.goHome })
          .getAttribute("href"),
      ).toBe("/");
    },
  );

  it("英語のページに日本語の既定値が混ざらない", () => {
    renderIn("en");
    expect(screen.queryByText("もう一度試す")).toBeNull();
    expect(screen.queryByText("ホームへ戻る")).toBeNull();
  });
});
