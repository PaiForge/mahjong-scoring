// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useQuestionScopedSelection } from "./use-question-scoped-selection";

describe("useQuestionScopedSelection", () => {
  it("出題番号が変わった最初の描画から未選択として読む", () => {
    const { result, rerender } = renderHook(
      ({ questionIndex }) => useQuestionScopedSelection<number>(questionIndex),
      { initialProps: { questionIndex: 0 } },
    );
    act(() => result.current[1](2));
    expect(result.current[0]).toBe(2);

    rerender({ questionIndex: 1 });
    expect(result.current[0]).toBeUndefined();
  });
});
