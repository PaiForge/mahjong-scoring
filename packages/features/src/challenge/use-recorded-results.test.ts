// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useRecordedResults } from "./use-recorded-results";

describe("useRecordedResults", () => {
  it("時間切れなら出題中の問題を末尾に付け、ミス上限なら付けない", () => {
    const { result } = renderHook(() => useRecordedResults<string>());
    act(() => {
      result.current.recordResult("q1");
      result.current.presentQuestion("q2-unanswered");
    });
    expect(result.current.collect(true)).toEqual(["q1", "q2-unanswered"]);
    expect(result.current.collect(false)).toEqual(["q1"]);
  });

  it("答えた問題の預かりは捨てるので二重に載らない", () => {
    const { result } = renderHook(() => useRecordedResults<string>());
    act(() => {
      result.current.presentQuestion("q1-unanswered");
      result.current.recordResult("q1");
    });
    expect(result.current.collect(true)).toEqual(["q1"]);
  });
});
