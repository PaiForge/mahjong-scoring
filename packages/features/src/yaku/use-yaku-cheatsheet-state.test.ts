// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useYakuCheatsheetState } from "./use-yaku-cheatsheet-state";

describe("useYakuCheatsheetState", () => {
  it("成立役を早見表の項目名に解決して印を付け、載らない役は落とす", () => {
    const { result } = renderHook(() =>
      useYakuCheatsheetState(["立直", "役牌 白", "混一色"]),
    );
    expect(result.current.markedYakuNames).toEqual(["役牌", "混一色"]);
  });

  it("早見表に載らない役は開けない", () => {
    const { result } = renderHook(() => useYakuCheatsheetState([]));
    expect(result.current.canOpenYakuCheatsheet("役牌 東")).toBe(true);
    expect(result.current.canOpenYakuCheatsheet("立直")).toBe(false);
  });

  it("指定した項目に送って開き、閉じられる", () => {
    const { result } = renderHook(() => useYakuCheatsheetState([]));
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.openAt("役牌"));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.focusedYakuName).toBe("役牌");

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });
});
