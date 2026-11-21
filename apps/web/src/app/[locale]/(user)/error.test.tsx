import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import UserError from "./error";

function renderIn(locale: SupportedLocale, retry: () => void = () => {}) {
  const messages = locale === "en" ? enMessages : jaMessages;
  render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <UserError error={new Error("boom")} retry={retry} />
    </NextIntlClientProvider>,
  );
  return messages.errorPage;
}

describe("(user) のエラー境界", () => {
  // ホームへのリンクはその言語のトップ。英語のトップ（`/en`）は公開しているので
  // 英語のエラーからは `/en` へ戻す（未公開の言語のトップへは向けない —
  // `publishedHomeHref`）。
  it.each([
    ["ja", "/"],
    ["en", "/en"],
  ] as const)(
    "%s: 見出し・説明・再試行・ホームへのリンクがすべてその言語の辞書から出て、ホームは %s を指す",
    (locale, homeHref) => {
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
      ).toBe(homeHref);
    },
  );

  // サーバーでの描画の失敗は、取り直さないと同じエラーに戻る。再試行のボタンは
  // error.tsx の `retry`（サーバーから取り直す）を呼ぶ。
  it("再試行のボタンは retry を呼ぶ", () => {
    const retry = vi.fn();
    const errorPage = renderIn("ja", retry);
    fireEvent.click(screen.getByRole("button", { name: errorPage.retry }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("英語のページに日本語の既定値が混ざらない", () => {
    renderIn("en");
    expect(screen.queryByText("もう一度試す")).toBeNull();
    expect(screen.queryByText("ホームへ戻る")).toBeNull();
  });
});
