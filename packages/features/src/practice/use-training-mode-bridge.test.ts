// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useTrainingModeBridge } from "./use-training-mode-bridge";

describe("useTrainingModeBridge", () => {
  it("盤面が「次の問題へ」を登録するまでは「わからない」を押せない", () => {
    const reveal = vi.fn();
    const { result } = renderHook(() =>
      useTrainingModeBridge({
        isRevealed: false,
        isHolding: false,
        showFeedback: false,
        reveal,
      }),
    );
    expect(result.current.revealDisabled).toBe(true);
    result.current.reveal();
    expect(reveal).not.toHaveBeenCalled();

    const advance = vi.fn();
    act(() => result.current.trainingMode.registerAdvance(advance));
    expect(result.current.revealDisabled).toBe(false);
    act(() => result.current.reveal());
    expect(reveal).toHaveBeenCalledWith(advance);
  });
});
