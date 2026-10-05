// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { FinalResult } from "./use-timed-session";
import { useOnFinished } from "./use-on-finished";

const FINAL = {
  correctCount: 3,
  incorrectCount: 1,
  totalCount: 4,
  reason: "timeUp",
  finishedAt: 1,
} as unknown as FinalResult;

describe("useOnFinished", () => {
  it("終了が確定したときに最新のコールバックを 1 回だけ呼ぶ", () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender } = renderHook(
      ({ finalResult, onFinished }) => useOnFinished(finalResult, onFinished),
      {
        initialProps: {
          finalResult: undefined as FinalResult | undefined,
          onFinished: first,
        },
      },
    );
    expect(first).not.toHaveBeenCalled();

    rerender({ finalResult: FINAL, onFinished: latest });
    rerender({ finalResult: { ...FINAL }, onFinished: latest });

    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
    expect(latest).toHaveBeenCalledWith(FINAL);
  });
});
