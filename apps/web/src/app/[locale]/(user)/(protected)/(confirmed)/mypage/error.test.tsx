import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import MypageError from "./error";

function renderIn(locale: SupportedLocale) {
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "en" ? enMessages : jaMessages}
    >
      <MypageError error={new Error("boom")} reset={() => {}} />
    </NextIntlClientProvider>,
  );
}

describe("マイページのエラー境界", () => {
  it("日本語の見出し・説明・ボタンは英語化の前の直書きの文言のまま", () => {
    renderIn("ja");
    expect(screen.getByText("マイページを読み込めませんでした")).toBeTruthy();
    expect(
      screen.getByText(
        "一時的な問題が発生した可能性があります。もう一度お試しください。",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "もう一度試す" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "ホームへ戻る" }).getAttribute("href"),
    ).toBe("/");
  });

  it("英語のページは英語の辞書の文言で出て、ホームは /en を指す", () => {
    renderIn("en");
    expect(screen.getByText(enMessages.mypage.error.title)).toBeTruthy();
    expect(screen.getByText(enMessages.mypage.error.description)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: enMessages.errorPage.retry }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: enMessages.errorPage.goHome })
        .getAttribute("href"),
    ).toBe("/en");
    expect(screen.queryByText(/[぀-ヿ一-鿿]/u)).toBeNull();
  });
});
