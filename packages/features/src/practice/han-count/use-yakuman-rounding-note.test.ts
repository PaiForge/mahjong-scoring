// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { YAKUMAN_HAN } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { IntlWrapper } from "../../test/intl-wrapper";
import { useYakumanRoundingNote } from "./use-yakuman-rounding-note";

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
      { wrapper: IntlWrapper },
    );
    expect(result.current).toBe("16翻 → 役満（13翻以上は役満）");
  });
});
