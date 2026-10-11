// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { YAKUMAN_HAN } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { IntlWrapper } from "../../test/intl-wrapper";
import { useYakumanRounding } from "./use-yakuman-rounding";

describe("useYakumanRounding", () => {
  it("翻数即答の辞書から丸めた結論の行を引く", () => {
    const { result } = renderHook(
      () =>
        useYakumanRounding(
          [
            { name: "四暗刻", han: 13 },
            { name: "ドラ", han: 3 },
          ],
          YAKUMAN_HAN,
        ),
      { wrapper: IntlWrapper },
    );
    expect(result.current).toEqual({ label: "13翻以上は", value: "役満" });
  });
});
