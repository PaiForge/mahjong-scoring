// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { IntlProvider } from "use-intl";
import { YAKUMAN_HAN } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";
import { messages } from "@mahjong-scoring/messages/ja";

import { useYakumanRoundingNote } from "./use-yakuman-rounding-note";

function wrapper({ children }: { readonly children: ReactNode }) {
  return createElement(IntlProvider, {
    locale: "ja",
    timeZone: "Asia/Tokyo",
    messages,
    children,
  });
}

describe("useYakumanRoundingNote", () => {
  it("翻数即答と翻数の内訳の辞書から丸めの補足を引く", () => {
    const { result } = renderHook(
      () =>
        useYakumanRoundingNote(
          [
            { name: "四暗刻", han: 13 },
            { name: "ドラ", han: 3 },
          ],
          YAKUMAN_HAN,
        ),
      { wrapper },
    );
    expect(result.current).toBe("16翻 → 役満（13翻以上は役満）");
  });
});
