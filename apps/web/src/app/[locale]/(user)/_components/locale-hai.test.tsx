import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";

import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";
import { render } from "@/test/tile-image-render";

import { LocaleHai } from "./locale-hai";

function renderIn(locale: SupportedLocale, ui: ReactElement) {
  const messages = locale === "en" ? enMessages : jaMessages;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("LocaleHai", () => {
  it.each([
    [0, "一萬"],
    [27, "東"],
    [33, "中"],
  ] as const)(
    "日本語: alt を省略すると牌種 %i はライブラリの既定と同じ %s",
    (hai, alt) => {
      renderIn("ja", <LocaleHai hai={hai} />);
      expect(screen.getByRole("img").getAttribute("alt")).toBe(alt);
    },
  );

  it.each([
    [0, "1 man"],
    [13, "5 pin"],
    [26, "9 sou"],
    [27, "East"],
    [31, "White dragon"],
  ] as const)("英語: alt を省略すると牌種 %i は英語の牌名 %s", (hai, alt) => {
    renderIn("en", <LocaleHai hai={hai} />);
    expect(screen.getByRole("img").getAttribute("alt")).toBe(alt);
  });

  it.each(["ja", "en"] as const)(
    "%s: alt を指定したらその値のまま（装飾の空文字も英語の牌名で上書きしない）",
    (locale) => {
      const { container, unmount } = renderIn(
        locale,
        <LocaleHai hai={0} alt="" />,
      );
      expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
      unmount();

      renderIn(locale, <LocaleHai hai={0} alt="custom" />);
      expect(screen.getByRole("img").getAttribute("alt")).toBe("custom");
    },
  );
});
