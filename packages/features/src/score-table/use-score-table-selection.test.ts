// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ScoreTableFocus } from "./focus";
import {
  useScoreTableSelection,
  type ScoreTableSelectionInput,
} from "./use-score-table-selection";

const DEFAULTS: ScoreTableSelectionInput = {
  focus: undefined,
  initialRole: "ko",
  initialWinType: "ron",
  initialViewMode: "normal",
};

describe("useScoreTableSelection", () => {
  it("focus が無ければ初期値で開き、切り替えられる", () => {
    const { result } = renderHook(() => useScoreTableSelection(DEFAULTS));
    expect(result.current.activeTab).toBe("ko");
    expect(result.current.winType).toBe("ron");
    expect(result.current.viewMode).toBe("normal");
    expect(result.current.isFocusView).toBe(false);
    act(() => result.current.setActiveTab("oya"));
    expect(result.current.activeTab).toBe("oya");
    expect(result.current.isKo).toBe(false);
  });

  it("focus はタブ・表示モードの初期値になり、同じ組を見ている間だけ isFocusView", () => {
    const focus: ScoreTableFocus = {
      role: "oya",
      winType: "tsumo",
      han: 6,
      fu: 30,
    };
    const { result } = renderHook(() =>
      useScoreTableSelection({ ...DEFAULTS, focus }),
    );
    expect(result.current.activeTab).toBe("oya");
    expect(result.current.winType).toBe("tsumo");
    expect(result.current.viewMode).toBe("high_score");
    expect(result.current.isFocusView).toBe(true);
    act(() => result.current.setWinType("ron"));
    expect(result.current.isFocusView).toBe(false);
  });

  it("後から届いた focus にタブを合わせ直し、同じ内容の別オブジェクトでは戻さない", () => {
    const { result, rerender } = renderHook(
      (input: ScoreTableSelectionInput) => useScoreTableSelection(input),
      { initialProps: DEFAULTS },
    );
    act(() => result.current.setActiveTab("oya"));
    const focus: ScoreTableFocus = {
      role: "ko",
      winType: "tsumo",
      han: 2,
      fu: 40,
    };
    rerender({ ...DEFAULTS, focus });
    expect(result.current.activeTab).toBe("ko");
    expect(result.current.winType).toBe("tsumo");
    expect(result.current.viewMode).toBe("normal");

    act(() => result.current.setActiveTab("oya"));
    rerender({ ...DEFAULTS, focus: { ...focus } });
    expect(result.current.activeTab).toBe("oya");
  });

  it("セルの隠しはトグルで、他のセルに影響しない", () => {
    const { result } = renderHook(() => useScoreTableSelection(DEFAULTS));
    act(() => result.current.toggleCell("a"));
    act(() => result.current.toggleCell("b"));
    act(() => result.current.toggleCell("a"));
    expect(result.current.hiddenCells).toEqual({ a: false, b: true });
  });
});
