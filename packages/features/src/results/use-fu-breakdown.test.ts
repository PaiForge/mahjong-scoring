// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IntlWrapper } from "../test/intl-wrapper";
import { useFuBreakdown } from "./use-fu-breakdown";

describe("useFuBreakdown", () => {
  it("渡した名前空間の辞書で行・合計・切り上げ後の符を引く", () => {
    const { result } = renderHook(
      () =>
        useFuBreakdown(
          [
            { reason: "副底", fu: 20 },
            { reason: "中張牌の暗刻", fu: 4 },
            { reason: "嵌張待ち", fu: 2 },
            { reason: "ツモ", fu: 2 },
            { reason: "幺九牌の暗刻", fu: 4 },
          ],
          40,
          "totalFu",
        ),
      { wrapper: IntlWrapper },
    );

    expect(result.current).toEqual({
      rows: [
        { label: "副底", value: "20符" },
        { label: "中張牌の暗刻", value: "4符" },
        { label: "嵌張待ち", value: "2符" },
        { label: "ツモ", value: "2符" },
        { label: "幺九牌の暗刻", value: "4符" },
      ],
      total: { label: "合計", value: "32符" },
      rounded: { label: "切り上げ後", value: "40符" },
    });
  });
});
